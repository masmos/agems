import { Head, usePage } from '@inertiajs/react'

import type { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNowStrict } from 'date-fns'
import { TriangleAlert } from 'lucide-react'

import Heading from '@/components/heading'
import { DataTable } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import FormModal from '@/components/shared/FormModal'

import { FormInput } from '@/components/shared/form/FormInput'
import { FormSelect } from '@/components/shared/form/FormSelect'
import { FormCheckbox } from '@/components/shared/form/FormCheckbox'
import type { PaginatedResponse, Threshold } from '@/types'


type PageProps = {
    thresholds: PaginatedResponse<Threshold>
    filters?: {
        severity?: Threshold['severity'] | string
        source_type?: Threshold['source_type'] | string
        is_active?: boolean | string
    }
    stats?: {
        total?: number
        active?: number
        warning?: number
        critical?: number
    }
}

export default function ThresholdsIndex() {
    const { thresholds, stats } = usePage<PageProps>().props


    const hasThresholds = (thresholds?.data?.length ?? 0) > 0

    const columns: ColumnDef<Threshold, unknown>[] = [
        {
            accessorKey: 'parameter',
            header: 'Parameter',
            cell: ({ row }) => (
                <div className="font-medium">{row.original.parameter}</div>
            ),
        },
        {
            id: 'source',
            header: 'Source',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.source_type}</div>
                </div>
            ),
        },
        {
            accessorKey: 'severity',
            header: 'Severity',
            cell: ({ row }) => {
                const severity = row.original.severity
                const badgeClass =
                    severity === 'critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'

                return <Badge className={badgeClass}>{severity.toUpperCase()}</Badge>
            },
        },
        {
            id: 'limits',
            header: 'Limits',
            cell: ({ row }) => {
                const t = row.original

                return (
                    <div className="leading-tight">
                        <div className="font-medium">
                            Min: {t.min_value ?? '—'} / Max: {t.max_value ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {t.min_value !== null && t.max_value !== null
                                ? 'Range'
                                : t.min_value !== null
                                    ? 'Min only'
                                    : 'Max only'}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const active = row.original.is_active

                return active ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ACTIVE
                    </Badge>
                ) : (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        INACTIVE
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'updated_at',
            header: 'Updated',
            cell: ({ row }) => {
                const updatedAt = row.original.updated_at

                if (!updatedAt) return '—'


                return (
                    <div>
                        <div>
                            {formatDistanceToNowStrict(new Date(updatedAt), {
                                addSuffix: false,
                            })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(updatedAt).toLocaleString()}
                        </div>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
            <Head title="Thresholds" />
            <div className="flex items-center justify-between">
                <Heading title="Thresholds" description="Configure alert threshold rules." />
            </div>

            <div className="flex items-start justify-between gap-4">
                <div className="flex-1" />
                <FormModal
                    title="Add Threshold"
                    description="Create or update a threshold rule."
                    trigger={
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Threshold
                        </Button>
                    }
                    initialData={{
                        parameter: '',
                        source_type: 'monitoring_station',
                        severity: 'warning',
                        min_value: null,
                        max_value: null,
                        is_active: true,
                    }}
                    url="/thresholds"
                    method="post"
                    submitLabel="Save Threshold"
                    resetOnClose={true}
                >
                    {(form: any) => (

                        <div className="grid grid-cols-1 gap-4">
                            <FormInput
                                form={form}
                                name="parameter"
                                label="Parameter"
                                required
                                placeholder="e.g. aqi"
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormSelect
                                    form={form}
                                    name="source_type"
                                    label="Source Type"
                                    required
                                    options={[
                                        { label: 'Monitoring Station', value: 'monitoring_station' },
                                        { label: 'Flare Site', value: 'flare_site' },
                                    ]}
                                />

                                <FormSelect
                                    form={form}
                                    name="severity"
                                    label="Severity"
                                    required
                                    options={[
                                        { label: 'Warning', value: 'warning' },
                                        { label: 'Critical', value: 'critical' },
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormInput
                                    form={form}
                                    name="min_value"
                                    label="Min value"
                                    placeholder="Leave blank if not used"
                                    type="number"
                                    step={"any"}
                                />

                                <FormInput
                                    form={form}
                                    name="max_value"
                                    label="Max value"
                                    placeholder="Leave blank if not used"
                                    type="number"
                                    step={"any"}
                                />
                            </div>

                            <FormCheckbox
                                form={form}
                                name="is_active"
                                label="Active"
                            />
                        </div>
                    )}
                </FormModal>
            </div>

            {!hasThresholds ? (
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <EmptyState
                        icon={TriangleAlert}
                        title="No thresholds available"
                        description="Create threshold rules to enable alerting."
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={thresholds.data}
                    showFilter
                    filterableColumns={[
                        { id: 'parameter', label: 'Parameter' },
                        { id: 'severity', label: 'Severity' },
                        { id: 'source_type', label: 'Source Type' },
                        { id: 'is_active', label: 'Status' },
                    ]}
                    showSelectedRows={false}
                    actions={
                        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Active: {stats?.active ?? 0}</span>
                            <span>Critical: {stats?.critical ?? 0}</span>
                            <span>Warning: {stats?.warning ?? 0}</span>
                        </div>
                    }
                />
            )}

        </div>
    )
}

ThresholdsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Thresholds',
            href: '/thresholds',
        },
    ],
}

