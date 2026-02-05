<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole;
use Laravel\Scout\Searchable;

class Role extends SpatieRole
{
    use HasFactory, Searchable;

    /**
     * Define the index name for Meilisearch (optional, defaults to table name)
     */
    public function searchableAs(): string
    {
        return 'roles';
    }

    /**
     * Determine the searchable data.
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'guard_name' => $this->guard_name, // Critical for filtering by Scope
            'created_at' => $this->created_at ? $this->created_at->timestamp : 0, // Critical for sorting
        ];
    }
}
