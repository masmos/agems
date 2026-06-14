'use client';

import {
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FormField } from './FormField';

interface FileWithProgress {
    file: File;
    progress: number;
    uploaded: boolean;
}

interface Props {
    form: any;
    name: string;
    label?: string;
    required?: boolean;
    accept?: string;
    multiple?: boolean;
}

export function FormFileInput({
    form,
    name,
    label,
    required,
    accept,
    multiple = false,
}: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const uploadIntervals = useRef<
        Map<string, ReturnType<typeof setInterval>>
    >(new Map());

    const [files, setFiles] = useState<FileWithProgress[]>([]);
    const [dragging, setDragging] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    const updateFormData = (
        updatedFiles: FileWithProgress[]
    ) => {
        setFiles(updatedFiles);

        if (multiple) {
            form.setData(
                name,
                updatedFiles.map((item) => item.file)
            );
        } else {
            form.setData(name, updatedFiles[0]?.file ?? null);
        }
    };

    const simulateUploadProgress = (
        selectedFiles: File[],
        replace = false
    ) => {
        const existingNames = new Set(
            files.map(
                (f) => `${f.file.name}-${f.file.size}`
            )
        );

        const uniqueFiles = selectedFiles.filter(
            (file) =>
                !existingNames.has(
                    `${file.name}-${file.size}`
                )
        );

        if (!uniqueFiles.length) {
return;
}

        const mappedFiles: FileWithProgress[] =
            uniqueFiles.map((file) => ({
                file,
                progress: 0,
                uploaded: false,
            }));

        const updatedFiles = replace
            ? mappedFiles
            : [...files, ...mappedFiles];

        updateFormData(updatedFiles);

        mappedFiles.forEach((item) => {
            const key = `${item.file.name}-${item.file.size}`;

            const interval = setInterval(() => {
                setFiles((prev) =>
                    prev.map((f) => {
                        if (f.file !== item.file) {
                            return f;
                        }

                        const nextProgress = Math.min(
                            f.progress + 10,
                            100
                        );

                        if (nextProgress >= 100) {
                            clearInterval(interval);

                            uploadIntervals.current.delete(
                                key
                            );

                            return {
                                ...f,
                                progress: 100,
                                uploaded: true,
                            };
                        }

                        return {
                            ...f,
                            progress: nextProgress,
                        };
                    })
                );
            }, 200);

            uploadIntervals.current.set(key, interval);
        });

        // Allow re-selecting same file
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleFiles = (
        fileList: FileList | null
    ) => {
        if (!fileList) {
return;
}

        const selectedFiles = Array.from(fileList);

        if (!multiple) {
            if (selectedFiles.length > 1) {
                setWarning(
                    'Only one file is allowed. The first file was selected.'
                );
            } else {
                setWarning(null);
            }

            simulateUploadProgress(
                [selectedFiles[0]],
                true
            );
        } else {
            setWarning(null);

            simulateUploadProgress(
                selectedFiles,
                false
            );
        }
    };

    const removeFile = (index: number) => {
        const fileToRemove = files[index];

        if (fileToRemove) {
            const key = `${fileToRemove.file.name}-${fileToRemove.file.size}`;

            const interval =
                uploadIntervals.current.get(key);

            if (interval) {
                clearInterval(interval);

                uploadIntervals.current.delete(key);
            }
        }

        setWarning(null);

        updateFormData(
            files.filter((_, i) => i !== index)
        );
    };

    return (
        <FormField
            name={name}
            label={label}
            required={required}
            error={form.errors[name]}
        >
            <div className="space-y-3">
                {/* Drop Zone */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);

                        handleFiles(
                            e.dataTransfer.files
                        );
                    }}
                    onClick={() =>
                        inputRef.current?.click()
                    }
                    className={`
                        group flex cursor-pointer flex-col items-center justify-center gap-1
                        rounded-xl border-2 border-dashed p-8 text-center
                        transition-all duration-200
                        ${dragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40'
                        }
                    `}
                >
                    <div
                        className={`
                            mb-1 rounded-full p-3 transition-colors duration-200
                            ${dragging
                                ? 'bg-primary/10'
                                : 'bg-muted group-hover:bg-primary/10'
                            }
                        `}
                    >
                        <Upload
                            className={`
                                h-5 w-5 transition-colors duration-200
                                ${dragging
                                    ? 'text-primary'
                                    : 'text-muted-foreground group-hover:text-primary'
                                }
                            `}
                        />
                    </div>

                    <p className="text-sm font-medium">
                        {dragging
                            ? multiple
                                ? 'Drop files to upload'
                                : 'Drop file to replace'
                            : multiple
                                ? 'Drag & drop files here'
                                : 'Drag & drop a file here'}
                    </p>

                    <p className="text-xs text-muted-foreground">
                        or{' '}
                        <span className="font-medium text-primary">
                            browse{' '}
                            {multiple
                                ? 'files'
                                : 'file'}
                        </span>

                        {accept && ` · ${accept}`}
                    </p>

                    <Input
                        ref={inputRef}
                        id={name}
                        name={name}
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        required={required}
                        className="hidden"
                        onChange={(e) =>
                            handleFiles(
                                e.currentTarget.files
                            )
                        }
                    />
                </div>

                {/* Warning */}
                {warning && (
                    <div
                        className="
                            flex items-center gap-2 rounded-lg
                            border border-amber-200
                            bg-amber-50 px-3 py-2
                            text-xs text-amber-700
                            dark:border-amber-800
                            dark:bg-amber-950/40
                            dark:text-amber-400
                        "
                    >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />

                        {warning}
                    </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((item, index) => (
                            <div
                                key={`${item.file.name}-${index}`}
                                className="
                                    flex items-start gap-3
                                    rounded-lg border
                                    bg-muted/30 p-3
                                "
                            >
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-medium leading-none">
                                            {
                                                item.file
                                                    .name
                                            }
                                        </p>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="
                                                h-6 w-6 shrink-0
                                                text-muted-foreground
                                                hover:text-destructive
                                            "
                                            onClick={() =>
                                                removeFile(
                                                    index
                                                )
                                            }
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {(
                                            item.file
                                                .size /
                                            1024 /
                                            1024
                                        ).toFixed(2)}{' '}
                                        MB
                                        {!multiple &&
                                            ' · Drop a new file to replace'}
                                    </p>

                                    <div className="space-y-1 pt-0.5 transition-all duration-300">
                                        {!item.uploaded ? (
                                            <>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        Uploading…
                                                    </span>

                                                    <span>
                                                        { item.progress } %
                                                    </span>
                                                </div>

                                                <Progress
                                                    value={
                                                        item.progress
                                                    }
                                                    className="h-1.5"
                                                />
                                            </>
                                        ) : (
                                            <div
                                                className="
                                                    flex items-center gap-1.5
                                                    text-xs font-medium
                                                    text-emerald-600
                                                    dark:text-emerald-400
                                                "
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Upload complete
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FormField>
    );
}