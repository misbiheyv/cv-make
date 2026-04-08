"use client";

import {ResumePreview} from "@/components/ResumePreview";
import {Sidebar} from "@/components/Sidebar";

export default function Editor() {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <ResumePreview />
            </main>
        </div>
    );
}
