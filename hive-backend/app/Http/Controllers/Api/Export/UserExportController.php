<?php

namespace App\Http\Controllers\Api\Export;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Exports\UsersExport;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class UserExportController extends Controller
{
    /**
     * CENTRALIZED FILTERING LOGIC
     * This ensures PDF, Excel, and Print all get the exact same data.
     */
    public function getFilteredQuery(Request $request)
    {
        $query = User::with('roles');

        // 1. IDs Selection (Manual)
        if ($request->filled('ids')) {
            $ids = explode(',', $request->ids);
            $query->whereIn('id', $ids);
        }
        // 2. Search (Scout/Global)
        elseif ($request->filled('search')) {
            $ids = User::search($request->search)->keys();
            $query->whereIn('id', $ids);
        }

        // 3. Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        // 4. Role Filter
        if ($request->filled('role') && $request->role !== 'all') {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // 5. Date Filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // 6. SORTING LOGIC
        // A. Sticky Top: Admin (ID 1) is always first
        $query->orderByRaw('id = 1 DESC');

        // B. Secondary Sort: Strict ID Ascending (1, 2, 3, 4...)
        // We removed `latest()` because it scrambles IDs when records are updated.
        if ($request->filled('sortCol') && $request->filled('sortDir')) {
            $query->orderBy($request->sortCol, $request->sortDir);
        } else {
            $query->orderBy('id', 'asc');
        }

        return $query;
    }

    public function handleExport(Request $request)
    {
        $type = $request->query('type') ?? $request->query('format');

        abort_unless(
            in_array($type, ['csv', 'excel', 'xlsx', 'pdf', 'print', 'copy']),
            Response::HTTP_BAD_REQUEST,
            'Invalid export type.'
        );

        $filename = 'users_report_' . now()->format('Y-m-d_His');

        // ---------------------------------------------------------
        // 1. Handle File Downloads (Excel/CSV)
        // ---------------------------------------------------------
        if (in_array($type, ['csv', 'excel', 'xlsx'])) {
            $extension = $type === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

            // Pass the PRE-BUILT Query to the Export class
            return Excel::download(new UsersExport($this->getFilteredQuery($request)), $filename . '.' . $extension);
        }

        // ---------------------------------------------------------
        // 2. Handle PDF
        // ---------------------------------------------------------
        if ($type === 'pdf') {
            $users = $this->getFilteredQuery($request)->get();

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.users', [
                'title' => 'Users Report',
                'data'  => $users, // In Blade, use {{$loop->iteration}} for 1,2,3
            ])->setPaper('a4', 'portrait');

            return $pdf->download($filename . '.pdf');
        }

        // ---------------------------------------------------------
        // 3. Handle Print & Copy (JSON)
        // ---------------------------------------------------------
        if (in_array($type, ['print', 'copy'])) {
            $users = $this->getFilteredQuery($request)
                ->get()
                ->values() // Re-index array keys to 0,1,2...
                ->map(function ($user, $index) {
                    return [
                        'serial_number' => $index + 1, // ✅ Logic: 1, 2, 3, 4...
                        'id'      => $user->id,        // Keep DB ID just in case
                        'name'    => $user->name,
                        'email'   => $user->email,
                        'role'    => $user->roles->first()?->name ?? 'Member',
                        'status'  => $user->is_active ? 'Active' : 'Inactive',
                        'joined'  => $user->created_at->format('Y-m-d'),
                    ];
                });

            return response()->json(['data' => $users]);
        }
    }
}
