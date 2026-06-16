import { Link } from '@inertiajs/react';
import { AlertCircle, BookOpen, Clock, FileWarning, Flame, FolderGit2, Gauge, LayoutGrid, LocateIcon, MapPin, Shield, TriangleAlert, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Alerts',
        icon: TriangleAlert,
        href: '/alerts'
    },
    {
        title: 'Stations',
        icon: MapPin,
        href: '/stations'
    },
    {
        title: 'Thresholds',
        icon: Gauge,
        href: '/thresholds'
    },
    {   title: 'Flare Sites', 
        icon: Flame,
        href: '/flare-sites', 
    },
    {
        title: 'Telemetry Readings',
        icon: Clock,
        href: '/telemetry'
    },
    {
        title: 'Pipeline Projects',
        icon: FileWarning,
        href: '/project/pipeline'
    },
    {
        title: 'Roles & Permissions',
        icon: Shield,
        href: '/roles'
    },
    {
        title: 'User Management',
        href: '/users',
        icon: Users,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
