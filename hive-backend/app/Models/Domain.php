<?php

namespace App\Models;

// We rename the package model to 'BaseDomain' so we can inherit from it
use Stancl\Tenancy\Database\Models\Domain as BaseDomain;
use Laravel\Scout\Searchable;

// This class behaves EXACTLY like the package model, but also has Search functionality
class Domain extends BaseDomain
{
    use Searchable;

    // Tells Meilisearch what data to index
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'domain' => $this->domain,
            'tenant_id' => $this->tenant_id,
        ];
    }
}
