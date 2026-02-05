<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Laravel\Scout\Searchable; // <--- 1. IMPORT THIS

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains, Searchable; // <--- 2. ADD IT HERE

    protected $fillable = [
        'id',
        'data',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
        ];
    }

    /**
     * Define exactly what data is sent to Meilisearch.
     */
    public function toSearchableArray(): array
    {
        // Get the basic tenant data
        $array = $this->toArray();

        // 3. Add the Domain Name so you can search by "apple.hive.test"
        // We pluck the first domain associated with this tenant
        $array['domain'] = $this->domains->first()?->domain;

        return $array;
    }
}
