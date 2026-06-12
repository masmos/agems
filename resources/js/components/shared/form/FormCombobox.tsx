'use client';

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { FormField } from "./FormField";
import { useId } from 'react';
import { cn } from "@/lib/utils";

interface Option {
    label: string;
    value: string | number;
}

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
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
}

export function FormCombobox<T>({
    form,
    name,
    label,
    required,
    options,
    placeholder = "Select...",
    disabled = false,
}: Props<T>) {
    const id = useId();
    const error = form.errors[name];
    const isDisabled = disabled || form.processing;
    const currentValue = form.data[name];
    
    // Convert options to simple string array for items
    const items = options.map(opt => String(opt.value));
    
    const handleValueChange = (value: string | null) => {
        if (value === null) {
            form.setData(name, null);
            return;
        }
        
        // Find original option to preserve type
        const option = options.find(opt => String(opt.value) === value);
        form.setData(name, option?.value ?? value);
    };

    return (
        <FormField
            name={name as string}
            label={label}
            required={required}
            error={error as string}
        >
            <Combobox
                items={items}
                value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ""}
                onValueChange={handleValueChange}
                disabled={isDisabled}
            >
                <ComboboxInput
                    id={id}
                    placeholder={placeholder}
                    className={cn(
                        error && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isDisabled}
                />
                <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                        {(item: string) => {
                            const option = options.find(opt => String(opt.value) === item);
                            return (
                                <ComboboxItem key={item} value={item}>
                                    {option?.label || item}
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </FormField>
    );
}