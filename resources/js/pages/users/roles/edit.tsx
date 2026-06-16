import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Role, Permission } from '@/types';
import { toast } from 'sonner';

interface RoleEditProps {
  role: Role & { permissions: Permission[] };
  permissions: Record<string, Permission[]>;
  rolePermissionIds: number[];
}

const RoleEdit: React.FC<RoleEditProps> = ({ role, permissions, rolePermissionIds }) => {
  
  const { data, setData, put, processing, errors } = useForm({
    name: role.name,
    permissions: rolePermissionIds,
  });
  
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(rolePermissionIds);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setData('permissions', selectedPermissions);
    
    put(`/roles/${role.id}`, {
      onSuccess: () => {
        toast.success("Role updated successfully");
       
        router.visit('/roles');
      },
      onError: (errors) => {
        toast.error("Failed to update role");
      }
    });
  };
  
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };
  
  const toggleAllPermissions = (category: string) => {
    const categoryPermissions = permissions[category] || [];
    const categoryIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...prev, ...categoryIds.filter(id => !prev.includes(id))]);
    }
  };
  
  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = permissions[category] || [];
    if (categoryPermissions.length === 0) return false;
    return categoryPermissions.every(p => selectedPermissions.includes(p.id));
  };
  
  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = permissions[category] || [];
    if (categoryPermissions.length === 0) return false;
    const selected = categoryPermissions.filter(p => selectedPermissions.includes(p.id));
    return selected.length > 0 && selected.length < categoryPermissions.length;
  };
  
  return (
    <>
      <Head title={`Edit ${role.name} | AGEMS`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/roles')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Heading 
              title={`Edit Role: ${role.name}`} 
              description="Update role name and permissions." 
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>Update the role name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Data Analyst"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Permissions Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Update the permissions for this role.
                <span className="block mt-1 text-sm text-muted-foreground">
                  {selectedPermissions.length} permissions selected
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(permissions).map(([category, perms]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h4 className="text-sm font-medium capitalize">{category}</h4>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={isCategoryFullySelected(category)}
                          data-state={
                            isCategoryFullySelected(category) 
                              ? 'checked' 
                              : isCategoryPartiallySelected(category) 
                              ? 'indeterminate' 
                              : 'unchecked'
                          }
                          onCheckedChange={() => toggleAllPermissions(category)}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm text-muted-foreground">
                          Select All
                        </Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={`permission-${permission.id}`} className="cursor-pointer text-sm">
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
          
          {/* Selected Permissions Summary */}
          {selectedPermissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Permissions</CardTitle>
                <CardDescription>
                  {selectedPermissions.length} permissions are assigned to this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedPermissions.map(id => {
                    const permission = Object.values(permissions)
                      .flat()
                      .find(p => p.id === id);
                    return permission ? (
                      <Badge key={permission.id} variant="secondary">
                        {permission.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Submit */}
          <div className="flex gap-2">
            <Button type="submit" disabled={processing}>
              <Save className="h-4 w-4 mr-2" />
              Update Role
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit('/roles')}
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
(RoleEdit as any).layout = {
  breadcrumbs: [
    {
      title: 'Roles',
      href: '/roles',
    },
    {
      title: 'Edit',
      href: '#',
    },
  ],
};

export default RoleEdit;