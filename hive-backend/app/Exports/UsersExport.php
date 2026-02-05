<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class UsersExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $query;
    private $rowNumber = 0; // ✅ Counter for sequential IDs

    /**
     * Constructor now accepts the Query Builder directly
     */
    public function __construct($query)
    {
        $this->query = $query;
    }

    public function query()
    {
        return $this->query;
    }

    /**
     * Map each row.
     * We ignore the DB ID and use $rowNumber to ensure 1, 2, 3, 4 ordering.
     */
    public function map($user): array
    {
        $this->rowNumber++; // Increment counter

        return [
            $this->rowNumber, // ✅ Always 1, 2, 3...
            $user->name,
            $user->email,
            $user->roles->first()?->name ?? 'Member',
            $user->is_active ? 'Active' : 'Inactive',
            $user->created_at->format('Y-m-d H:i'),
        ];
    }

    public function headings(): array
    {
        return [
            '#',
            'Name',
            'Email',
            'Role',
            'Status',
            'Joined Date',
        ];
    }
}
