'use client';

interface Props {
    label?: string;
    name: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}

export function FormField({ label, name, error, required, children }: Props) {
    return (
        <div className="space-y-2">
            {label && (
                <label htmlFor={name} className="text-sm font-medium">
                    {label}
                    {required && <span className="text-destructive"> *</span>}
                </label>
            )}

            {children}

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}