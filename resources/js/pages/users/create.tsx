import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Role, Permission } from '@/types';
import { toast } from 'sonner';

interface UserCreateProps {
  roles: Role[];
  permissions: Permission[];
}

const UserCreate: React.FC<UserCreateProps> = ({ roles, permissions }) => {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [] as number[],
    permissions: [] as number[],
  });
  
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    post('/users', {
      onSuccess: () => {
        toast.success("User created successfully.");
        router.visit('/users');
      },
      onError: (errors) => {
        toast.error("Failed to create user.");
      }
    });
  };
  
  const toggleRole = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
    setData('roles', selectedRoles);
  };
  
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
    setData('permissions', selectedPermissions);
  };
  
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.name.split(' ').pop() || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  
  return (
    <>
      <Head title="Create User | AGEMS" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/users')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Heading 
              title="Create New User" 
              description="Add a new user to the system with appropriate roles and permissions." 
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>User account details and credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirm Password</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="Confirm password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Roles Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Assign roles to determine user permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                      {role.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedRoles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Selected roles:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoles.map(id => {
                      const role = roles.find(r => r.id === id);
                      return role ? (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Permissions Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Grant specific permissions to the user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="mb-3 font-medium capitalize">{category}</h4>
                    <div className="flex flex-wrap gap-4">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={`permission-${permission.id}`} className="cursor-pointer">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Submit */}
          <div className="flex gap-2">
            <Button type="submit" disabled={processing}>
              <Save className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit('/users')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

// Preserve layout configuration
(UserCreate as any).layout = {
  breadcrumbs: [
    {
      title: 'Users',
      href: '/users',
    },
    {
      title: 'Create',
      href: '#',
    },
  ],
};

export default UserCreate;