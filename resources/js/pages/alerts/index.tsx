import { Head, Link, usePage } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNowStrict } from 'date-fns'
import { TriangleAlert } from 'lucide-react'

import Heading from '@/components/heading'
import { DataTable } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/layouts/app-layout'
import type { Alert, PaginatedResponse } from '@/types'

type Filters = {
    severity?: 'info' | 'warning' | 'critical' | string
    acknowledged?: boolean | string
    source_type?: string
}

export default function Alerts() {
    const { alerts, stats, filters } = usePage<{
        alerts: PaginatedResponse<Alert>
        stats: {
            total: number
            unacknowledged: number
            critical: number
            warning: number
        }
        filters: Filters
    }>().props

    const hasAlerts = (alerts?.data?.length ?? 0) > 0

    const columns: ColumnDef<Alert, unknown>[] = [
        {
            accessorKey: 'severity',
            header: 'Severity',
            cell: ({ row }) => {
                const severity = row.original.severity
                const badgeClass =
                    severity === 'critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'

                return (
                    <Badge className={badgeClass}>
                        {severity.toUpperCase()}
                    </Badge>
                )
            },
        },
        {
            id: 'source',
            header: 'Source',
            cell: ({ row }) => {
                const a = row.original
                const stationName =
                    (a.source_type === 'monitoring_station' ? (a.source as any)?.station_name : null) ?? null

                const flareSiteName =
                    (a.source_type === 'flare_site' ? (a.source as any)?.site_name : null) ?? null

                const sourceName = stationName ?? flareSiteName ?? `${a.source_type} #${a.source_id}`

                return <span className="font-medium">{sourceName}</span>
            },
        },
        {
            id: 'threshold',
            header: 'Threshold',
            cell: ({ row }) => {
                const t = row.original.threshold

                if (!t) {
return <span className="text-muted-foreground">—</span>
}

                return (
                    <div className="leading-tight">
                        <div className="font-medium">{t.parameter}</div>
                        <div className="text-xs text-muted-foreground">
                            {t.source_type} • min {t.min_value ?? '—'} / max {t.max_value ?? '—'}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'acknowledged',
            header: 'Acknowledged',
            cell: ({ row }) => {
                const acknowledged = row.original.acknowledged

                return acknowledged ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        YES
                    </Badge>
                ) : (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        NO
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Time',
            cell: ({ row }) => {
                const createdAt = row.original.created_at

                if (!createdAt) {
return '—'
}

                return (
                    <div>
                        <div>{formatDistanceToNowStrict(new Date(createdAt), { addSuffix: false })}</div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(createdAt).toLocaleString()}
                        </div>
                    </div>
                )
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const alertId = row.original.id

                return (
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/alerts/${alertId}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            View
                        </Link>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
            <Head title="Alerts" />
            <div className="flex items-center justify-between">
                <Heading
                    title="Alerts"
                    description="Manage your alerts and notifications."
                />
            </div>

            {!hasAlerts ? (
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <EmptyState
                        icon={TriangleAlert}
                        title="No alerts available"
                        description="You can start adding alerts under this section"
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={alerts.data}
                    showFilter
                    filterableColumns={[
                        { id: 'severity', label: 'Severity' },
                        { id: 'acknowledged', label: 'Acknowledged' },
                        { id: 'source_type', label: 'Source Type' },
                    ]}
                    showSelectedRows={false}
                    actions={
                        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Unacknowledged: {stats?.unacknowledged ?? 0}</span>
                            <span>Critical: {stats?.critical ?? 0}</span>
                            <span>Warning: {stats?.warning ?? 0}</span>
                        </div>
                    }
                />
            )}
        </div>
    )
}

Alerts.layout = {
    breadcrumbs: [
        {
            title: 'Alerts',
            href: '/alerts',
        },
    ],
}

