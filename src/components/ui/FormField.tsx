'use client';

type FormFieldType = 'text' | 'email' | 'tel' | 'textarea';

interface FormFieldProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: FormFieldType;
	className?: string;
	minHeight?: string;
}

export function FormField({
	label,
	value,
	onChange,
	placeholder,
	type = 'text',
	className = '',
	minHeight = '100px',
}: FormFieldProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	if (type === 'textarea') {
		return (
			<div className={className}>
				{label && <span className="form-label">{label}</span>}
				<textarea
					className="form-input resize-y"
					value={value}
					onChange={handleChange}
					placeholder={placeholder}
					style={{ minHeight }}
				/>
			</div>
		);
	}

	return (
		<div className={className}>
			{label && <span className="form-label">{label}</span>}
			<input
				type={type}
				className="form-input"
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
			/>
		</div>
	);
}
