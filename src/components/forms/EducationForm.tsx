'use client';

import { AddButton, ReorderableSectionsList } from '@/components/ui';
import { useResumeStore } from '@/store/useResumeStore';

export function EducationForm() {
	const { education, addEducation, updateEducation, removeEducation, moveEducation } =
		useResumeStore();

	return (
		<div className="space-y-4">
			<ReorderableSectionsList
				items={education}
				onMove={(id, dir) => moveEducation(id, dir)}
				onRemove={(id) => removeEducation(id)}
				renderTitle={(_edu, index) => <span className="text-gray-400">Education #{index + 1}</span>}
				renderContent={(edu) => (
					<div className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<input
									type="text"
									className="form-input"
									value={edu.degree}
									onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
									placeholder="Degree"
								/>
							</div>
							<div>
								<input
									type="text"
									className="form-input"
									value={edu.institution}
									onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
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
									onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
									placeholder="Location"
								/>
							</div>
							<div>
								<input
									type="text"
									className="form-input"
									value={edu.startDate}
									onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
									placeholder="Start Date"
								/>
							</div>
							<div>
								<input
									type="text"
									className="form-input"
									value={edu.endDate}
									onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
									placeholder="End Date"
								/>
							</div>
						</div>

						<div>
							<textarea
								className="form-input min-h-[60px] resize-y"
								value={edu.description || ''}
								onChange={(e) => updateEducation(edu.id, { description: e.target.value })}
								placeholder="Description (optional)"
							/>
						</div>
					</div>
				)}
			/>

			<AddButton onClick={addEducation}>Add Education</AddButton>
		</div>
	);
}
