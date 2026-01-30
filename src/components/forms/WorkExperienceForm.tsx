'use client';

import { useResumeStore } from '@/store/useResumeStore';
import { X } from 'lucide-react';
import { SectionCard, MoveButtons, IconButton, AddButton } from '@/components/ui';

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
      {workExperience.map((exp, index) => (
        <SectionCard
          key={exp.id}
          title={
            exp.title && exp.company ? (
              <span className="text-gray-400">
                {exp.title} @ {exp.company}
              </span>
            ) : (
              `Experience #${index + 1}`
            )
          }
          onMoveUp={() => moveWorkExperience(exp.id, 'up')}
          onMoveDown={() => moveWorkExperience(exp.id, 'down')}
          onDelete={() => removeWorkExperience(exp.id)}
          isFirst={index === 0}
          isLast={index === workExperience.length - 1}
          collapsible
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  className="form-input"
                  value={exp.title}
                  onChange={(e) =>
                    updateWorkExperience(exp.id, { title: e.target.value })
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
                    updateWorkExperience(exp.id, { company: e.target.value })
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
                    updateWorkExperience(exp.id, { location: e.target.value })
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
                    updateWorkExperience(exp.id, { startDate: e.target.value })
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
                    updateWorkExperience(exp.id, { endDate: e.target.value })
                  }
                  placeholder="End Date"
                />
              </div>
            </div>

            <div>
              <div className="space-y-2">
                {exp.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <MoveButtons
                      onMoveUp={() => moveBullet(exp.id, bulletIndex, 'up')}
                      onMoveDown={() => moveBullet(exp.id, bulletIndex, 'down')}
                      isFirst={bulletIndex === 0}
                      isLast={bulletIndex === exp.bullets.length - 1}
                      className="pt-2"
                    />
                    <textarea
                      className="form-input flex-1 min-h-[80px] resize-y"
                      value={bullet}
                      onChange={(e) =>
                        updateBullet(exp.id, bulletIndex, e.target.value)
                      }
                      placeholder="Describe your achievement..."
                    />
                    <IconButton
                      icon={X}
                      onClick={() => removeBullet(exp.id, bulletIndex)}
                      variant="ghost"
                      title="Delete"
                      disabled={exp.bullets.length <= 1}
                      className="pt-3"
                    />
                  </div>
                ))}
              </div>
              <AddButton onClick={() => addBullet(exp.id)} variant="inline">
                Add bullet
              </AddButton>
            </div>
          </div>
        </SectionCard>
      ))}

      <AddButton onClick={addWorkExperience}>
        Add Experience
      </AddButton>
    </div>
  );
}
