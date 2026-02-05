<?php

namespace App\Http\Controllers\Api\Export;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
// ✅ Use Custom Role Model
use App\Models\Role;
use App\Exports\RolesExport;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class RoleExportController extends Controller
{
    public function getFilteredQuery(Request $request)
    {
        $searchTerm = $request->input('search', '');
        $query = Role::search($searchTerm);

        // Filters (Meilisearch syntax)
        if ($request->filled('scope') && $request->scope !== 'all') {
            $guard = $request->scope === 'TENANT' ? 'tenant' : 'web';
            $query->where('guard_name', $guard);
        }

        if ($request->filled('ids')) {
            $ids = explode(',', $request->ids);
            // Ensure IDs are integers for Meilisearch
            $ids = array_map('intval', $ids);
            $query->whereIn('id', $ids);
        }

        if ($request->filled('date_from')) {
             $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
             $query->where('created_at', '<=', $request->date_to);
        }

        // Sorting
        if ($request->filled('sortCol') && $request->filled('sortDir')) {
            $query->orderBy($request->sortCol, $request->sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query;
    }

    public function handleExport(Request $request)
    {
        $type = $request->query('type');
        abort_unless(in_array($type, ['csv', 'excel', 'xlsx', 'pdf', 'print', 'copy']), 400);

        $filename = 'roles_report_' . now()->format('Y-m-d_His');

        // 1. Get IDs from Meilisearch
        $scoutResults = $this->getFilteredQuery($request);
        $ids = $scoutResults->keys(); // This returns a Collection of IDs

        if ($ids->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // 2. Fetch Models from Database
        // We fetch them unordered first
        $rolesCollection = Role::whereIn('id', $ids->toArray())
            ->with('permissions')
            ->get();

        // 3. Re-sort in PHP to match Meilisearch order (Database Agnostic)
        // This replaces "ORDER BY FIELD(...)" which breaks in Postgres
        $roles = $ids->map(function ($id) use ($rolesCollection) {
            return $rolesCollection->firstWhere('id', $id);
        })->filter(); // Remove nulls just in case

        // ---------------------------------------------------------
        // 1. Excel / CSV (Requires Query Builder or Collection)
        // ---------------------------------------------------------
        if (in_array($type, ['csv', 'excel', 'xlsx'])) {
            $extension = $type === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;
            // Pass the sorted Collection, not the Query Builder
            return Excel::download(new RolesExport($roles), $filename . '.' . $extension);
        }

        // ---------------------------------------------------------
        // 2. PDF
        // ---------------------------------------------------------
        if ($type === 'pdf') {
            $data = $roles->map(function($role) {
                return [
                    'name'        => $role->name,
                    'permissions' => $role->permissions->pluck('name')->implode(', '),
                    'created_at'  => $role->created_at->format('Y-m-d'),
                ];
            });

            $pdf = Pdf::loadView('exports.roles', ['title' => 'Roles Report', 'data' => $data])
                      ->setPaper('a4', 'landscape');
            return $pdf->download($filename . '.pdf');
        }

        // ---------------------------------------------------------
        // 3. Print / Copy
        // ---------------------------------------------------------
        if (in_array($type, ['print', 'copy'])) {
            $data = $roles->map(function ($role, $index) {
                return [
                    'serial_number' => $index + 1,
                    'id'            => (string)$role->id,
                    'name'          => $role->name,
                    'key'           => $role->name,
                    'permissions'   => $role->permissions->pluck('name')->implode(', '),
                    'created_at'    => $role->created_at->format('Y-m-d'),
                ];
            });
            return response()->json(['data' => $data]);
        }
    }
}
