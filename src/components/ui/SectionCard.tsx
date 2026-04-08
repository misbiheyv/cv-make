"use client";

import {ChevronRight, Trash2} from "lucide-react";
import type {ReactNode} from "react";
import {useState} from "react";
import {IconButton, variantStyles} from "./IconButton";
import {MoveButtons} from "./MoveButtons";

interface SectionCardProps {
    title: ReactNode;
    children: ReactNode;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    isFirst: boolean;
    isLast: boolean;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    className?: string;
}

export function SectionCard({
    title,
    children,
    onMoveUp,
    onMoveDown,
    onDelete,
    isFirst,
    isLast,
    collapsible = false,
    defaultCollapsed = false,
    className = "",
}: SectionCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div className={`section-card ${className}`}>
            <div className="section-card-header">
                {collapsible ? (
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-hover text-left min-w-0 ${variantStyles.ghost}`}
                    >
                        <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${isCollapsed ? "" : "rotate-90"}`}
                        />
                        <span>{title}</span>
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-primary">{title}</span>
                )}
                <div className="flex items-center gap-0.5">
                    <MoveButtons
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        isFirst={isFirst}
                        isLast={isLast}
                    />
                    <div className="w-px h-4 bg-border mx-1.5" />
                    <IconButton icon={Trash2} onClick={onDelete} variant="danger" title="Delete" />
                </div>
            </div>

            {(!collapsible || !isCollapsed) && <div className="section-card-body">{children}</div>}
        </div>
    );
}
