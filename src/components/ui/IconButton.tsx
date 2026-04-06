"use client";

import type {LucideIcon} from "lucide-react";

type IconButtonVariant = "danger" | "ghost" | "primary";

interface IconButtonProps {
    icon: LucideIcon;
    onClick?: () => void;
    variant?: IconButtonVariant;
    title?: string;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md";
}

export const variantStyles: Record<IconButtonVariant, string> = {
    danger: "text-[#ddd] hover:text-[#ef4444]",
    ghost: "text-[#ccc] hover:text-[#666]",
    primary: "text-[#888] hover:text-[#111]",
};

export function IconButton({
    icon: Icon,
    onClick,
    variant = "ghost",
    title,
    disabled = false,
    className = "",
    size = "sm",
}: IconButtonProps) {
    const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    const padding = size === "sm" ? "p-1.5" : "p-2";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${variantStyles[variant]} ${padding} rounded-md
			transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
            title={title}
        >
            <Icon className={iconSize} />
        </button>
    );
}
