"use client";

import {Plus} from "lucide-react";
import type {ReactNode} from "react";

type AddButtonVariant = "full" | "inline";

interface AddButtonProps {
    onClick: () => void;
    variant?: AddButtonVariant;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

export function AddButton({
    onClick,
    variant = "full",
    children,
    disabled = false,
    className = "",
}: AddButtonProps) {
    if (variant === "inline") {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`mt-2 w-full py-2 text-xs text-[#999] border border-dashed border-[#ddd]
				rounded-lg hover:border-[#bbb] hover:text-[#666] transition-colors
				flex items-center justify-center gap-1
				disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                <Plus className="w-3.5 h-3.5" /> {children}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`btn-secondary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            <Plus className="w-4 h-4" /> {children}
        </button>
    );
}
