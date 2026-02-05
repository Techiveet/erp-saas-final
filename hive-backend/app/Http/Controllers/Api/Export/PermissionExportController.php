<?php

namespace App\Http\Controllers\Api\Export;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
// ✅ Use Custom Permission Model (Meilisearch enabled)
use App\Models\Permission;
use App\Exports\PermissionExport;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class PermissionExportController extends Controller
{
    public function getFilteredQuery(Request $request)
    {
        $searchTerm = $request->input('search', '');
        $query = Permission::search($searchTerm);

        // Filters (Meilisearch)
        if ($request->filled('ids')) {
            $ids = explode(',', $request->ids);
            $ids = array_map('intval', $ids); // Ensure integers
            $query->whereIn('id', $ids);
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

        $filename = 'permissions_report_' . now()->format('Y-m-d_His');

        // 1. Get IDs from Meilisearch
        $scoutResults = $this->getFilteredQuery($request);
        $ids = $scoutResults->keys();

        if ($ids->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // 2. Fetch Models (Unordered)
        $permsCollection = Permission::whereIn('id', $ids->toArray())->get();

        // 3. Sort in PHP (Postgres Compatible)
        $permissions = $ids->map(function ($id) use ($permsCollection) {
            return $permsCollection->firstWhere('id', $id);
        })->filter();

        // ---------------------------------------------------------
        // A. Excel / CSV
        // ---------------------------------------------------------
        if (in_array($type, ['csv', 'excel', 'xlsx'])) {
            $extension = $type === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;
            // Pass Collection instead of Query Builder
            return Excel::download(new PermissionExport($permissions), $filename . '.' . $extension);
        }

        // ---------------------------------------------------------
        // B. PDF
        // ---------------------------------------------------------
        if ($type === 'pdf') {
            $pdf = Pdf::loadView('exports.permissions', [
                'title' => 'Permissions Report',
                'data'  => $permissions,
            ])->setPaper('a4', 'portrait');
            return $pdf->download($filename . '.pdf');
        }

        // ---------------------------------------------------------
        // C. Print / Copy
        // ---------------------------------------------------------
        if (in_array($type, ['print', 'copy'])) {
            $data = $permissions->map(function ($p, $index) {
                return [
                    'serial_number' => $index + 1,
                    'id'            => (string)$p->id,
                    'name'          => $p->name,
                    'key'           => $p->name,
                    'created_at'    => $p->created_at->format('Y-m-d'),
                ];
            });

            return response()->json(['data' => $data]); // Return sorted values (array)
        }
    }
}
