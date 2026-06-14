'use client';

import type { Page, PageProps as InertiaPageProps } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import { Loader, X } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Method = 'post' | 'patch' | 'put' | 'delete';

type FlashMessage = {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
};

interface PageProps extends InertiaPageProps {
    flash?: FlashMessage;
}

interface FormModalProps<T extends Record<string, any>> {
    title: string;
    description?: string;
    trigger?: React.ReactNode;
    initialData: T;
    url: string;
    method?: Method;
    onSuccess?: () => void;
    onError?: (errors: any) => void;
    children: (form: ReturnType<typeof useForm<T>>) => React.ReactNode;
    submitLabel?: string | React.ReactNode; 
    submitVariant?: React.ComponentProps<typeof Button>['variant'];
    loadingLabel?: string;
    resetOnClose?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    bodyClassName?: string;
}

const validMethods: Method[] = ['post', 'patch', 'put', 'delete'];

function getFirstErrorMessage(errors: Record<string, unknown>): string | null {
    for (const value of Object.values(errors)) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value;
        }

        if (Array.isArray(value)) {
            const firstMessage = value.find(
                (item): item is string =>
                    typeof item === 'string' && item.trim().length > 0
            );

            if (firstMessage) {
                return firstMessage;
            }
        }
    }

    return null;
}

export default function FormModal<T extends Record<string, any>>({
    title,
    description,
    trigger,
    initialData,
    url,
    method = 'post',
    onSuccess,
    onError,
    children,
    submitLabel = 'Submit',
    submitVariant = 'default',
    loadingLabel = 'Saving... Please wait.',
    resetOnClose = true,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
    size = 'md',
    bodyClassName,
}: FormModalProps<T>) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isMounted = useRef(true);
    const isControlled = externalOpen !== undefined;
    const isOpen = isControlled ? externalOpen : internalOpen;

    const form = useForm<T>(initialData);
    const descriptionId = React.useId();

    useEffect(() => {
        isMounted.current = true;

        return () => {
 isMounted.current = false; 
};
    }, []);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open && form.processing) {
return;
}

        if (isControlled) {
            externalOnOpenChange?.(open);
        } else {
            setInternalOpen(open);
        }

        if (!open && resetOnClose) {
            form.reset();
        }
    }, [form.processing, isControlled, externalOnOpenChange, resetOnClose, form]);

    const showFlashToast = useCallback((flash?: FlashMessage) => {
        if (flash?.error) {
            toast.error(flash.error);

            return;
        }

        if (flash?.warning) {
            toast.warning(flash.warning);

            return;
        }

        if (flash?.success) {
            toast.success(flash.success);

            return;
        }

        if (flash?.info) {
            toast.info(flash.info);
        }
    }, []);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validMethods.includes(method)) {
            toast.error('Invalid submission method');

            return;
        }

        const submitMethod = form[method];

        if (!submitMethod || typeof submitMethod !== 'function') {
            toast.error('Form submission error');

            return;
        }

        submitMethod(url, {
            preserveScroll: true,
            onSuccess: (page: Page) => {
                const flash = (page.props as PageProps).flash;
                const shouldCloseModal = !flash?.error;

                // Flash toasts should still fire even if this modal unmounts during the Inertia refresh.
                showFlashToast(flash);

                if (!isMounted.current) {
return;
}

                if (shouldCloseModal) {
                    handleOpenChange(false);
                }

                onSuccess?.();
            },
            onError: (errors: any) => {
                if (errors && Object.keys(errors).length > 0) {
                    toast.error(getFirstErrorMessage(errors) ?? 'Please fix the errors.');
                   // toast.error('Please fix the errors. Check the form for details.');
                } else {
                    toast.error('Something went wrong.');
                }

                if (!isMounted.current) {
return;
}

                onError?.(errors);
            },
        });
    };

    const sizeClasses = {
        sm: 'sm:max-w-[425px]',
        md: 'sm:max-w-[500px]',
        lg: 'sm:max-w-[600px]',
        xl: 'sm:max-w-[800px]',
        full: 'sm:max-w-[95vw] h-[95vh]',
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

            <DialogContent
                className={sizeClasses[size]}
                aria-describedby={description ? descriptionId : undefined}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription id={descriptionId}>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className={bodyClassName}>
                        {children(form)}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={form.processing}
                        >
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                        </Button>

                        <Button type="submit" variant={submitVariant} disabled={form.processing}>
                            {form.processing ? (
                                <>
                                    <Loader className="animate-spin h-4 w-4 mr-1" />
                                    {loadingLabel}
                                </>
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
