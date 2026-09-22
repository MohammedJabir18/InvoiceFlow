import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import { Plus, Trash2, ImagePlus, X, ArrowUp, ArrowDown, Percent, FileText } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../store/settingsStore";
import type { ClientResponse } from "../../lib/api";

export interface InvoiceData {
    invoiceNumber: string | null;
    clientId: string;
    items: {
        description: string;
        quantity: number;
        unit_price: number;
        unit?: string;
        amount: number;
    }[];
    notes: string;
    status: string;
    issueDate: string | null;
    dueDate: string | null;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    total: number;
}

export interface InvoiceEditorRef {
    getData: () => InvoiceData;
}

interface Props {
    clients: ClientResponse[];
    initialData?: any;
    onChange?: (data: any) => void;
}

interface LineItemState {
    id: number | string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    amount: number;
}

export const InvoiceEditor = forwardRef<InvoiceEditorRef, Props>(({ clients, initialData, onChange }, ref) => {
    // --- Currency & Profile from Store ---
    const profile = useSettingsStore((state) => state.profile);
    const bankDetailsFromStore = useSettingsStore((state) => state.bankDetails);
    const defaultCurrency = profile?.default_currency || "USD";

    // --- Date Helpers ---
    const formatDate = (date: Date): string =>
        date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const computeDueDate = (terms: string | undefined): string => {
        const today = new Date();
        if (!terms || terms === "DueOnReceipt") return formatDate(today);
        const days = terms === "Net15" ? 15 : terms === "Net30" ? 30 : terms === "Net60" ? 60 : 0;
        const due = new Date(today);
        due.setDate(due.getDate() + days);
        return formatDate(due);
    };

    const parseDateToISO = (dateStr: string): string | null => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split("T")[0];
    };

    // --- Parse Initial Notes & Settings ---
    let customNotes: any = null;
    try {
        if (initialData?.notes) {
            customNotes = typeof initialData.notes === "string" ? JSON.parse(initialData.notes) : initialData.notes;
        }
    } catch {
        // Plain text
    }

    // --- State ---
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || initialData?.number || "");
    const [invoiceDate, setInvoiceDate] = useState(() => {
        if (initialData?.issueDate || initialData?.issue_date) {
            return formatDate(new Date(initialData.issueDate || initialData.issue_date));
        }
        return formatDate(new Date());
    });
    const [dueDate, setDueDate] = useState(() => {
        if (initialData?.dueDate || initialData?.due_date) {
            return formatDate(new Date(initialData.dueDate || initialData.due_date));
        }
        return "";
    });
    const [status, setStatus] = useState(initialData?.status || "Draft");
    const [developer, setDeveloper] = useState(customNotes?.developer || "");
    const [paperSize, setPaperSize] = useState<"a4" | "letter">(customNotes?.paperSize || "a4");

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || initialData?.client_id || "");
    const selectedClient = clients.find((c) => c.id === selectedClientId);

    useEffect(() => {
        const clientVal = initialData?.clientId || initialData?.client_id;
        if (clientVal && clientVal !== selectedClientId) {
            setSelectedClientId(clientVal);
        }
    }, [initialData?.clientId, initialData?.client_id]);

    const [logoPreview, setLogoPreview] = useState<string | null>(customNotes?.logoPath || null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(customNotes?.qrCodeUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tax & Discount controls (Midday feature)
    const [includeTax, setIncludeTax] = useState<boolean>(customNotes?.includeTax ?? true);
    const [taxRate, setTaxRate] = useState<number>(customNotes?.taxRate ?? 18);
    const [includeDiscount, setIncludeDiscount] = useState<boolean>(customNotes?.includeDiscount ?? false);
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">(customNotes?.discountType || "percentage");
    const [discountValue, setDiscountValue] = useState<number>(customNotes?.discountValue ?? 0);

    // Internal Notes (Midday feature)
    const [internalNotes, setInternalNotes] = useState<string>(customNotes?.internalNotes || "");

    // Bank Details
    const [accountHolder, setAccountHolder] = useState(customNotes?.bankDetails?.accountHolder || "");
    const [accountNumber, setAccountNumber] = useState(customNotes?.bankDetails?.accountNumber || "");
    const [ifscCode, setIfscCode] = useState(customNotes?.bankDetails?.ifscCode || "");
    const [bankName, setBankName] = useState(customNotes?.bankDetails?.bankName || "");
    const [branch, setBranch] = useState(customNotes?.bankDetails?.branch || "");
    const [upiId, setUpiId] = useState(customNotes?.bankDetails?.upiId || "");
    const [paymentTermsNote, setPaymentTermsNote] = useState(customNotes?.paymentTermsNote || "");

    // Project Details (Dynamic Key-Value Pairs)
    const [projectDetails, setProjectDetails] = useState(
        customNotes?.projectDetails || [
            { id: 1, label: "Website / Project", value: "" },
            { id: 2, label: "Tech Stack", value: "" },
            { id: 3, label: "Scope / Period", value: "" },
        ]
    );

    // Line Items with Quantity, Unit, Unit Price, and Amount
    const [lineItems, setLineItems] = useState<LineItemState[]>(() => {
        if (initialData?.items && initialData.items.length > 0) {
            return initialData.items.map((i: any, index: number) => {
                const qty = parseFloat(i.quantity) || 1;
                const unitPrice = parseFloat(i.unit_price || i.amount || "0");
                const lineAmt = parseFloat(i.amount) || qty * unitPrice;
                return {
                    id: i.id || index + 1,
                    description: i.description || "",
                    quantity: qty,
                    unit: i.unit || "hrs",
                    unit_price: unitPrice,
                    amount: lineAmt,
                };
            });
        }
        return [
            {
                id: 1,
                description: "",
                quantity: 1,
                unit: "hrs",
                unit_price: 0,
                amount: 0,
            },
        ];
    });

    // Fetch initial settings & data on mount
    useEffect(() => {
        let mounted = true;
        useSettingsStore.getState().fetchBankDetails();

        invoke<string | null>("get_logo")
            .then((data) => {
                if (mounted && data && !logoPreview) {
                    setLogoPreview(data);
                }
            })
            .catch(() => {});

        invoke<string | null>("get_qr")
            .then((data) => {
                if (mounted && data && !qrCodeUrl) {
                    setQrCodeUrl(data);
                }
            })
            .catch(() => {});

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

    // Auto-set Due Date if empty
    useEffect(() => {
        if (!dueDate) {
            setDueDate(computeDueDate(profile?.default_payment_terms));
        }
    }, [profile?.default_payment_terms]);

    // Auto-populate Bank Details if empty
    useEffect(() => {
        if (bankDetailsFromStore) {
            setAccountHolder((prev: string) => prev || bankDetailsFromStore.accountHolder || "");
            setAccountNumber((prev: string) => prev || bankDetailsFromStore.accountNumber || "");
            setIfscCode((prev: string) => prev || bankDetailsFromStore.ifscCode || "");
            setBankName((prev: string) => prev || bankDetailsFromStore.bankName || "");
            setBranch((prev: string) => prev || bankDetailsFromStore.branch || "");
            setUpiId((prev: string) => prev || bankDetailsFromStore.upiId || "");
        }
    }, [bankDetailsFromStore]);

    // Auto-adjust textarea height
    const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    // Project Details Helpers
    const addProjectDetail = () => {
        setProjectDetails([...projectDetails, { id: Date.now(), label: "", value: "" }]);
    };

    const updateProjectDetail = (id: number, field: "label" | "value", val: string) => {
        setProjectDetails(projectDetails.map((item: any) => (item.id === id ? { ...item, [field]: val } : item)));
    };

    const removeProjectDetail = (id: number) => {
        setProjectDetails(projectDetails.filter((item: any) => item.id !== id));
    };

    // Line Items Helpers with auto-calculating amounts
    const addItem = () => {
        setLineItems([
            ...lineItems,
            {
                id: Date.now(),
                description: "",
                quantity: 1,
                unit: "hrs",
                unit_price: 0,
                amount: 0,
            },
        ]);
    };

    const updateItem = (id: number | string, field: keyof LineItemState, value: any) => {
        setLineItems(
            lineItems.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    // Recalculate amount when quantity or unit_price changes
                    if (field === "quantity" || field === "unit_price") {
                        const q = field === "quantity" ? parseFloat(value) || 0 : item.quantity;
                        const p = field === "unit_price" ? parseFloat(value) || 0 : item.unit_price;
                        updated.amount = q * p;
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    const removeItem = (id: number | string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((item) => item.id !== id));
        }
    };

    const moveItem = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= lineItems.length) return;
        const newItems = [...lineItems];
        const [moved] = newItems.splice(index, 1);
        newItems.splice(targetIndex, 0, moved);
        setLineItems(newItems);
    };

    // Logo Upload
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

    // Financial Totals Calculation (Midday Engine)
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discountAmount = includeDiscount
        ? discountType === "percentage"
            ? (subtotal * (discountValue || 0)) / 100
            : discountValue || 0
        : 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = includeTax ? (taxableAmount * (taxRate || 0)) / 100 : 0;
    const grandTotal = taxableAmount + taxAmount;

    // Currency Formatter
    const formatCurrencyDisplay = (num: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: defaultCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    // Serialize data function
    const getCurrentData = (): InvoiceData => {
        const customData = {
            developer,
            logoPath: logoPreview,
            qrCodeUrl,
            projectDetails,
            bankDetails: { accountHolder, accountNumber, ifscCode, bankName, branch, upiId },
            paymentTermsNote,
            internalNotes,
            includeTax,
            taxRate,
            includeDiscount,
            discountType,
            discountValue,
            paperSize,
            currency: defaultCurrency,
            status,
        };

        return {
            invoiceNumber: invoiceNumber.trim() || null,
            clientId: selectedClientId,
            items: lineItems.map((li) => ({
                description: li.description,
                quantity: li.quantity || 1,
                unit_price: li.unit_price || 0,
                unit: li.unit || "hrs",
                amount: li.amount,
            })),
            notes: JSON.stringify(customData),
            status: status,
            issueDate: parseDateToISO(invoiceDate),
            dueDate: parseDateToISO(dueDate),
            subtotal,
            taxTotal: taxAmount,
            discountTotal: discountAmount,
            total: grandTotal,
        };
    };

    // Auto-save logic
    useEffect(() => {
        if (onChange) {
            const timeoutId = setTimeout(() => {
                onChange(getCurrentData());
            }, 800);
            return () => clearTimeout(timeoutId);
        }
    }, [
        onChange,
        invoiceNumber,
        selectedClientId,
        lineItems,
        status,
        invoiceDate,
        dueDate,
        developer,
        logoPreview,
        qrCodeUrl,
        projectDetails,
        accountHolder,
        accountNumber,
        ifscCode,
        bankName,
        branch,
        upiId,
        paymentTermsNote,
        includeTax,
        taxRate,
        includeDiscount,
        discountType,
        discountValue,
        internalNotes,
        paperSize,
    ]);

    // Expose data to parent via ref
    useImperativeHandle(ref, () => ({
        getData: getCurrentData,
    }));

    return (
        <div className="min-h-screen bg-[#0d111c] flex flex-col items-center py-10 px-4 text-gray-100 selection:bg-blue-600 selection:text-white">
            {/* Top Toolbar (Paper Size & Quick Settings) */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-4 px-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-300">Format:</span>
                    <button
                        onClick={() => setPaperSize("a4")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                            paperSize === "a4" ? "bg-blue-600 text-white" : "bg-white/5 hover:bg-white/10"
                        }`}
                    >
                        A4 Paper
                    </button>
                    <button
                        onClick={() => setPaperSize("letter")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                            paperSize === "letter" ? "bg-blue-600 text-white" : "bg-white/5 hover:bg-white/10"
                        }`}
                    >
                        US Letter
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono">Currency: {defaultCurrency}</span>
                </div>
            </div>

            {/* Document Paper Container */}
            <div
                className={`w-full ${
                    paperSize === "letter" ? "max-w-[8.5in] min-h-[11in]" : "max-w-[210mm] min-h-[297mm]"
                } bg-white text-gray-900 shadow-2xl rounded-sm p-[10mm] sm:p-[16mm] relative border border-gray-200`}
            >
                {/* Header Title & Logo */}
                <div className="flex justify-between items-start mb-6">
                    {/* Logo Section */}
                    <div
                        className="w-48 h-20 border border-gray-200 border-dashed rounded relative flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
                        onClick={() => !logoPreview && fileInputRef.current?.click()}
                    >
                        {logoPreview ? (
                            <>
                                <img
                                    src={logoPreview}
                                    alt="Business Logo"
                                    className="max-w-full max-h-full object-contain p-2"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLogoPreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 gap-1">
                                <ImagePlus size={18} />
                                <span className="text-[11px] font-medium">Add Logo</span>
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
                        <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-wide">INVOICE</h1>
                    </div>
                </div>

                {/* Top Info Grid */}
                <div className="grid grid-cols-2 bg-[#f8fafc] border border-gray-200 mb-6 divide-x divide-gray-200 rounded-sm">
                    <div className="p-3 flex flex-col gap-2">
                        <div>
                            <span className="font-bold text-xs text-gray-700 block">Invoice Number:</span>
                            <input
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="e.g. INV-2026-001"
                                className="w-full bg-transparent text-gray-900 font-mono font-semibold text-sm outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                        <div>
                            <span className="font-bold text-xs text-gray-700 block">Invoice Date:</span>
                            <input
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                placeholder="e.g. Jan 15, 2026"
                                className="w-full bg-transparent text-gray-800 text-xs outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        <div>
                            <span className="font-bold text-xs text-gray-700 block">Developer / Company:</span>
                            <input
                                value={developer}
                                onChange={(e) => setDeveloper(e.target.value)}
                                placeholder="Full Name or Business"
                                className="w-full bg-transparent text-gray-800 text-xs font-semibold outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                        <div>
                            <span className="font-bold text-xs text-gray-700 block">Due Date:</span>
                            <input
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                placeholder="e.g. Upon Receipt"
                                className="w-full bg-transparent text-gray-800 text-xs outline-none hover:bg-black/5 px-1 -mx-1 rounded placeholder:text-gray-400 placeholder:italic"
                            />
                        </div>
                    </div>
                </div>

                {/* Bill To Section */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Bill To:</h2>
                    <div className="border border-gray-200 p-3 rounded-sm bg-gray-50/50">
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="bg-transparent text-gray-900 font-bold outline-none w-full text-base cursor-pointer hover:bg-gray-100/50 mb-1"
                        >
                            <option value="" disabled>
                                Select a client...
                            </option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.company ? `(${c.company})` : ""}
                                </option>
                            ))}
                        </select>
                        {selectedClient ? (
                            <div className="text-gray-600 text-xs leading-relaxed space-y-0.5">
                                {selectedClient.company && <p className="font-medium">{selectedClient.company}</p>}
                                {selectedClient.email && (
                                    <p>
                                        Email: <span className="text-blue-600">{selectedClient.email}</span>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-rose-500 italic">Please select a client to bill.</p>
                        )}
                    </div>
                </div>

                {/* Project Details */}
                <div className="mb-6 relative group/projectTable">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Project Scope</h2>
                    <div className="border border-gray-200 p-3 rounded-sm text-xs flex flex-col gap-1.5">
                        {projectDetails.map((detail: any) => (
                            <div key={detail.id} className="grid grid-cols-[140px_1fr] relative group/projectRow items-center">
                                <input
                                    value={detail.label}
                                    onChange={(e) => updateProjectDetail(detail.id, "label", e.target.value)}
                                    placeholder="Field Name"
                                    className="font-bold text-gray-700 bg-transparent outline-none hover:bg-black/5 px-1 rounded placeholder:text-gray-400 placeholder:font-normal"
                                />
                                <input
                                    value={detail.value}
                                    onChange={(e) => updateProjectDetail(detail.id, "value", e.target.value)}
                                    placeholder="Enter details..."
                                    className="bg-transparent text-gray-800 outline-none hover:bg-black/5 px-1 rounded placeholder:text-gray-400"
                                />
                                <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 opacity-0 group-hover/projectRow:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => removeProjectDetail(detail.id)}
                                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute -bottom-6 right-0 opacity-0 group-hover/projectTable:opacity-100 transition-opacity">
                        <button
                            onClick={addProjectDetail}
                            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                            <Plus size={12} /> Add Detail
                        </button>
                    </div>
                </div>

                {/* Enhanced Line Items Table (Midday-Style) */}
                <div className="mb-6 relative group/table mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Services & Line Items</h2>
                    </div>

                    <table className="w-full border-collapse border border-gray-200 text-xs">
                        <thead>
                            <tr className="bg-[#1e293b] text-white">
                                <th className="text-left py-2 px-3 font-semibold">Description</th>
                                <th className="text-center py-2 px-2 font-semibold w-16">Unit</th>
                                <th className="text-center py-2 px-2 font-semibold w-16">Qty</th>
                                <th className="text-right py-2 px-3 font-semibold w-24">Rate</th>
                                <th className="text-right py-2 px-3 font-semibold w-28">Amount</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {lineItems.map((item, index) => (
                                <tr key={item.id} className="group/row hover:bg-gray-50/50">
                                    {/* Description */}
                                    <td className="py-2.5 px-3 align-top">
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => {
                                                adjustTextareaHeight(e);
                                                updateItem(item.id, "description", e.target.value);
                                            }}
                                            onFocus={adjustTextareaHeight}
                                            placeholder="Service description, deliverable, or milestones..."
                                            rows={2}
                                            className="w-full bg-transparent outline-none resize-none leading-relaxed text-xs text-gray-800 hover:bg-black/5 p-1 rounded transition-colors placeholder:text-gray-400 placeholder:italic"
                                        />
                                    </td>

                                    {/* Unit (hrs, days, items, etc.) */}
                                    <td className="py-2.5 px-2 align-top text-center">
                                        <input
                                            type="text"
                                            value={item.unit}
                                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                            placeholder="hrs"
                                            className="w-full bg-transparent outline-none text-center text-gray-600 font-medium hover:bg-black/5 p-1 rounded"
                                        />
                                    </td>

                                    {/* Quantity */}
                                    <td className="py-2.5 px-2 align-top text-center">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent outline-none text-center font-mono font-semibold text-gray-800 hover:bg-black/5 p-1 rounded"
                                            min="0"
                                            step="0.5"
                                        />
                                    </td>

                                    {/* Unit Price */}
                                    <td className="py-2.5 px-3 align-top text-right">
                                        <input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent outline-none text-right font-mono font-semibold text-gray-800 hover:bg-black/5 p-1 rounded"
                                            min="0"
                                            step="1"
                                        />
                                    </td>

                                    {/* Line Amount */}
                                    <td className="py-2.5 px-3 align-top text-right font-mono font-bold text-gray-900">
                                        {formatCurrencyDisplay(item.amount)}
                                    </td>

                                    {/* Reorder & Delete */}
                                    <td className="py-2.5 px-2 align-top text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => moveItem(index, "up")}
                                                disabled={index === 0}
                                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                                                title="Move up"
                                            >
                                                <ArrowUp size={11} />
                                            </button>
                                            <button
                                                onClick={() => moveItem(index, "down")}
                                                disabled={index === lineItems.length - 1}
                                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                                                title="Move down"
                                            >
                                                <ArrowDown size={11} />
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                title="Delete row"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Add Line Item Action */}
                    <div className="flex justify-between items-center mt-2">
                        <button
                            onClick={addItem}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            <Plus size={14} /> Add Line Item
                        </button>
                    </div>

                    {/* Midday-Style Tax, Discount & Grand Total Breakdown */}
                    <div className="mt-6 flex flex-col items-end">
                        <div className="w-72 space-y-2 text-xs border border-gray-200 rounded p-3 bg-gray-50/70">
                            {/* Subtotal */}
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-mono font-semibold text-gray-900">{formatCurrencyDisplay(subtotal)}</span>
                            </div>

                            {/* Discount Toggle */}
                            <div className="flex justify-between items-center text-gray-600 pt-1 border-t border-gray-200">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeDiscount}
                                        onChange={(e) => setIncludeDiscount(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-0"
                                    />
                                    <span>Discount</span>
                                </label>
                                {includeDiscount ? (
                                    <div className="flex items-center gap-1 font-mono">
                                        <input
                                            type="number"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                            className="w-14 text-right bg-white border border-gray-200 rounded px-1 text-xs font-mono"
                                        />
                                        <select
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value as any)}
                                            className="bg-white border border-gray-200 rounded text-xs px-0.5"
                                        >
                                            <option value="percentage">%</option>
                                            <option value="fixed">{defaultCurrency}</option>
                                        </select>
                                        <span className="text-emerald-600 ml-1">-{formatCurrencyDisplay(discountAmount)}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 font-mono">—</span>
                                )}
                            </div>

                            {/* Tax / VAT Toggle */}
                            <div className="flex justify-between items-center text-gray-600 pt-1 border-t border-gray-200">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeTax}
                                        onChange={(e) => setIncludeTax(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-0"
                                    />
                                    <span>Tax / VAT</span>
                                </label>
                                {includeTax ? (
                                    <div className="flex items-center gap-1 font-mono">
                                        <input
                                            type="number"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-12 text-right bg-white border border-gray-200 rounded px-1 text-xs font-mono"
                                        />
                                        <span>%</span>
                                        <span className="text-gray-900 ml-1">+{formatCurrencyDisplay(taxAmount)}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 font-mono">—</span>
                                )}
                            </div>

                            {/* Grand Total */}
                            <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                                <span>TOTAL AMOUNT:</span>
                                <span className="font-mono text-emerald-600 text-base">{formatCurrencyDisplay(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Information Section */}
                <div className="mb-4 mt-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Payment Information</h2>
                </div>

                {/* Bank / UPI Section */}
                <div className="grid grid-cols-[1fr_200px] gap-4 mb-6">
                    <div className="bg-[#fffbeb] p-3 text-xs rounded border border-amber-200/50">
                        <h3 className="font-bold text-gray-800 text-xs mb-2">Bank Account Transfer Details</h3>
                        <div className="flex flex-col gap-1 text-gray-800">
                            <div className="flex">
                                <span className="font-bold w-[110px]">Account Holder:</span>
                                <input
                                    value={accountHolder}
                                    onChange={(e) => setAccountHolder(e.target.value)}
                                    placeholder="Full Name"
                                    className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 rounded"
                                />
                            </div>
                            <div className="flex">
                                <span className="font-bold w-[110px]">Account Number:</span>
                                <input
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="0000000000"
                                    className="flex-1 bg-transparent outline-none font-mono hover:bg-black/5 px-1 rounded"
                                />
                            </div>
                            <div className="flex">
                                <span className="font-bold w-[110px]">IFSC Code:</span>
                                <input
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value)}
                                    placeholder="BANK0000000"
                                    className="flex-1 text-blue-600 font-mono bg-transparent outline-none hover:bg-black/5 px-1 rounded"
                                />
                            </div>
                            <div className="flex">
                                <span className="font-bold w-[110px]">Bank:</span>
                                <input
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="Bank Name"
                                    className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 rounded"
                                />
                            </div>
                            <div className="flex">
                                <span className="font-bold w-[110px]">Branch:</span>
                                <input
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    placeholder="Branch Name"
                                    className="flex-1 bg-transparent outline-none hover:bg-black/5 px-1 rounded"
                                />
                            </div>
                            <div className="flex">
                                <span className="font-bold w-[110px]">UPI ID:</span>
                                <input
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="user@upi"
                                    className="flex-1 text-blue-600 bg-transparent outline-none hover:bg-black/5 px-1 rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="flex flex-col items-center justify-center border-l border-gray-200 pl-4">
                        <span className="font-bold text-[11px] text-gray-700 mb-1">Scan to Pay via UPI</span>
                        <div className="w-36 h-36 bg-gray-900 rounded border border-gray-300 flex items-center justify-center text-white text-[10px] overflow-hidden">
                            {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain bg-white" />
                            ) : (
                                <span className="text-gray-400">QR Code Preview</span>
                            )}
                        </div>
                        <div className="mt-1 text-center text-[10px] font-bold text-gray-900">{developer || "Developer"}</div>
                    </div>
                </div>

                {/* Payment Terms */}
                <div className="bg-[#ecfdf5] p-3 text-xs text-gray-800 mb-6 border border-emerald-200 rounded">
                    <h3 className="font-bold text-xs mb-1 text-emerald-800">Payment Terms:</h3>
                    <p>• Payment is due upon receipt of this invoice ({invoiceNumber})</p>
                    <div className="flex items-start mt-1.5">
                        <span className="font-bold italic mr-1 shrink-0">Note:</span>
                        <textarea
                            value={paymentTermsNote}
                            onChange={(e) => {
                                adjustTextareaHeight(e);
                                setPaymentTermsNote(e.target.value);
                            }}
                            placeholder="Enter any additional payment terms or notes..."
                            className="flex-1 bg-transparent italic outline-none resize-none shrink-0"
                            rows={1}
                        />
                    </div>
                </div>

                {/* Footer Message */}
                <div className="bg-[#e0f2fe] py-3 px-2 text-center rounded">
                    <h3 className="text-sm font-bold text-[#0284c7]">Thank You for Your Business!</h3>
                    <p className="text-[11px] text-gray-700">For any queries regarding this invoice, contact {developer || "us"}</p>
                </div>

                <div className="text-center mt-4 text-[10px] italic text-gray-400">
                    This is a computer-generated invoice and does not require a physical signature.
                </div>
            </div>
        </div>
    );
});
