// components/form/FormFileUpload.tsx

import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";

interface Props {
    form: any;
    name: string;
    label?: string;
    required?: boolean;
}

export function FormFileUpload({ form, name, label, required }: Props) {
    return (
        <FormField
            name={name}
            label={label}
            required={required}
            error={form.errors[name]}
        >
            <Input
                id={name}
                type="file"
                onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
form.setData(name, file);
}
                }}
                className={form.errors[name] ? 'border-destructive' : ''}
            />
        </FormField>
    );
}