"use client";

import { useState, useRef } from "react";
import { Mic, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TaskInputProps {
    onAddTask: (text: string) => Promise<void>;
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
                // Optional: Auto-submit on voice end? Maybe better to let user confirm.
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
        await onAddTask(input);
        setInput("");
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full mb-0">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add a new task..."
                    className="w-full px-6 py-4 text-lg bg-transparent border-none focus:ring-0 placeholder:text-gray-400 text-gray-900 dark:text-gray-100 pr-32"
                    disabled={isProcessing}
                />

                <div className="absolute right-2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        className={cn(
                            "p-2 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-700",
                            isListening && "text-red-500 animate-pulse bg-red-50 dark:bg-red-900/20"
                        )}
                        disabled={isProcessing}
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
