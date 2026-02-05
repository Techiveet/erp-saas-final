<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Laravel\Scout\Searchable;

class Permission extends SpatiePermission
{
    use HasFactory, Searchable;

    public function searchableAs(): string
    {
        return 'permissions';
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'guard_name' => $this->guard_name,
            'created_at' => $this->created_at ? $this->created_at->timestamp : 0,
        ];
    }
}
