import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import Heading from '@/components/heading';
import { Building2, TriangleAlert } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function Alerts() {
    //const { alerts } = usePage<{ alerts: Alert[] }>().props;
  //  const hasAlerts = alerts && alerts.length > 0;
  const hasAlerts = false;

    return (
  
  
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <Heading title="Alerts" description="Manage your alerts and notifications." />
                </div>

                {!hasAlerts ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <EmptyState
                            icon={TriangleAlert}
                            title="No alerts available"
                            description="You can start adding alerts under this section"
                           // buttonComponent={<CreateNewAlert />}
                        />
                    </div>
                ) : (
                    <div>
                        {/* <AlertList /> */}
                    </div>
                )}
            </div>

    );
}

Alerts.layout = {
    breadcrumbs: [
        {
            title: 'Alerts',
            href: '/alerts',
        },
    ],
};