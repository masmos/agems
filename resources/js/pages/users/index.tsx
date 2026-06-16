import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Calendar,
  Shield,
  Activity
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
import { Checkbox } from '@/components/ui/checkbox';
import type { User, Role } from '@/types';
import { toast } from 'sonner';

interface UsersIndexProps {
  users: {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
  };
  stats: {
    total_users: number;
    active_users: number;
    new_users_this_month: number;
    roles_count: number;
  };
  roles: Role[];
  filters: {
    search: string;
  };
}

const UsersIndex: React.FC<UsersIndexProps> = ({ users, stats, roles, filters }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.visit('/users?search=' + encodeURIComponent(searchTerm));
  };
  
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.data.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.data.map(u => u.id));
    }
  };
  
  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(uid => uid !== id)
        : [...prev, id]
    );
  };
  
  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
        toast.error("Please select at least one user.");
      return;
    }
    
    router.post('/users/bulk', {
      user_ids: selectedUsers,
      action: action,
    }, {
      onSuccess: () => {
        setSelectedUsers([]);

        toast.success(`Users ${action}ed successfully.`);
      },
      onError: () => {

        toast.error(`Failed to ${action} users.`);
      }
    });
  };
  
  const handleDelete = (id: number) => {
    router.delete(`/users/${id}`, {
      onSuccess: () => {
        toast.success("User deleted successfully.");
      },
      onError: () => {
        toast.error("Failed to delete user.");
      }
    });
  };
  
  const getRoleBadges = (userRoles: any[]) => {
    return userRoles.map(role => (
      <Badge key={role.id} variant="secondary" className="mr-1">
        {role.name}
      </Badge>
    ));
  };
  
  const getStatusBadge = (user: User) => {
    if (user.email_verified_at) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };
  
  return (
    <>
      <Head title="User Management | AGEMS" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading 
            title="User Management" 
            description="Manage system users, roles, and permissions." 
          />
          <Button asChild>
            <Link href="/users/create">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.roles_count} roles available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_users}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.active_users / stats.total_users) * 100).toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new_users_this_month}</div>
              <p className="text-xs text-muted-foreground">New user registrations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roles_count}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/roles" className="text-primary hover:underline">
                  Manage roles →
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Bulk Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedUsers.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      selected users from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkAction('delete')}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        
        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === users.data.length && users.data.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/users/${user.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {user.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(user.roles)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
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
                            <Link href={`/users/${user.id}`}>View Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}/edit`}>Edit User</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Pagination */}
{/*         {users.total > users.per_page && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {users.from} to {users.to} of {users.total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(users.prev_page_url)}
                disabled={!users.prev_page_url}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(users.next_page_url)}
                disabled={!users.next_page_url}
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
(UsersIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Users',
      href: '/users',
    },
  ],
};

export default UsersIndex;