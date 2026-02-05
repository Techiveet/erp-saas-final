<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cache; // ✅ Import Cache

class RoleController extends Controller
{
    private function getContext(): array
    {
        $isTenant = function_exists('tenancy') && tenancy()->initialized;

        return [
            'guard' => $isTenant ? 'tenant' : 'web',
            'domain' => $isTenant ? tenant('id') . '.localhost' : 'Central (localhost)',
            'is_tenant' => $isTenant
        ];
    }

    /**
     * 1. GET /api/roles (Meilisearch)
     */
    public function index(Request $request)
    {
        $context = $this->getContext();
        $search = $request->input('search', '');

        // Meilisearch
        $query = Role::search($search)
            ->where('guard_name', $context['guard']);

        $query->orderBy('created_at', 'desc');

        $roles = $query->paginate($request->input('pageSize', 10));

        return response()->json([
            'meta' => [
                'context' => $context['domain'],
                'total' => $roles->total()
            ],
            'roles' => $roles->load('permissions')
        ]);
    }

    /**
     * 2. GET /api/permissions (Redis Cached)
     * Permissions lists rarely change, so we cache them for 24 hours.
     */
    public function permissions()
    {
        $context = $this->getContext();
        $cacheKey = "permissions_list_" . $context['guard'];

        // ✅ REDIS: Cache permissions list
        $permissions = Cache::remember($cacheKey, 60 * 60 * 24, function () use ($context) {
            return Permission::where('guard_name', $context['guard'])->get();
        });

        return response()->json([
            'meta' => [
                'context' => $context['domain'],
                'guard' => $context['guard'],
            ],
            'permissions' => $permissions
        ]);
    }

    /**
     * 3. POST /api/roles
     */
    public function store(Request $request)
    {
        $context = $this->getContext();
        $guard = $context['guard'];

        $request->validate([
            'name' => ['required', 'string', Rule::unique('roles', 'name')->where('guard_name', $guard)],
            'permissions' => ['array'],
            'permissions.*' => [Rule::exists('permissions', 'name')->where('guard_name', $guard)],
        ]);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => $guard
        ]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'meta' => ['message' => "Role created for {$guard} guard"],
            'role' => $role->load('permissions')
        ], 201);
    }

    /**
     * 4. PUT /api/roles/{id}
     */
    public function update(Request $request, string $id)
    {
        $context = $this->getContext();
        $guard = $context['guard'];

        $role = Role::where('id', $id)->where('guard_name', $guard)->firstOrFail();

        $request->validate([
            'name' => ['required', 'string', Rule::unique('roles', 'name')->where('guard_name', $guard)->ignore($role->id)],
            'permissions' => ['array'],
            'permissions.*' => [Rule::exists('permissions', 'name')->where('guard_name', $guard)],
        ]);

        if (in_array($role->name, ['Admin', 'Super Admin']) && $request->name !== $role->name) {
            return response()->json(['error' => 'You cannot rename this protected role.'], 403);
        }

        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role->load('permissions')
        ]);
    }

    /**
     * 5. DELETE /api/roles/{id}
     */
    public function destroy(string $id)
    {
        $context = $this->getContext();
        $guard = $context['guard'];

        $role = Role::where('id', $id)->where('guard_name', $guard)->firstOrFail();

        if (in_array($role->name, ['Admin', 'Super Admin'])) {
            return response()->json(['error' => 'You cannot delete the main Admin role.'], 403);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }
}
