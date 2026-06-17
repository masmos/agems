import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Save,
    Mail,
    Shield,
    Key,
    Check,
    X,
    Users,
    Lock,
    Unlock,
    User2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import type { User, Role, Permission } from '@/types';
import { toast } from 'sonner';

interface UserEditProps {
    user: User & {
        roles: Role[];
        permissions: Permission[];
    };
    roles: Role[];
    permissions: Record<string, Permission[]>;
    userRoleIds: number[];
    userPermissionIds: number[];
}

const UserEdit: React.FC<UserEditProps> = ({
    user,
    roles,
    permissions,
    userRoleIds,
    userPermissionIds
}) => {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: userRoleIds,
        permissions: userPermissionIds,
    });

    const [selectedRoles, setSelectedRoles] = useState<number[]>(userRoleIds);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(userPermissionIds);
    const [showPasswordField, setShowPasswordField] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setData('roles', selectedRoles);
        setData('permissions', selectedPermissions);

        put(`/users/${user.id}`, {
            onSuccess: () => {
                toast.success("User updated successfully.");

                router.visit(`/users/${user.id}`);
            },
            onError: (errors) => {
                toast.error("Failed to update user.");
            }
        });
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoles(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const toggleAllRoles = () => {
        if (selectedRoles.length === roles.length) {
            setSelectedRoles([]);
        } else {
            setSelectedRoles(roles.map(r => r.id));
        }
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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

    // Check if user is trying to remove their own admin role
    const isSelf = user.id === (window as any).Laravel?.userId;
    const isRemovingOwnAdmin = isSelf && selectedRoles.filter(id => {
        const role = roles.find(r => r.id === id);
        return role?.name === 'Administrator' || role?.name === 'Super Admin';
    }).length === 0 && userRoleIds.some(id => {
        const role = roles.find(r => r.id === id);
        return role?.name === 'Administrator' || role?.name === 'Super Admin';
    });

    return (
        <>
            <Head title={`Edit ${user.name} | User Management`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/users/${user.id}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <Heading
                                title={`Edit: ${user.name}`}
                                description={`Update user information and permissions.`}
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Update user account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            className="pl-9"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="pl-9"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Password Change */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Change Password</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Leave empty to keep current password
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="show-password" className="text-sm">
                                            {showPasswordField ? 'Hide' : 'Show'} password fields
                                        </Label>
                                        <Switch
                                            id="show-password"
                                            checked={showPasswordField}
                                            onCheckedChange={setShowPasswordField}
                                        />
                                    </div>
                                </div>

                                {showPasswordField && (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">New Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Min 8 characters"
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
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Assignment */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Role Assignment
                                    </CardTitle>
                                    <CardDescription>
                                        Assign roles to determine user permissions
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleAllRoles}
                                    >
                                        {selectedRoles.length === roles.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isRemovingOwnAdmin && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                                    <Lock className="h-4 w-4 inline mr-2" />
                                    Warning: You are removing your own Administrator role. This may lock you out of certain features.
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {roles.map((role) => {
                                    const isSelected = selectedRoles.includes(role.id);
                                    const isSystemRole = ['Administrator', 'Super Admin'].includes(role.name);

                                    return (
                                        <div
                                            key={role.id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
                                                }`}
                                        >
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleRole(role.id)}
                                            />
                                            <Label
                                                htmlFor={`role-${role.id}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getRoleBadgeColor(role.name)}>
                                                        {role.name}
                                                    </Badge>
                                                    {isSystemRole && (
                                                        <Badge variant="outline" className="text-xs">
                                                            System
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Selected Roles Summary */}
                            {selectedRoles.length > 0 && (
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">Assigned Roles:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoles.map(id => {
                                            const role = roles.find(r => r.id === id);
                                            return role ? (
                                                <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Permissions
                                    </CardTitle>
                                    <CardDescription>
                                        Grant specific permissions to the user (overrides role permissions)
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary">
                                    {selectedPermissions.length} permissions selected
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
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

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>Review the changes before saving</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Roles</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoles.length > 0 ? (
                                            selectedRoles.map(id => {
                                                const role = roles.find(r => r.id === id);
                                                return role ? (
                                                    <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                                                        {role.name}
                                                    </Badge>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No roles assigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Permissions</span>
                                    <span className="text-sm">{selectedPermissions.length} selected</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <Badge className={user.email_verified_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {user.email_verified_at ? 'Active' : 'Pending'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            Update User
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/users/${user.id}`)}
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
(UserEdit as any).layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: '/users',
        },
        {
            title: 'Edit',
            href: '#',
        },
    ],
};

export default UserEdit;