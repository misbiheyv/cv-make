"use client";

import type {ReactNode} from "react";
import {SectionCard} from "./SectionCard";

interface ReorderableSectionsItem {
    id: string;
}

interface ReorderableSectionsListProps<T extends ReorderableSectionsItem> {
    items: T[];
    onMove: (id: string, direction: "up" | "down") => void;
    onRemove: (id: string) => void;
    renderTitle: (item: T, index: number) => ReactNode;
    renderContent: (item: T, index: number) => ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    className?: string;
}

export function ReorderableSectionsList<T extends ReorderableSectionsItem>({
    items,
    onMove,
    onRemove,
    renderTitle,
    renderContent,
    collapsible = false,
    defaultCollapsed = false,
    className = "",
}: ReorderableSectionsListProps<T>) {
    return (
        <div className={`space-y-4 ${className}`}>
            {items.map((item, index) => (
                <SectionCard
                    key={item.id}
                    title={renderTitle(item, index)}
                    onMoveUp={() => onMove(item.id, "up")}
                    onMoveDown={() => onMove(item.id, "down")}
                    onDelete={() => onRemove(item.id)}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    collapsible={collapsible}
                    defaultCollapsed={defaultCollapsed}
                >
                    {renderContent(item, index)}
                </SectionCard>
            ))}
        </div>
    );
}
