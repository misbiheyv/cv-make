'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, IconButton, MoveButtons } from '@/components/ui';
import { useResumeStore } from '@/store/useResumeStore';

export function SkillsForm() {
	const { skills, addSkill, removeSkill, moveSkill } = useResumeStore();
	const [newSkill, setNewSkill] = useState('');

	const handleAddSkill = () => {
		if (newSkill.trim()) {
			addSkill(newSkill.trim());
			setNewSkill('');
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddSkill();
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<input
					type="text"
					className="form-input flex-1"
					value={newSkill}
					onChange={(e) => setNewSkill(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Add a skill (e.g., TypeScript, React)"
				/>
				<button
					type="button"
					onClick={handleAddSkill}
					className="btn-primary px-3"
					disabled={!newSkill.trim()}
				>
					<Plus className="w-4 h-4" />
				</button>
			</div>

			<div className="space-y-2">
				{skills.map((skill, index) => (
					<div key={index} className="flex gap-2 items-center">
						<MoveButtons
							onMoveUp={() => moveSkill(index, 'up')}
							onMoveDown={() => moveSkill(index, 'down')}
							isFirst={index === 0}
							isLast={index === skills.length - 1}
						/>
						<span className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
							{skill}
						</span>
						<IconButton
							icon={X}
							onClick={() => removeSkill(index)}
							variant="ghost"
							title="Delete"
						/>
					</div>
				))}
			</div>

			<EmptyState show={skills.length === 0}>
				No skills added yet. Add your technical and soft skills.
			</EmptyState>
		</div>
	);
}
