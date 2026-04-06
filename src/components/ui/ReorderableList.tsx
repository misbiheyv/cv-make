"use client";

import {X} from "lucide-react";
import type {ReactNode} from "react";
import {IconButton} from "./IconButton";
import {MoveButtons} from "./MoveButtons";

interface ReorderableListItem {
    id: string;
}

interface ReorderableListProps<T extends ReorderableListItem> {
    items: T[];
    onMove: (id: string, direction: "up" | "down") => void;
    onRemove: (id: string) => void;
    renderItem: (item: T, index: number) => ReactNode;
    canRemove?: (item: T, index: number) => boolean;
    className?: string;
    itemClassName?: string;
}

export function ReorderableList<T extends ReorderableListItem>({
    items,
    onMove,
    onRemove,
    renderItem,
    canRemove = () => true,
    className = "",
    itemClassName = "",
}: ReorderableListProps<T>) {
    return (
        <div className={`space-y-2 ${className}`}>
            {items.map((item, index) => (
                <div key={item.id} className={`flex gap-2 items-center ${itemClassName}`}>
                    <MoveButtons
                        onMoveUp={() => onMove(item.id, "up")}
                        onMoveDown={() => onMove(item.id, "down")}
                        isFirst={index === 0}
                        isLast={index === items.length - 1}
                    />
                    <div className="flex-1">{renderItem(item, index)}</div>
                    <IconButton
                        icon={X}
                        onClick={() => onRemove(item.id)}
                        variant="danger"
                        title="Delete"
                        disabled={!canRemove(item, index)}
                    />
                </div>
            ))}
        </div>
    );
}
