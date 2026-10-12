"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, ChevronRight, FilePlus2, LoaderCircle, Mic, Search, Sparkles, X } from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";
import { SharedSpace } from "@/types";

type SuggestedTask = { text: string; category?: string; dueDate?: string | null; dateType?: string | null };

function formatDueDate(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

async function hideNativeWindow() {
    try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().hide();
    } catch {
        // The companion route is also usable in a browser.
    }
}

export default function CompanionPage() {
    const { status } = useSession();
    const [spaces, setSpaces] = useState<SharedSpace[]>([]);
    const [spaceId, setSpaceId] = useState("personal");
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
    const [stage, setStage] = useState<"capture" | "review" | "saving">("capture");
    const [error, setError] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const destinations = [{ id: "personal", name: "My tasks" }, ...spaces.map((space) => ({ id: space.id, name: space.name }))];

    const reset = () => {
        setInput(""); setSuggestions([]); setError(""); setSpaceId("personal"); setActiveIndex(0); setStage("capture");
    };

    useEffect(() => {
        if (status !== "authenticated") return;
        fetch("/api/spaces").then((response) => response.ok ? response.json() : []).then((data) => { if (Array.isArray(data)) setSpaces(data); }).catch(() => setSpaces([]));
    }, [status]);

    useEffect(() => {
        if (stage !== "capture") return;
        const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 0);
        focusInput();
        window.addEventListener("focus", focusInput);
        return () => window.removeEventListener("focus", focusInput);
    }, [stage]);

    useEffect(() => {
        const { background: htmlBackground } = document.documentElement.style;
        const { background: bodyBackground } = document.body.style;
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
        return () => {
            document.documentElement.style.background = htmlBackground;
            document.body.style.background = bodyBackground;
        };
    }, []);

    const toggleListening = async () => {
        if (recorderRef.current?.state === "recording") return recorderRef.current.stop();
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return setError("Voice input is not supported here.");
        setError("");
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setError("Allow microphone access for Kuri, then try again.");
            return;
        }
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorderRef.current = recorder;
        recorder.onstart = () => setIsListening(true);
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = async () => {
            setIsListening(false);
            stream.getTracks().forEach((track) => track.stop());
            recorderRef.current = null;
            if (!chunks.length) return setError("No audio was recorded. Try again.");
            try {
                const form = new FormData();
                form.append("audio", new Blob(chunks, { type: recorder.mimeType }), "task-audio");
                const response = await fetch("/api/transcribe", { method: "POST", body: form });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Kuri could not transcribe that.");
                setInput(data.text);
                inputRef.current?.focus();
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Kuri could not transcribe that.");
            }
        };
        recorder.start();
    };

    const askKuri = async (event?: FormEvent) => {
        event?.preventDefault();
        if (!input.trim() || stage === "saving") return;
        setError(""); setStage("saving");
        try {
            const response = await fetch("/api/categorize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input.trim(), userLocalTime: new Date().toString() }) });
            if (!response.ok) throw new Error("Kuri could not understand that task.");
            const data = await response.json();
            setSuggestions(Array.isArray(data.tasks) && data.tasks.length ? data.tasks as SuggestedTask[] : [{ text: input.trim(), category: "Uncategorized" }]);
            setActiveIndex(0); setStage("review");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Kuri could not understand that task."); setStage("capture");
        }
    };

    const saveTasks = async (destinationId = spaceId) => {
        if (!suggestions.length) return;
        setError(""); setStage("saving");
        try {
            const responses = await Promise.all(suggestions.map((task) => fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: task.text, category: task.category || "Uncategorized", dueDate: task.dueDate || null, dateType: task.dateType || null, sharedSpaceId: destinationId === "personal" ? null : destinationId }) })));
            if (responses.some((response) => !response.ok)) throw new Error("The task could not be saved.");
            reset(); await hideNativeWindow();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The task could not be saved."); setStage("review");
        }
    };

    const handleKeys = (event: KeyboardEvent) => {
        if (event.key === "Escape") { event.preventDefault(); void hideNativeWindow(); return; }
        if (stage === "saving") return;
        const count = stage === "capture" ? (input.trim() ? destinations.length + 1 : 0) : destinations.length;
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && count) {
            event.preventDefault(); setActiveIndex((current) => (current + (event.key === "ArrowDown" ? 1 : count - 1)) % count); return;
        }
        if (event.key === "Enter" && stage === "capture" && input.trim()) {
            event.preventDefault();
            if (activeIndex) setSpaceId(destinations[activeIndex - 1].id);
            void askKuri();
        }
        if (event.key === "Enter" && stage === "review") { event.preventDefault(); void saveTasks(destinations[activeIndex].id); }
    };

    const chooseDestination = (index: number) => { setSpaceId(destinations[index].id); setActiveIndex(index + 1); };

    if (status === "loading") return <main className="kuri-companion grid min-h-screen place-items-center text-white"><LoaderCircle className="h-5 w-5 animate-spin" /></main>;

    return (
        <main className="kuri-companion grid min-h-screen place-items-center p-2 text-white selection:bg-[#8b88ff]" onKeyDown={handleKeys}>
            <section className="w-full overflow-hidden rounded-[20px] bg-[#1d1d1f]/70 backdrop-blur-3xl">
                <form onSubmit={askKuri} className={`flex items-center gap-3 px-5 py-4 ${stage === "capture" && !input.trim() ? "" : "border-b border-white/15"}`}>
                    <Search className="h-5 w-5 shrink-0 text-white/55" />
                    <input id="kuri-task" ref={inputRef} autoFocus value={input} onChange={(event) => { setInput(event.target.value); setActiveIndex(0); }} placeholder="Add a task with Kuri" disabled={stage === "saving"} className="min-w-0 flex-1 bg-transparent text-[20px] font-medium tracking-tight text-white outline-none placeholder:text-white/45 disabled:opacity-60" />
                    {stage === "saving" ? <div className="grid h-9 w-9 place-items-center" role="status" aria-label="Kuri is analyzing your task"><ThinkingOrb state="working" size={20} theme="dark" speed={1.85} /></div> : <button type="button" onClick={toggleListening} className={`grid h-9 w-9 place-items-center rounded-lg transition ${isListening ? "bg-rose-400/25 text-rose-100" : "text-white/55 hover:bg-white/10 hover:text-white"}`} aria-label={isListening ? "Stop listening" : "Speak your task"} title="Speak your task"><Mic className="h-5 w-5" /></button>}
                    <button type="button" onClick={() => void hideNativeWindow()} className="grid h-9 w-9 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Hide Kuri"><X className="h-5 w-5" /></button>
                </form>

                {stage === "review" ? <div className="p-3">
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-white/45"><Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-[#aaa8ff]" />Kuri understood</p>
                    {suggestions.map((task, index) => <div key={`${task.text}-${index}`} className="rounded-xl px-3 py-2.5"><p className="text-sm font-semibold">{task.text}</p><p className="mt-0.5 text-xs text-white/50">{task.category || "Uncategorized"}{formatDueDate(task.dueDate) ? ` · ${formatDueDate(task.dueDate)}` : ""}</p></div>)}
                    <p className="mt-2 border-t border-white/10 px-3 pt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-white/45">Save to</p>
                    {destinations.map((destination, index) => <button key={destination.id} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => { setSpaceId(destination.id); void saveTasks(destination.id); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${activeIndex === index ? "bg-[#7b78f1]/80 text-white" : "text-white/80 hover:bg-white/10"}`}><Check className={`h-4 w-4 ${spaceId === destination.id ? "opacity-100" : "opacity-0"}`} /><span className="flex-1 text-sm font-medium">{destination.name}</span>{activeIndex === index && <span className="text-xs text-white/70">Return</span>}</button>)}
                </div> : input.trim() ? <div className="p-3">
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-white/45">Task action</p>
                    <button type="submit" onMouseEnter={() => setActiveIndex(0)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeIndex === 0 ? "bg-[#7b78f1]/80" : "hover:bg-white/10"}`}><FilePlus2 className="h-5 w-5" /><span className="flex-1"><span className="block text-sm font-semibold">Add “{input.trim()}”</span><span className="text-xs text-white/60">Kuri will organize it before saving</span></span><span className="text-xs text-white/65">Return</span></button>
                    <p className="mt-3 border-t border-white/10 px-3 pt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-white/45">Destination</p>
                    {destinations.map((destination, index) => <button key={destination.id} type="button" onMouseEnter={() => chooseDestination(index)} onClick={() => { chooseDestination(index); void askKuri(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${activeIndex === index + 1 ? "bg-white/12" : "hover:bg-white/10"}`}><span className={`h-2 w-2 rounded-full ${spaceId === destination.id ? "bg-[#aaa8ff]" : "bg-white/20"}`} /><span className="flex-1 text-sm text-white/80">{destination.name}</span><ChevronRight className="h-4 w-4 text-white/35" /></button>)}
                </div> : null}
                {error && <p className="border-t border-white/10 px-5 py-3 text-xs text-rose-300">{error}</p>}
            </section>
        </main>
    );
}
