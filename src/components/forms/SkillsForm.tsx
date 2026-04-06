'use client';

import { AddButton, EmptyState, ReorderableList } from '@/components/ui';
import { useResumeStore } from '@/store/useResumeStore';

export function SkillsForm() {
	const { skills, addSkill, updateSkill, removeSkill, moveSkill } = useResumeStore();

	return (
		<div className="space-y-4">
			<ReorderableList
				items={skills}
				onMove={(id, direction) => moveSkill(id, direction)}
				onRemove={(id) => removeSkill(id)}
				renderItem={(skill) => (
					<div className="flex gap-3">
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
					</div>
				)}
			/>

			<AddButton onClick={addSkill}>Add Skill</AddButton>

			<EmptyState show={skills.length === 0}>
				No skills added yet. Add your technical and soft skills.
			</EmptyState>
		</div>
	);
}
