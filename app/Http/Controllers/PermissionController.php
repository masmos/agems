<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::orderBy('name')
            ->paginate(20);
        
        return Inertia::render('users/permissions/index', [
            'permissions' => $permissions,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'guard_name' => 'sometimes|string|max:255',
        ]);
        
        Permission::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);
        
        return back()->with('success', 'Permission created successfully.');
    }
    
    public function destroy(Permission $permission)
    {
        $permission->delete();
        
        return back()->with('success', 'Permission deleted successfully.');
    }
}