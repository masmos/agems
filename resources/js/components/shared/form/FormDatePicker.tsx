'use client';

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Calendar, X } from "lucide-react";
import { FormField } from "./FormField";
import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string;
}

export function FormDatePicker<T>({
    form,
    name,
    label,
    required,
    placeholder = "Select date",
    disabled = false,
    clearable = false,
    minDate,
    maxDate,
    dateFormat = "PPP",
}: Props<T>) {
    const [open, setOpen] = React.useState(false);
    const error = form.errors[name];
    const isDisabled = disabled || form.processing;
    
    const selectedDate = form.data[name] ? new Date(form.data[name] as string) : undefined;

    const handleDateSelect = (date: Date | undefined) => {
        form.setData(name, date ? date.toISOString() : null);
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        form.setData(name, null);
    };

    // Determine if a date should be disabled
    const isDateDisabled = (date: Date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    };

    return (
        <FormField
            name={name as string}
            label={label}
            required={required}
            error={error as string}
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name as string}
                        variant="outline"
                        disabled={isDisabled}
                        className={cn(
                            "w-full justify-between font-normal relative",
                            !selectedDate && "text-muted-foreground",
                            error && "border-destructive"
                        )}
                    >
                        <span className="truncate">
                            {selectedDate ? (
                                format(selectedDate, dateFormat)
                            ) : (
                                placeholder
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            {clearable && selectedDate && (
                                <X 
                                    className="h-4 w-4 opacity-50 hover:opacity-100" 
                                    onClick={handleClear}
                                />
                            )}
                            <Calendar className="h-4 w-4" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <UiCalendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={isDateDisabled}
                        initialFocus
                        className="rounded-md border"
                    />
                </PopoverContent>
            </Popover>
        </FormField>
    );
}