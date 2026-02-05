<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection; // ✅ Changed
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PermissionExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $permissions;

    public function __construct($permissions)
    {
        $this->permissions = $permissions;
    }

    public function collection()
    {
        return $this->permissions;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Group',
            'Created At',
        ];
    }

    public function map($permission): array
    {
        return [
            $permission->id,
            $permission->name,
            $permission->group_name ?? 'General',
            $permission->created_at ? $permission->created_at->format('Y-m-d H:i') : '',
        ];
    }
}
