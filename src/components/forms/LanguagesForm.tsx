"use client";

import {AddButton, EmptyState, ReorderableList} from "@/components/ui";
import {useResumeStore} from "@/store/useResumeStore";

export function LanguagesForm() {
    const {languages, addLanguage, updateLanguage, removeLanguage, moveLanguage} = useResumeStore();

    return (
        <div className="space-y-4">
            <ReorderableList
                items={languages}
                onMove={(id, direction) => moveLanguage(id, direction)}
                onRemove={(id) => removeLanguage(id)}
                renderItem={(lang) => (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input
                                type="text"
                                className="form-input"
                                value={lang.name}
                                onChange={(e) => updateLanguage(lang.id, {name: e.target.value})}
                                placeholder="Language"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                className="form-input"
                                value={lang.level}
                                onChange={(e) => updateLanguage(lang.id, {level: e.target.value})}
                                placeholder="Level"
                            />
                        </div>
                    </div>
                )}
            />

            <AddButton onClick={addLanguage}>Add Language</AddButton>

            <EmptyState show={languages.length === 0}>No languages added yet</EmptyState>
        </div>
    );
}
