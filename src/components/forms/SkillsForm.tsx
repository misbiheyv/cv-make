'use client';

import { X } from 'lucide-react';
import { AddButton, EmptyState, IconButton, MoveButtons } from '@/components/ui';
import { useResumeStore } from '@/store/useResumeStore';

export function SkillsForm() {
	const { skills, addSkill, updateSkill, removeSkill, moveSkill } = useResumeStore();

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{skills.map((skill, index) => (
					<div key={skill.id} className="flex gap-2 items-center">
						<MoveButtons
							onMoveUp={() => moveSkill(skill.id, 'up')}
							onMoveDown={() => moveSkill(skill.id, 'down')}
							isFirst={index === 0}
							isLast={index === skills.length - 1}
						/>
						<input
							type="text"
							className="form-input w-1/3"
							value={skill.name}
							onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
							placeholder="Skill name"
						/>
						<input
							type="text"
							className="form-input flex-1"
							value={skill.description}
							onChange={(e) => updateSkill(skill.id, { description: e.target.value })}
							placeholder="Description"
						/>
						<IconButton
							icon={X}
							onClick={() => removeSkill(skill.id)}
							variant="danger"
							title="Delete"
						/>
					</div>
				))}
			</div>

			<EmptyState show={skills.length === 0}>
				No skills added yet. Add your technical and soft skills.
			</EmptyState>

			<AddButton onClick={addSkill}>Add Skill</AddButton>
		</div>
	);
}
