'use client';

import { useResumeStore } from '@/store/useResumeStore';
import { SectionCard, AddButton } from '@/components/ui';

export function EducationForm() {
  const { education, addEducation, updateEducation, removeEducation, moveEducation } =
    useResumeStore();

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <SectionCard
          key={edu.id}
          title={`Education #${index + 1}`}
          onMoveUp={() => moveEducation(edu.id, 'up')}
          onMoveDown={() => moveEducation(edu.id, 'down')}
          onDelete={() => removeEducation(edu.id)}
          isFirst={index === 0}
          isLast={index === education.length - 1}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={edu.degree}
                  onChange={(e) =>
                    updateEducation(edu.id, { degree: e.target.value })
                  }
                  placeholder="Degree"
                />
              </div>
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={edu.institution}
                  onChange={(e) =>
                    updateEducation(edu.id, { institution: e.target.value })
                  }
                  placeholder="Institution"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={edu.location}
                  onChange={(e) =>
                    updateEducation(edu.id, { location: e.target.value })
                  }
                  placeholder="Location"
                />
              </div>
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={edu.startDate}
                  onChange={(e) =>
                    updateEducation(edu.id, { startDate: e.target.value })
                  }
                  placeholder="Start Date"
                />
              </div>
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={edu.endDate}
                  onChange={(e) =>
                    updateEducation(edu.id, { endDate: e.target.value })
                  }
                  placeholder="End Date"
                />
              </div>
            </div>

            <div>
              <textarea
                className="form-input min-h-[60px] resize-y"
                value={edu.description || ''}
                onChange={(e) =>
                  updateEducation(edu.id, { description: e.target.value })
                }
                placeholder="Description (optional)"
              />
            </div>
          </div>
        </SectionCard>
      ))}

      <AddButton onClick={addEducation}>
        Add Education
      </AddButton>
    </div>
  );
}
