<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    /**
     * Helper: Detects the context (Central vs Tenant)
     */
    private function getContext(): array
    {
        $isTenant = function_exists('tenancy') && tenancy()->initialized;

        return [
            'guard' => $isTenant ? 'tenant' : 'web',
            'domain' => $isTenant ? tenant('id') . '.localhost' : 'Central (localhost)',
        ];
    }

    /**
     * 1. LIST (GET /api/permissions)
     */

public function index(Request $request)
{
    $context = $this->getContext();
    $search = $request->input('search', '');

    // ✅ Use Meilisearch
    $query = Permission::search($search)
        ->where('guard_name', $context['guard']);

    $query->orderBy('created_at', 'desc');

    $permissions = $query->paginate($request->input('pageSize', 10));

    return response()->json([
        'meta' => ['total' => $permissions->total()],
        'permissions' => $permissions
    ]);
}

    /**
     * 2. CREATE (POST /api/permissions)
     */
    public function store(Request $request)
    {
        $context = $this->getContext();
        $guard = $context['guard'];

        $request->validate([
            'name' => [
                'required',
                'string',
                // Unique per guard (e.g., 'edit invoice' can exist in both Central and Tenant)
                Rule::unique('permissions', 'name')->where('guard_name', $guard)
            ]
        ]);

        $permission = Permission::create([
            'name' => $request->name,
            'guard_name' => $guard
        ]);

        return response()->json([
            'message' => 'Permission created successfully',
            'permission' => $permission
        ], 201);
    }

    /**
     * 3. UPDATE (PUT /api/permissions/{id})
     */
    public function update(Request $request, string $id)
    {
        $context = $this->getContext();
        $guard = $context['guard'];

        $permission = Permission::where('id', $id)
                                ->where('guard_name', $guard)
                                ->firstOrFail();

        $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('permissions', 'name')->where('guard_name', $guard)->ignore($permission->id)
            ]
        ]);

        $permission->update(['name' => $request->name]);

        return response()->json([
            'message' => 'Permission updated successfully',
            'permission' => $permission
        ]);
    }

    /**
     * 4. DELETE (DELETE /api/permissions/{id})
     */
    public function destroy(string $id)
    {
        $context = $this->getContext();
        $guard = $context['guard'];

        $permission = Permission::where('id', $id)
                                ->where('guard_name', $guard)
                                ->firstOrFail();

        // Safety: Prevent deleting critical system permissions if you have a list
        // if (in_array($permission->name, ['manage tenants', 'login'])) {
        //    return response()->json(['error' => 'System permissions cannot be deleted.'], 403);
        // }

        $permission->delete();

        return response()->json(['message' => 'Permission deleted successfully']);
    }
}
