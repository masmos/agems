import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Shield,
  Activity,
  User as UserIcon,
  Pencil,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

import type { User, Role } from '@/types';
import { toast } from 'sonner';

interface UserShowProps {
  user: User & {
    roles: Role[];
    permissions: any[];
    activity?: any[];
  };
}

const UserShow: React.FC<UserShowProps> = ({ user }) => {
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getStatus = (user: User) => {
    if (user.email_verified_at) {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
  };
  
  const handleDelete = () => {
    router.delete(`/users/${user.id}`, {
      onSuccess: () => {
        toast.success("User deleted successfully.");
        router.visit('/users');
      },
      onError: () => {
        toast.error("Failed to delete user.");
      }
    });
  };
  
  const status = getStatus(user);
  
  return (
    <>
      <Head title={`${user.name} | User Profile`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/users')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Heading 
                  title={user.name} 
                  description={user.email}
                />
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={status.color}>{status.label}</Badge>
                  {user.roles.map(role => (
                    <Badge key={role.id} variant="secondary">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/users/${user.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the user account and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* User Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>User account details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Full Name</p>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Roles</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent user activity and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Login</span>
                  <span className="text-sm font-medium">
                    {user.last_login_at || 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Actions</span>
                  <span className="text-sm font-medium">
                    {user.activity?.length || 0}
                  </span>
                </div>
              </div>
              
              {user.activity && user.activity.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {user.activity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="text-sm">
                        <span className="text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                        <span className="ml-2">{activity.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Permissions List */}
        {user.permissions && user.permissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Specific permissions granted to this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission: any) => (
                  <Badge key={permission.id} variant="outline">
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

// Preserve layout configuration
(UserShow as any).layout = {
  breadcrumbs: [
    {
      title: 'Users',
      href: '/users',
    },
    {
      title: 'Profile',
      href: '#',
    },
  ],
};

export default UserShow;