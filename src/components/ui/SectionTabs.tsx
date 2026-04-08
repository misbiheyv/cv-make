"use client";

interface Tab {
    id: string;
    label: string;
}

interface SectionTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function SectionTabs({tabs, activeTab, onTabChange}: SectionTabsProps) {
    return (
        <div className="flex flex-wrap gap-1 px-4 py-3">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                        activeTab === tab.id
                            ? "bg-primary text-white"
                            : "bg-surface-muted text-text-secondary hover:bg-surface-hover hover:text-primary-hover"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
