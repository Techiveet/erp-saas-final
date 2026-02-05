<?php

namespace App\Traits;
use App\Exports\UsersExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
trait HasTableExports
{
    public function performExport(Request $request, $query, string $filename = 'export')
    {
        $format = $request->get('format', 'xlsx');

        // Handle specific row selection from UI
        if ($request->filled('ids')) {
            $query->whereIn('id', explode(',', $request->get('ids')));
        }

        // Millions of rows are supported in Excel/CSV via FromQuery
        if ($format === 'xlsx' || $format === 'csv') {
            return (new UsersExport($query))->download("{$filename}.{$format}");
        }

        // PDF is capped for memory stability
        if ($format === 'pdf') {
            $data = $query->limit(5000)->get();
            return Pdf::loadView('exports.pdf-template', ['data' => $data, 'title' => $filename])
                ->setPaper('a4', 'landscape')
                ->download("{$filename}.pdf");
        }

        // JSON for Copy/Print
        if (in_array($format, ['copy', 'print'])) {
            return response()->json(['data' => $query->limit(10000)->get()]);
        }
    }
}
