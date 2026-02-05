<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection; // ✅ Changed from FromQuery
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class RolesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $roles;

    public function __construct($roles)
    {
        $this->roles = $roles;
    }

    public function collection()
    {
        return $this->roles;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Role Name',
            'Permissions',
            'Created At',
        ];
    }

    public function map($role): array
    {
        return [
            $role->id,
            $role->name,
            $role->permissions->pluck('name')->implode(', '),
            $role->created_at ? $role->created_at->format('Y-m-d H:i') : '',
        ];
    }
}
