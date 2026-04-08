"use client";

import {AddButton, FormField, ReorderableList} from "@/components/ui";
import {useResumeStore} from "@/store/useResumeStore";

export function PersonalInfoForm() {
    const {personalInfo, updatePersonalInfo, addLink, updateLink, removeLink, moveLink} =
        useResumeStore();

    return (
        <div className="space-y-4">
            <FormField
                label="Full Name"
                value={personalInfo.fullName}
                onChange={(value) => updatePersonalInfo({fullName: value})}
                placeholder="John Doe"
            />

            <div className="flex gap-3">
                <FormField
                    label="Phone"
                    value={personalInfo.phone ?? ""}
                    onChange={(value) => updatePersonalInfo({phone: value})}
                    placeholder="+1 (234) 567-8900"
                    className="flex-1"
                />
                <FormField
                    label="Location"
                    value={personalInfo.city ?? ""}
                    onChange={(value) => updatePersonalInfo({city: value})}
                    placeholder="New York, NY"
                    className="flex-1"
                />
            </div>

            <div>
                <span className="form-label">Links</span>
                <ReorderableList
                    items={personalInfo.links.map((url, i) => ({id: String(i), url}))}
                    onMove={(id, dir) => moveLink(Number(id), dir)}
                    onRemove={(id) => removeLink(Number(id))}
                    renderItem={(item) => (
                        <input
                            type="text"
                            className="form-input w-full"
                            value={item.url}
                            onChange={(e) => updateLink(Number(item.id), e.target.value)}
                            placeholder="linkedin.com/in/username"
                        />
                    )}
                />
                <AddButton onClick={addLink} variant="inline">
                    Add link
                </AddButton>
            </div>

            <FormField
                label="Summary"
                type="textarea"
                value={personalInfo.summary}
                onChange={(value) => updatePersonalInfo({summary: value})}
                placeholder="A brief professional summary..."
                minHeight="80px"
            />
        </div>
    );
}
