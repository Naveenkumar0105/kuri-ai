import { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    preference: string;
    onPreferenceChange: (pref: string) => void;
}

export function SettingsModal({ isOpen, onClose, preference, onPreferenceChange }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-md">
            <div className="bg-card rounded-2xl shadow-lg w-full max-w-md flex flex-col border border-border">
                <div className="p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Before applying AI changes
                    </h3>
                    <div className="space-y-3">
                        <Option 
                            title="Task splitting only" 
                            subtitle="Auto-apply simple metadata changes. Preview only when splitting tasks." 
                            value="SPLIT_ONLY" 
                            current={preference} 
                            onClick={onPreferenceChange}
                            badge="Recommended"
                        />
                        <Option 
                            title="Every AI change" 
                            subtitle="Preview all meaningful AI modifications before saving." 
                            value="ALWAYS" 
                            current={preference} 
                            onClick={onPreferenceChange}
                        />
                        <Option 
                            title="Never ask" 
                            subtitle="Apply all AI results instantly. You can always Undo." 
                            value="NEVER" 
                            current={preference} 
                            onClick={onPreferenceChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Option({ title, subtitle, value, current, onClick, badge }: any) {
    const isSelected = value === current;
    return (
        <button
            onClick={() => onClick(value)}
            className={cn(
                "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                isSelected 
                    ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 shadow-sm" 
                    : "border-gray-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-700/50"
            )}
        >
            <div className={cn(
                "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300 dark:border-gray-600"
            )}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-medium", isSelected ? "text-purple-900 dark:text-purple-100" : "text-gray-900 dark:text-gray-100")}>
                        {title}
                    </p>
                    {badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {subtitle}
                </p>
            </div>
        </button>
    );
}
