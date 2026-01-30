'use client';

import { Trash2 } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { FormField, AddButton, MoveButtons, IconButton } from '@/components/ui';

export function PersonalInfoForm() {
  const {
    personalInfo,
    updatePersonalInfo,
    addLink,
    updateLink,
    removeLink,
    moveLink,
  } = useResumeStore();

  return (
    <div className="space-y-4">
      <FormField
        label="Full Name"
        value={personalInfo.fullName}
        onChange={(value) => updatePersonalInfo({ fullName: value })}
        placeholder="John Doe"
      />

      <div>
        <label className="form-label">Links</label>
        <div className="space-y-2">
          {personalInfo.links.map((link, index) => (
            <div key={index} className="flex gap-2 items-start">
              <MoveButtons
                onMoveUp={() => moveLink(index, 'up')}
                onMoveDown={() => moveLink(index, 'down')}
                isFirst={index === 0}
                isLast={index === personalInfo.links.length - 1}
                className="pt-2"
              />
              <input
                type="text"
                className="form-input flex-1"
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
              <IconButton
                icon={Trash2}
                onClick={() => removeLink(index)}
                variant="danger"
                title="Delete"
                className="pt-3"
              />
            </div>
          ))}
        </div>
        <AddButton onClick={addLink} variant="inline">
          Add link
        </AddButton>
      </div>

      <FormField
        label="Summary"
        type="textarea"
        value={personalInfo.summary}
        onChange={(value) => updatePersonalInfo({ summary: value })}
        placeholder="A brief professional summary..."
        minHeight="100px"
      />
    </div>
  );
}
