"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Command, X } from "lucide-react";
import { SharedSpace } from "@/types";

interface KuriCompanionProps {
    spaces: SharedSpace[];
    defaultSpaceId: string;
    attentionCount: number;
    onAddTask: (text: string, spaceId: string) => Promise<boolean>;
}

type Mood = "idle" | "listening" | "saving" | "success" | "error";

export function KuriCompanion({ spaces, defaultSpaceId, attentionCount, onAddTask }: KuriCompanionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState("");
    const [spaceId, setSpaceId] = useState(defaultSpaceId);
    const [mood, setMood] = useState<Mood>("idle");
    const [message, setMessage] = useState("What should I remember?");
    const inputRef = useRef<HTMLInputElement>(null);
    const reducedMotion = useReducedMotion();
    const shortcut = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘⇧Space" : "Ctrl+Shift+Space";

    const open = () => {
        setSpaceId(defaultSpaceId);
        setMood("listening");
        setMessage("What should I remember?");
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setMood("idle");
    };

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if (event.code === "Space" && event.shiftKey && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                if (isOpen) close(); else open();
            }
            if (event.key === "Escape" && isOpen) close();
        };
        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    });

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!text.trim() || mood === "saving") return;
        setMood("saving");
        setMessage("Putting it on the list…");

        const success = await onAddTask(text.trim(), spaceId);
        if (success) {
            setText("");
            setMood("success");
            setMessage("Got it!");
            window.setTimeout(close, 850);
        } else {
            setMood("error");
            setMessage("I couldn’t save that. Try again?");
            inputRef.current?.focus();
        }
    };

    return (
        <div className="fixed right-5 bottom-5 md:right-7 md:bottom-7 z-[60]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
                        className="absolute bottom-[72px] right-0 w-[min(350px,calc(100vw-2.5rem))] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-[#5E5CE6]/[0.06]">
                            <KuriFace mood={mood} small />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">Kuri</p>
                                <p className="text-xs text-muted-foreground truncate" aria-live="polite">{message}</p>
                            </div>
                            <button onClick={close} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Close quick capture">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-4 space-y-3">
                            <input
                                ref={inputRef}
                                value={text}
                                onChange={(event) => { setText(event.target.value); if (mood === "error") setMood("listening"); }}
                                placeholder="Buy milk, call the landlord…"
                                disabled={mood === "saving" || mood === "success"}
                                className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-[15px] outline-none focus:ring-2 focus:ring-[#5E5CE6]/30 focus:border-[#5E5CE6]/40 disabled:opacity-60"
                            />
                            <div className="flex items-center gap-2">
                                <select
                                    value={spaceId}
                                    onChange={(event) => setSpaceId(event.target.value)}
                                    disabled={mood === "saving" || mood === "success"}
                                    className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium text-foreground outline-none"
                                    aria-label="Add task to"
                                >
                                    <option value="personal">My tasks</option>
                                    {spaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}
                                </select>
                                <button
                                    type="submit"
                                    disabled={!text.trim() || mood === "saving" || mood === "success"}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#5E5CE6] text-white disabled:opacity-40 transition-transform active:scale-95"
                                    aria-label="Add task"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                                <Command className="w-3 h-3" /> Press Enter to add · {shortcut} to toggle
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <AnimatePresence>
                    {mood === "success" && !isOpen && (
                        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute right-[68px] top-2 whitespace-nowrap px-3 py-2 rounded-xl bg-card border border-border shadow-lg text-xs font-semibold">
                            Task added!
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.button
                    onClick={() => isOpen ? close() : open()}
                    animate={mood === "success" && !reducedMotion ? { y: [0, -8, 0], rotate: [0, -5, 5, 0] } : { y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#7775F0] to-[#514FC7] shadow-lg shadow-[#5E5CE6]/25 border border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    aria-label={isOpen ? "Close Kuri quick capture" : `Ask Kuri to add a task. Shortcut ${shortcut}`}
                    title={`Quick capture · ${shortcut}`}
                >
                    <KuriFace mood={isOpen ? mood : "idle"} />
                </motion.button>
                {attentionCount > 0 && !isOpen && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold border-2 border-background flex items-center justify-center" title={`${attentionCount} unclaimed shared task${attentionCount === 1 ? "" : "s"}`}>
                        {attentionCount > 9 ? "9+" : attentionCount}
                    </span>
                )}
            </div>
        </div>
    );
}

function KuriFace({ mood, small = false }: { mood: Mood; small?: boolean }) {
    const happy = mood === "success";
    const saving = mood === "saving";
    return (
        <div className={`${small ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-[16px]"} relative flex-shrink-0 bg-white/95 flex items-center justify-center overflow-hidden`}>
            <div className="absolute top-[32%] left-[23%] flex gap-2.5">
                <span className={`block w-1.5 ${happy ? "h-1 border-t-2 border-[#39386F] rounded-full" : "h-2 bg-[#39386F] rounded-full"} ${saving ? "animate-pulse" : ""}`} />
                <span className={`block w-1.5 ${happy ? "h-1 border-t-2 border-[#39386F] rounded-full" : "h-2 bg-[#39386F] rounded-full"} ${saving ? "animate-pulse" : ""}`} />
            </div>
            <span className={`absolute top-[61%] w-3 h-1.5 border-b-2 border-[#39386F] ${happy ? "rounded-b-full" : "rounded-full"}`} />
            <span className="absolute left-1 top-[52%] w-1.5 h-1 rounded-full bg-pink-300/70" />
            <span className="absolute right-1 top-[52%] w-1.5 h-1 rounded-full bg-pink-300/70" />
        </div>
    );
}
