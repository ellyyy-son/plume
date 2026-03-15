"use client";

import { useState, useRef, useEffect } from "react";

type CustomSelectProps = {
    value: string;
    options: string[];
    onChange: (val: string) => void;
    className?: string;
};

export default function CustomSelect({ value, options, onChange, className }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>

            {/* Trigger button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="bg-white rounded-xl px-16 py-4 font-bold text-gray-700 shadow-lg
          flex items-center justify-center gap-2 w-full cursor-pointer text-xl
          hover:bg-gray-50 transition-colors"
            >
                {value}
                <span className={`text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <ul className="absolute top-full mt-1 left-0 w-full bg-white rounded-xl 
          shadow-lg z-50 max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 py-1">
                    {options.map(opt => (
                        <li
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`px-4 py-2 text-center text-gray-700 font-bold cursor-pointer
                hover:bg-pink-100 transition-colors
                ${opt === value ? "bg-pink-200 text-pink-800" : ""}`}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}