import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import { Plus, Trash2, ImagePlus, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../store/settingsStore";
import type { ClientResponse } from "../../lib/api";

export interface InvoiceData {
    invoiceNumber: string | null;
    clientId: string;
    items: { description: string; quantity: number; unit_price: number }[];
    notes: string;
    status: string;
    issueDate: string | null;
    dueDate: string | null;
}

export interface InvoiceEditorRef {
    getData: () => InvoiceData;
}

interface Props {
    clients: ClientResponse[];
    initialData?: any;
    onChange?: (data: any) => void;
}

export const InvoiceEditor = forwardRef<InvoiceEditorRef, Props>(({ clients, initialData, onChange }, ref) => {
    // --- Date Helpers ---
    const formatDate = (date: Date): string =>
        date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const computeDueDate = (terms: string | undefined): string => {
        const today = new Date();
        if (!terms || terms === 'DueOnReceipt') return formatDate(today);
        const days = terms === 'Net15' ? 15 : terms === 'Net30' ? 30 : terms === 'Net60' ? 60 : 0;
        const due = new Date(today);
        due.setDate(due.getDate() + days);
        return formatDate(due);
    };

    const parseDateToISO = (dateStr: string): string | null => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    };

    // --- State ---
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || "");
    const [invoiceDate, setInvoiceDate] = useState(() => {
        if (initialData?.issueDate) return formatDate(new Date(initialData.issueDate));
        return formatDate(new Date());
    });
    const customNotes = initialData?.notes ? JSON.parse(initialData.notes) : null;
    const [developer, setDeveloper] = useState(customNotes?.developer || "");
    const [dueDate, setDueDate] = useState(() => {
        if (initialData?.dueDate) return formatDate(new Date(initialData.dueDate));
        return "";
    });
    const [status, setStatus] = useState(initialData?.status || "Draft");

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
    const selectedClient = clients.find((c) => c.id === selectedClientId);

    const profile = useSettingsStore(state => state.profile);
    const bankDetailsFromStore = useSettingsStore(state => state.bankDetails);

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial settings & data on mount
    useEffect(() => {
        let mounted = true;

        // Fetch Bank Details to store
        useSettingsStore.getState().fetchBankDetails();

        // Fetch Logo
        invoke<string | null>('get_logo')
            .then((data) => {
                if (mounted && data) {
                    setLogoPreview(data);
                }
            })
            .catch(console.error);

        // Fetch QR
        invoke<string | null>('get_qr')
            .then((data) => {
                if (mounted && data) {
                    setQrCodeUrl(data);
                }
            })
            .catch(console.error);

        return () => {
            mounted = false;
        };
    }, []);

    // Auto-populate Developer Name
    useEffect(() => {
        if (profile?.name && !developer) {
            setDeveloper(profile.name);
        }
    }, [profile?.name]);

    // Auto-set Due Date from Payment Terms
    useEffect(() => {
        setDueDate(computeDueDate(profile?.default_payment_terms));
    }, [profile?.default_payment_terms]);

    // Auto-populate Bank Details
    useEffect(() => {
        if (bankDetailsFromStore) {
            setAccountHolder((prev: string) => prev || bankDetailsFromStore.accountHolder);
            setAccountNumber((prev: string) => prev || bankDetailsFromStore.accountNumber);
            setIfscCode((prev: string) => prev || bankDetailsFromStore.ifscCode);
            setBankName((prev: string) => prev || bankDetailsFromStore.bankName);
            setBranch((prev: string) => prev || bankDetailsFromStore.branch);
            setUpiId((prev: string) => prev || bankDetailsFromStore.upiId);
        }
    }, [bankDetailsFromStore]);

    // Project Details (Dynamic Key-Value Pairs)
    const [projectDetails, setProjectDetails] = useState(customNotes?.projectDetails || [
        { id: 1, label: "Website Name", value: "" },
        { id: 2, label: "Tech Stack", value: "" },
        { id: 3, label: "Domain Name", value: "" },
        { id: 4, label: "Hosting / Server", value: "" },
        { id: 5, label: "Development Period", value: "" },
        { id: 6, label: "Maintenance Status", value: "" }
    ]);

    // Line Items
    const [lineItems, setLineItems] = useState<{ id: number, description: string, amount: number }[]>(() => {
        if (initialData?.items && initialData.items.length > 0) {
            return initialData.items.map((i: any, index: number) => ({
                id: index + 1,
                description: i.description,
                amount: i.unit_price
            }));
        }
        return [
            {
                id: 1,
                description: "",
                amount: 0
            }
        ];
    });

    // Bank Details
    const [accountHolder, setAccountHolder] = useState(customNotes?.bankDetails?.accountHolder || "");
    const [accountNumber, setAccountNumber] = useState(customNotes?.bankDetails?.accountNumber || "");
    const [ifscCode, setIfscCode] = useState(customNotes?.bankDetails?.ifscCode || "");
    const [bankName, setBankName] = useState(customNotes?.bankDetails?.bankName || "");
    const [branch, setBranch] = useState(customNotes?.bankDetails?.branch || "");
    const [upiId, setUpiId] = useState(customNotes?.bankDetails?.upiId || "");

    // Notes / Payment Term
    const [paymentTermsNote, setPaymentTermsNote] = useState(customNotes?.paymentTermsNote || "");

    // Calculations
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    // General Helpers
    const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    // Project Details Helpers
    const addProjectDetail = () => {
        setProjectDetails([...projectDetails, { id: Date.now(), label: "", value: "" }]);
    };

    const updateProjectDetail = (id: number, field: "label" | "value", val: string) => {
        setProjectDetails(projectDetails.map((item: any) => item.id === id ? { ...item, [field]: val } : item));
    };

    const removeProjectDetail = (id: number) => {
        setProjectDetails(projectDetails.filter((item: any) => item.id !== id));
    };

    // Line Items Helpers
    const addItem = () => {
        setLineItems([...lineItems, { id: Date.now(), description: "", amount: 0 }]);
    };

    const updateItem = (id: number, field: "description" | "amount", value: string | number) => {
        setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    // Logo Upload Handler
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Serialize data function
    const getCurrentData = () => {
        const customData = {
            developer,
            logoPath: logoPreview,
            qrCodeUrl,
            projectDetails,
            bankDetails: { accountHolder, accountNumber, ifscCode, bankName, branch, upiId },
            paymentTermsNote,
            status
        };

        return {
            invoiceNumber: invoiceNumber.trim() || null,
            clientId: selectedClientId,
            items: lineItems.map((li) => ({
                description: li.description,
                quantity: 1,
                unit_price: li.amount,
            })),
            notes: JSON.stringify(customData),
            status: status,
            issueDate: parseDateToISO(invoiceDate),
            dueDate: parseDateToISO(dueDate)
        };
    };

    // Auto-save logic
    useEffect(() => {
        if (onChange) {
            const timeoutId = setTimeout(() => {
                onChange(getCurrentData());
            }, 1000); // 1s debounce
            return () => clearTimeout(timeoutId);
        }
    }, [
        onChange,
        invoiceNumber, selectedClientId, lineItems, status, invoiceDate, dueDate,
        developer, logoPreview, qrCodeUrl, projectDetails,
        accountHolder, accountNumber, ifscCode, bankName, branch, upiId,
        paymentTermsNote
    ]);

    // Expose data to parent via ref
    useImperativeHandle(ref, () => ({
        getData: getCurrentData
    }));

    return (
        <div className="min-h-screen bg-[#111827] flex flex-col items-center py-12 px-4 selection:bg-[#3e546c] selection:text-white">
            {/* A4 Paper Container */}
            <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-2xl rounded-sm p-[12mm] sm:p-[20mm] relative">

                {/* Header Title & Logo */}
                <div className="flex justify-between items-start mb-6">
                    {/* Logo Section */}
                    <div className="w-48 h-24 border border-gray-200 border-dashed rounded relative flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
                        onClick={() => !logoPreview && fileInputRef.current?.click()}>
                        {logoPreview ? (
                            <>
                                <img src={logoPreview} alt="Business Logo" className="max-w-full max-h-full object-contain p-2" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 gap-1">
                                <ImagePlus size={20} />
                                <span className="text-xs font-medium">Add Logo</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="text-right">
                        <h1 className="text-4xl font-bold text-[#3e546c] tracking-wide mt-2">INVOICE</h1>
                    </div>
                </div>

                {/* Top Info Grid */}
                <div className="grid grid-cols-2 bg-[#f3f4f6] mb-8 divide-x divide-gray-200">
                    <div className="p-4 flex flex-col gap-3">
                        <div>
                            <span className="font-bold text-sm text-gray-900 block">Invoice Number:</span>
                            <input
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="e.g. INV-001"
                                className="w-full bg-transparent text-gray-700 outline-none hover:bg-black/5 px-1 -mx-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                        <div>
                            <span className="font-bold text-sm text-gray-900 block">Invoice Date:</span>
                            <input
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                placeholder="e.g. Jan 13, 2026"
                                className="w-full bg-transparent text-gray-700 outline-none hover:bg-black/5 px-1 -mx-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                        <div>
                            <span className="font-bold text-sm text-gray-900 block">Developer:</span>
                            <input
                                value={developer}
                                onChange={(e) => setDeveloper(e.target.value)}
                                placeholder="Name or Company"
                                className="w-full bg-transparent text-gray-700 outline-none hover:bg-black/5 px-1 -mx-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                        <div>
                            <span className="font-bold text-sm text-gray-900 block">Due Date:</span>
                            <input
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                placeholder="e.g. Upon Receipt"
                                className="w-full bg-transparent text-gray-700 outline-none hover:bg-black/5 px-1 -mx-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-[#3e546c] mb-2">Bill To:</h2>
                    <div className="border border-gray-200 p-4">
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="bg-transparent text-gray-900 font-bold outline-none w-full text-lg cursor-pointer hover:bg-gray-50 mb-1"
                        >
                            <option value="" disabled>Select a client...</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.company ? `(${c.company})` : ""}
                                </option>
                            ))}
                        </select>
                        {selectedClient ? (
                            <div className="text-gray-700 leading-relaxed text-sm">
                                {selectedClient.company && <p>{selectedClient.company}</p>}
                                {selectedClient.email && <p>Website: <span className="text-[#3b82f6]">{selectedClient.email}</span></p>}
                            </div>
                        ) : (
                            <p className="text-sm text-red-500/80 italic">Select a client to populate details.</p>
                        )}
                    </div>
                </div>

                {/* Project Details */}
                <div className="mb-8 relative group/projectTable">
                    <h2 className="text-xl font-bold text-[#3e546c] mb-2">Project Details</h2>
                    <div className="border border-gray-200 p-4 text-sm flex flex-col gap-2">
                        {projectDetails.map((detail: any, index: number) => (
                            <div key={detail.id} className="grid grid-cols-[160px_1fr] relative group/projectRow items-center">
                                <input
                                    value={detail.label}
                                    onChange={(e) => updateProjectDetail(detail.id, "label", e.target.value)}
                                    placeholder="Field Name"
                                    className="font-bold bg-transparent outline-none hover:bg-black/5 px-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic placeholder:font-normal"
                                />
                                <input
                                    value={detail.value}
                                    onChange={(e) => updateProjectDetail(detail.id, "value", e.target.value)}
                                    placeholder="Enter value..."
                                    className="bg-transparent outline-none hover:bg-black/5 px-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                                />
                                {/* Delete Button (Hover) */}
                                <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 opacity-0 group-hover/projectRow:opacity-100 transition-opacity">
                                    <button onClick={() => removeProjectDetail(detail.id)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Add Project Detail Button */}
                    <div className="absolute -bottom-7 right-0 opacity-0 group-hover/projectTable:opacity-100 transition-opacity">
                        <button onClick={addProjectDetail} className="flex items-center gap-1 text-xs font-semibold text-[#3b82f6] hover:text-[#2563eb]">
                            <Plus size={14} /> Add Detail
                        </button>
                    </div>
                </div>

                {/* Services & Charges Table */}
                <div className="mb-8 relative group/table">
                    <h2 className="text-xl font-bold text-[#3e546c] mb-2">Services & Charges</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#3e546c] text-white">
                                <th className="text-left py-2 px-4 font-bold border border-[#3e546c]">Description</th>
                                <th className="text-right py-2 px-4 font-bold border border-[#3e546c] w-32">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item, index) => (
                                <tr key={item.id} className="border-b border-l border-r border-gray-200 group/row relative">
                                    <td className="py-3 px-4 align-top">
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => {
                                                adjustTextareaHeight(e);
                                                updateItem(item.id, "description", e.target.value);
                                            }}
                                            onFocus={adjustTextareaHeight}
                                            placeholder="Enter service description, features, or project scope..."
                                            className="w-full bg-transparent outline-none resize-none overflow-hidden leading-relaxed text-sm text-gray-900 min-h-[140px] hover:bg-black/5 p-1 -m-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                                        />
                                    </td>
                                    <td className="py-3 px-4 align-top text-right">
                                        <input
                                            type="number"
                                            value={item.amount || ''}
                                            onChange={(e) => updateItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent outline-none text-right font-bold text-gray-900 text-base"
                                        />
                                    </td>
                                    {/* Delete Button (Hover) */}
                                    <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                        <button onClick={() => removeItem(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-[#10b981] text-white">
                                <td className="text-right py-3 px-4 font-bold text-lg border border-[#10b981]">TOTAL AMOUNT DUE:</td>
                                <td className="text-right py-3 px-4 font-bold text-lg border border-[#10b981] whitespace-nowrap">
                                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Add Item Button */}
                    <div className="absolute -bottom-10 right-0 opacity-0 group-hover/table:opacity-100 transition-opacity">
                        <button onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-[#3b82f6] hover:text-[#2563eb]">
                            <Plus size={16} /> Add Row
                        </button>
                    </div>
                </div>

                {/* Payment Information Section */}
                <div className="mb-4 mt-12">
                    <h2 className="text-xl font-bold text-[#3e546c]">Payment Information</h2>
                </div>

                {/* Bank / UPI Section */}
                <div className="grid grid-cols-[1fr_250px] gap-6 mb-8">
                    {/* Bank Details */}
                    <div>
                        <div className="bg-[#fffbeb] p-4 text-sm h-full">
                            <h3 className="font-bold text-[#3e546c] text-base mb-3">Bank Account Details</h3>
                            <div className="flex flex-col gap-1 text-gray-800">
                                <div className="flex"><span className="font-bold w-[120px]">Account Holder:</span><input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Full Name" className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic" /></div>
                                <div className="flex"><span className="font-bold w-[120px]">Account Number:</span><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0000000000" className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic" /></div>
                                <div className="flex"><span className="font-bold w-[120px]">IFSC Code:</span><input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="BANK0000000" className="flex-1 text-[#3b82f6] bg-transparent outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-[#3b82f6]/50 placeholder:italic" /></div>
                                <div className="flex"><span className="font-bold w-[120px]">Bank:</span><input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic" /></div>
                                <div className="flex"><span className="font-bold w-[120px]">Branch:</span><input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch Name" className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic" /></div>
                                <div className="flex"><span className="font-bold w-[120px]">UPI ID:</span><input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="user@upi" className="flex-1 text-[#3b82f6] bg-transparent outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-[#3b82f6]/50 placeholder:italic" /></div>
                                <div className="mt-3">
                                    <span className="font-bold block mb-1">Payment Methods:</span>
                                    <p className="leading-snug text-gray-700">• Bank Transfer (NEFT/RTGS/IMPS)<br />• UPI Payment (Scan QR Code →)<br />• Cash</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* QR Code Placeholder */}
                    <div className="flex flex-col items-center justify-center border-l border-gray-200 pl-6 relative">
                        <h3 className="font-bold text-[#3e546c] mb-2 text-sm text-center">Scan to Pay via UPI</h3>
                        <div className="w-48 h-48 bg-[#1e293b] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-white text-xs opacity-90 cursor-default hover:opacity-100 transition-opacity overflow-hidden group relative">
                            {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain bg-white" />
                            ) : (
                                <>
                                    <span className="text-gray-400">QR Code Placeholder</span>
                                    <span className="hidden group-hover:block absolute bg-black/70 w-full text-center py-2 text-blue-400">Add in Settings</span>
                                </>
                            )}
                        </div>
                        <div className="mt-2 text-center text-xs font-bold text-gray-900">{developer || "Developer Name"}</div>
                        <div className="text-center text-[10px] text-gray-500">{upiId || "UPI ID"}</div>
                    </div>
                </div>

                {/* Payment Terms */}
                <div className="bg-[#ecfdf5] p-4 text-sm text-gray-800 mb-8 border border-green-100">
                    <h3 className="font-bold text-base mb-1">Payment Terms:</h3>
                    <p>• Payment is due upon receipt of this invoice</p>
                    <p>• Please include Invoice Number ({invoiceNumber}) in payment reference</p>
                    <div className="flex items-start mt-2">
                        <span className="font-bold italic mr-1 shrink-0">Note:</span>
                        <textarea
                            value={paymentTermsNote}
                            onChange={(e) => {
                                adjustTextareaHeight(e);
                                setPaymentTermsNote(e.target.value);
                            }}
                            placeholder="Enter any additional payment terms or notes..."
                            className="flex-1 bg-transparent italic outline-none resize-none shrink-0 placeholder:text-gray-400"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Footer Message */}
                <div className="bg-[#e0f2fe] py-4 px-2 text-center">
                    <h3 className="text-xl font-bold text-[#0284c7] mb-1">Thank You for Your Business!</h3>
                    <p className="text-sm text-gray-800">For any queries regarding this invoice, please contact {developer || "the developer"}</p>
                </div>

                <div className="text-center mt-6 text-xs italic text-gray-400">
                    This is a computer-generated invoice and does not require a physical signature.
                </div>

            </div>
        </div>
    );
});

