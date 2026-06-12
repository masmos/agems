import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";

interface Props {
    form: any;
    name: string;
    label?: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    transform?: (value: string) => any;
    value?: string;
    disabled?: boolean;
    step?: number | "any";
    min?: number | string; 
    max?: number | string; 
}

export function FormInput({
    form,
    name,
    label,
    required,
    type = 'text',
    placeholder,
    transform,
    value,
    disabled,
    step,
    min,
    max
}: Props) {
    return (
        <FormField
            name={name}
            label={label}
            required={required}
            error={form.errors[name]}
        >
            <Input
                id={name}
                type={type}
                placeholder={placeholder}
                value={value || form.data[name] || ''}
                onChange={(e) =>
                    form.setData(
                        name,
                        transform ? transform(e.target.value) : e.target.value
                    )
                }
                className={form.errors[name] ? 'border-destructive' : ''}
                disabled={disabled}
                step={step}
                min={min}
                max={max}
            />
        </FormField>
    );
}