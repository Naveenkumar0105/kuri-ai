"use client";

import { FormEvent, useState } from "react";
import { Check, Copy, Link2, Plus, Users, X } from "lucide-react";
import { SharedSpace } from "@/types";

interface SharedSpacesModalProps {
    isOpen: boolean;
    spaces: SharedSpace[];
    onClose: () => void;
    onSpaceAdded: (space: SharedSpace) => void;
}

export function SharedSpacesModal({ isOpen, spaces, onClose, onSpaceAdded }: SharedSpacesModalProps) {
    const [name, setName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    if (!isOpen) return null;

    const send = async (url: string, body: object) => {
        setError(null);
        setIsSaving(true);
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Something went wrong");
            onSpaceAdded(data);
            setName("");
            setInviteCode("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    const createSpace = (event: FormEvent) => {
        event.preventDefault();
        if (name.trim()) void send("/api/spaces", { name });
    };

    const joinSpace = (event: FormEvent) => {
        event.preventDefault();
        if (inviteCode.trim()) void send("/api/spaces/join", { inviteCode });
    };

    const copyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        window.setTimeout(() => setCopiedCode(null), 1500);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onMouseDown={onClose}>
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Shared spaces</h2>
                        <p className="text-sm text-muted-foreground">A private task list for your household or group.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <form onSubmit={createSpace} className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Create a space</label>
                        <div className="flex gap-2">
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Apartment, Family, Studio…"
                                className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-[#5E5CE6]/30"
                            />
                            <button disabled={isSaving || !name.trim()} className="px-4 py-2 rounded-xl bg-[#5E5CE6] text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
                                <Plus className="w-4 h-4" /> Create
                            </button>
                        </div>
                    </form>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px bg-border flex-1" />or join one<span className="h-px bg-border flex-1" /></div>

                    <form onSubmit={joinSpace} className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Enter an invite code</label>
                        <div className="flex gap-2">
                            <input
                                value={inviteCode}
                                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                                placeholder="Invite code"
                                className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-mono tracking-wider uppercase outline-none focus:ring-2 focus:ring-[#5E5CE6]/30"
                            />
                            <button disabled={isSaving || !inviteCode.trim()} className="px-4 py-2 rounded-xl border border-border bg-secondary text-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
                                <Link2 className="w-4 h-4" /> Join
                            </button>
                        </div>
                    </form>

                    {error && <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

                    {spaces.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your invite codes</p>
                            {spaces.map((space) => (
                                <div key={space.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#5E5CE6]/10 text-[#5E5CE6] flex items-center justify-center"><Users className="w-4 h-4" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{space.name}</p>
                                        <p className="text-xs text-muted-foreground">{space.memberCount} member{space.memberCount === 1 ? "" : "s"}</p>
                                    </div>
                                    <button onClick={() => void copyCode(space.inviteCode)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs font-mono font-semibold hover:bg-secondary/70" title="Copy invite code">
                                        {space.inviteCode}
                                        {copiedCode === space.inviteCode ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
