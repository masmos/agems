import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { 
  Shield, 
  Plus, 
  Search, 
  MoreVertical,
  Trash2,
  Users,
  Key,
  Pencil,
  Copy,
  CheckCircle,
  UserCog
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Role, Permission } from '@/types';
import { toast } from 'sonner';

interface RolesIndexProps {
  roles: {
    data: (Role & { 
      permissions: Permission[]; 
      users_count?: number;
    })[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
  };
  permissions: Record<string, Permission[]>;
}

const RolesIndex: React.FC<RolesIndexProps> = ({ roles, permissions }) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  
  const filteredRoles = roles.data.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.visit('/roles?search=' + encodeURIComponent(searchTerm));
  };
  
  const handleDeleteClick = (id: number, name: string) => {
    setSelectedRoleId(id);
    setSelectedRoleName(name);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (!selectedRoleId) return;
    
    router.delete(`/roles/${selectedRoleId}`, {
      onSuccess: () => {
        toast.success(`Role "${selectedRoleName}" deleted successfully.`);

        setDeleteDialogOpen(false);
        setSelectedRoleId(null);
        setSelectedRoleName('');
      },
      onError: (errors) => {

        toast.error(errors.message || "Failed to delete role.")
      }
    });
  };
  
  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'Administrator': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'Super Admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'Environmental Officer': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Compliance Officer': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Inspector': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };
  
  const getPermissionCount = (role: Role & { permissions: Permission[] }) => {
    return role.permissions?.length || 0;
  };
  
  // System roles that cannot be deleted
  const systemRoles = ['Administrator', 'Super Admin'];
  
  return (
    <>
      <Head title="Role Management | AGEMS" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading 
            title="Role Management" 
            description="Manage system roles and their permissions. Users are assigned roles via the model_has_roles table." 
          />
          <Button asChild>
            <Link href="/roles/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Link>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.total}</div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(permissions).length} permission categories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(permissions).reduce((acc, perms) => acc + perms.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available permissions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roles.data.reduce((acc, role) => acc + (role.users_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with roles via model_has_roles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemRoles.length}</div>
              <p className="text-xs text-muted-foreground">
                Protected system roles
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {/* Roles Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead className="text-center">Permissions</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => {
                  const isSystemRole = systemRoles.includes(role.name);
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${getRoleBadgeColor(role.name)}`} />
                          <Badge className={getRoleBadgeColor(role.name)}>
                            {role.name}
                          </Badge>
                          {isSystemRole && (
                            <Badge variant="outline" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {role.guard_name || 'web'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {getPermissionCount(role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {role.users_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/roles/${role.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Role
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/roles/${role.id}/duplicate`}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(role.id, role.name)}
                              disabled={isSystemRole}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                            {isSystemRole && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <Shield className="h-4 w-4 mr-2" />
                                System role protected
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role <strong>"{selectedRoleName}"</strong>?
                <br /><br />
                This action cannot be undone. This will permanently delete the role
                and remove all associated permissions from the <code>role_has_permissions</code> table.
                <br /><br />
                <span className="text-yellow-600 dark:text-yellow-400">
                  Note: Users assigned this role via <code>model_has_roles</code> will lose these permissions.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete Role
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Pagination */}
      {/*   {roles.total > roles.per_page && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {roles.from} to {roles.to} of {roles.total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(roles.prev_page_url)}
                disabled={!roles.prev_page_url}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(roles.next_page_url)}
                disabled={!roles.next_page_url}
              >
                Next
              </Button>
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

// Preserve layout configuration
(RolesIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Roles',
      href: '/roles',
    },
  ],
};

export default RolesIndex;