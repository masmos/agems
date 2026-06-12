import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./FormField";

interface Props {
    form: any;
    name: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
}

export function FormTextarea({
    form,
    name,
    label,
    required,
    placeholder,
}: Props) {
    return (
        <FormField
            name={name}
            label={label}
            required={required}
            error={form.errors[name]}
        >
            <Textarea
                id={name}
                placeholder={placeholder}
                value={form.data[name] || ''}
                onChange={(e) => form.setData(name, e.target.value)}
                className={form.errors[name] ? 'border-destructive' : ''}
            />
        </FormField>
    );
}