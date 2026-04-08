"use client";

import {AddButton, EmptyState, ReorderableList, ReorderableSectionsList} from "@/components/ui";
import {useResumeStore} from "@/store/useResumeStore";

export function WorkExperienceForm() {
    const {
        workExperience,
        addWorkExperience,
        updateWorkExperience,
        removeWorkExperience,
        moveWorkExperience,
        addBullet,
        updateBullet,
        removeBullet,
        moveBullet,
    } = useResumeStore();

    return (
        <div className="space-y-4">
            <ReorderableSectionsList
                items={workExperience}
                onMove={(id, dir) => moveWorkExperience(id, dir)}
                onRemove={(id) => removeWorkExperience(id)}
                collapsible
                renderTitle={(exp, index) => (
                    <span className="text-text-tertiary">
                        {exp.title && exp.company
                            ? `${exp.title} @ ${exp.company}`
                            : `Experience #${index + 1}`}
                    </span>
                )}
                renderContent={(exp) => (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={exp.title}
                                    onChange={(e) =>
                                        updateWorkExperience(exp.id, {title: e.target.value})
                                    }
                                    placeholder="Job Title"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={exp.company}
                                    onChange={(e) =>
                                        updateWorkExperience(exp.id, {company: e.target.value})
                                    }
                                    placeholder="Company Name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={exp.location}
                                    onChange={(e) =>
                                        updateWorkExperience(exp.id, {location: e.target.value})
                                    }
                                    placeholder="Location"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={exp.startDate}
                                    onChange={(e) =>
                                        updateWorkExperience(exp.id, {startDate: e.target.value})
                                    }
                                    placeholder="Start Date"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={exp.endDate}
                                    onChange={(e) =>
                                        updateWorkExperience(exp.id, {endDate: e.target.value})
                                    }
                                    placeholder="End Date"
                                />
                            </div>
                        </div>

                        <div>
                            <ReorderableList
                                items={exp.bullets.map((text, i) => ({id: String(i), text}))}
                                onMove={(id, dir) => moveBullet(exp.id, Number(id), dir)}
                                onRemove={(id) => removeBullet(exp.id, Number(id))}
                                canRemove={() => exp.bullets.length > 1}
                                renderItem={(item) => (
                                    <textarea
                                        className="form-input w-full min-h-[80px] resize-y"
                                        value={item.text}
                                        onChange={(e) =>
                                            updateBullet(exp.id, Number(item.id), e.target.value)
                                        }
                                        placeholder="Describe your achievement..."
                                    />
                                )}
                            />
                            <AddButton onClick={() => addBullet(exp.id)} variant="inline">
                                Add bullet
                            </AddButton>
                        </div>
                    </div>
                )}
            />

            <AddButton onClick={addWorkExperience}>Add Experience</AddButton>

            <EmptyState show={workExperience.length === 0}>No experience added yet</EmptyState>
        </div>
    );
}
