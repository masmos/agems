'use client';

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from '@/components/ui/select';
import { FormField } from './FormField';

/**
 * Generic Option type
 */
interface Option<T = string | number> {
    label: string;
    value: T;
}

/**
 * Generic Props
 */
interface Props<T = string | number> {
    form: any;
    name: string;
    label?: string;
    required?: boolean;
    options: Option<T>[];
    placeholder?: string;
    disabled?: boolean;
    onChange?: (value: T) => void;
}

/**
 * Generic FormSelect Component
 */
export function FormSelect<T extends string | number>({
    form,
    name,
    label,
    required,
    options,
    placeholder,
    disabled,
    onChange,
}: Props<T>) {
    const currentValue = form.data?.[name] != null ? String(form.data[name]) : '';

    const handleChange = (val: string) => {
        const matchedOption = options.find(
            (opt) => String(opt.value) === val
        );

        if (matchedOption) {
            form.setData(name, matchedOption.value); 
            onChange?.(matchedOption.value);
        }
    };

    return (
        <FormField
            name={name}
            label={label}
            required={required}
            error={form.errors?.[name]}
        >
            <Select
                value={currentValue}
                onValueChange={handleChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder || 'Select…'} />
                </SelectTrigger>

                <SelectContent className="w-full">
                    {options.map((opt) => (
                        <SelectItem
                            key={String(opt.value)}
                            value={String(opt.value)}
                        >
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormField>
    );
}