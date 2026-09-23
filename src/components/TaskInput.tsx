"use client";

import { useState, useRef } from "react";
import { Mic, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThinkingOrb } from "thinking-orbs";

interface TaskInputProps {
    onAddTask: (text: string, useAI: boolean) => Promise<boolean | void>;
    isProcessing: boolean;
}

export function TaskInput({ onAddTask, isProcessing }: TaskInputProps) {
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const startListening = () => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current!.continuous = false;
            recognitionRef.current!.interimResults = false;

            recognitionRef.current!.onstart = () => setIsListening(true);
            recognitionRef.current!.onend = () => setIsListening(false);
            recognitionRef.current!.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };

            recognitionRef.current!.start();
        } else {
            alert("Voice input is not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;
        const success = await onAddTask(input, false);
        if (success !== false) setInput("");
    };

    const handleAIAssist = async () => {
        if (!input.trim() || isProcessing) return;
        const success = await onAddTask(input, true);
        if (success !== false) setInput("");
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-center bg-card rounded-xl border border-border transition-all focus-within:ring-2 focus-within:ring-[#5E5CE6]/30 focus-within:border-[#5E5CE6]/40 shadow-sm overflow-hidden">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add a new task…"
                    className={cn(
                        "w-full px-4 py-3 text-[15px] bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground text-foreground pr-36 rounded-xl transition-colors",
                        isProcessing && "text-muted-foreground"
                    )}
                    readOnly={isProcessing}
                />

                <div className="absolute right-2 flex items-center gap-1">
                    {isProcessing ? (
                        <div className="flex items-center justify-center pr-3 animate-in fade-in zoom-in duration-200">
                            <ThinkingOrb state="working" size={20} speed={1.85} />
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={cn(
                                    "p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors hover:bg-secondary",
                                    isListening && "text-red-500 animate-pulse bg-red-50 dark:bg-red-900/20"
                                )}
                                disabled={isProcessing}
                                title="Voice Input"
                                aria-label="Voice Input"
                            >
                                <Mic className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={handleAIAssist}
                                disabled={!input.trim() || isProcessing}
                                title="Organize with AI"
                                aria-label="Organize with AI"
                                className="p-2 text-[#5E5CE6] dark:text-[#7C7AE8] hover:bg-[#5E5CE6]/10 rounded-lg transition-colors disabled:opacity-40"
                            >
                                <Sparkles className="w-4 h-4" />
                            </button>

                            <button
                                type="submit"
                                disabled={!input.trim() || isProcessing}
                                className="p-2 mr-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg disabled:opacity-40 transition-colors"
                                title="Quick Add (Enter)"
                                aria-label="Add task"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
}
