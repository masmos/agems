<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $roles = Role::with('permissions')
            ->withCount('users') // Count users from model_has_roles table
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(15);
        
        // Get all permissions grouped by category
        $permissions = Permission::all()->groupBy(function($permission) {
            // Group by the first word (e.g., "view_users" -> "view")
            $parts = explode('_', $permission->name);
            return $parts[0] ?? 'other';
        });
        
        return Inertia::render('users/roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }
    
    public function create()
    {
        $permissions = Permission::all()->groupBy(function($permission) {
            $parts = explode('_', $permission->name);
            return $parts[0] ?? 'other';
        });
        
        return Inertia::render('users/roles/create', [
            'permissions' => $permissions,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        
        $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);
        
        if (!empty($validated['permissions'])) {
            $permissionNames = Permission::whereIn('id', $validated['permissions'])->pluck('name')->toArray();
            // Sync permissions to role_has_permissions table
            $role->syncPermissions($permissionNames);
        }
        
        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully.');
    }
    
    public function edit(Role $role)
    {
        $role->load('permissions');
        $permissions = Permission::all()->groupBy(function($permission) {
            $parts = explode('_', $permission->name);
            return $parts[0] ?? 'other';
        });
        
        return Inertia::render('users/roles/edit', [
            'role' => $role,
            'permissions' => $permissions,
            'rolePermissionIds' => $role->permissions->pluck('id')->toArray(),
        ]);
    }
    
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        
        $role->update(['name' => $validated['name']]);
        
        if (isset($validated['permissions'])) {
            $permissionNames = Permission::whereIn('id', $validated['permissions'])->pluck('name')->toArray();
            // Sync permissions to role_has_permissions table
            $role->syncPermissions($permissionNames);
        }
        
        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }
    
    public function destroy(Role $role)
    {
        // Prevent deleting system roles
        if (in_array($role->name, ['Administrator', 'Super Admin'])) {
            return back()->with('error', 'Cannot delete system role.');
        }
        
        // This will automatically clean up model_has_roles and role_has_permissions
        // thanks to Spatie's cascade delete
        $role->delete();
        
        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}