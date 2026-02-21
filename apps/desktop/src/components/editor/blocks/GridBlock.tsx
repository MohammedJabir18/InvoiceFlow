import type { ClientResponse } from "../../../lib/api";

interface Props {
    clients: ClientResponse[];
    selectedClientId: string;
    onClientChange: (id: string) => void;
}

export function GridBlock({ clients, selectedClientId, onClientChange }: Props) {
    const selectedClient = clients.find((c) => c.id === selectedClientId);

    return (
        <div className="grid grid-cols-2 gap-12 py-6 px-8">
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-[var(--secondary)] uppercase tracking-widest mb-2">Bill To</h4>
                <div className="space-y-2">
                    <select
                        value={selectedClientId}
                        onChange={(e) => onClientChange(e.target.value)}
                        className="bg-transparent text-[var(--foreground)] outline-none font-medium w-full text-lg border-b border-white/10 pb-1 cursor-pointer"
                        style={{ background: "transparent" }}
                    >
                        <option value="" style={{ background: "#1e293b" }}>Select a client...</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id} style={{ background: "#1e293b" }}>
                                {c.name} {c.company ? `(${c.company})` : ""}
                            </option>
                        ))}
                    </select>
                    {selectedClient && (
                        <div className="space-y-1">
                            <p className="text-sm text-[var(--foreground)] opacity-60">
                                {selectedClient.email || "No email"}
                            </p>
                            <p className="text-sm text-[var(--foreground)] opacity-60">
                                {selectedClient.company || ""}
                            </p>
                        </div>
                    )}
                    {!selectedClientId && (
                        <p className="text-xs text-amber-400 opacity-80">Please select a client to bill</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-[var(--secondary)] uppercase tracking-widest mb-1">Issue Date</label>
                    <input
                        type="date"
                        className="bg-transparent text-[var(--foreground)] outline-none font-medium opacity-90 focus:opacity-100"
                        defaultValue={new Date().toISOString().split("T")[0]}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-[var(--secondary)] uppercase tracking-widest mb-1">Due Date</label>
                    <input
                        type="date"
                        className="bg-transparent text-[var(--foreground)] outline-none font-medium opacity-90 focus:opacity-100"
                        defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                    />
                </div>
                <div className="flex flex-col col-span-2">
                    <label className="text-xs font-bold text-[var(--secondary)] uppercase tracking-widest mb-1">Ref No</label>
                    <input
                        className="bg-transparent text-[var(--foreground)] outline-none font-medium opacity-90 focus:opacity-100 placeholder-white/20"
                        placeholder="PO-2026-X49"
                    />
                </div>
            </div>
        </div>
    );
}
