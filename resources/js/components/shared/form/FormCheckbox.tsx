'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "./FormField";

interface Props<T = any> {
    form: {
        data: T;
        setData: (key: keyof T, value: any) => void;
        errors: Partial<Record<keyof T, string>>;
        processing?: boolean;
    };
    name: keyof T;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

export function FormCheckbox<T>({
    form,
    name,
    label,
    required,
    disabled = false,
}: Props<T>) {
    const error = form.errors[name];
    const isDisabled = disabled || form.processing;
    const checked = !!form.data[name];

    return (
        <FormField
            name={name as string}
            error={error as string}
            required={required}
        >
            <div className="flex items-center gap-2">
                <Checkbox
                    id={name as string}
                    checked={checked}
                    onCheckedChange={(checkedValue: boolean | "indeterminate") =>
                        form.setData(name, checkedValue === true)
                    }
                    disabled={isDisabled}
                    aria-invalid={!!error}
                    aria-required={required}
                    className={error ? 'border-destructive' : ''}
                />
                {label && (
                    <label
                        htmlFor={name as string}
                        className={`
                            text-sm font-medium leading-none select-none
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
            </div>
        </FormField>
    );
}