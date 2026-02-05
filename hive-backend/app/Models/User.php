<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Scout\Searchable; // ✅ Scout Trait
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Http\Request;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, Searchable, HasRoles, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'avatar_path',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Context-Aware Guard for Spatie Permissions
     */
    public function getGuardNameAttribute(): string
    {
        if (function_exists('tenancy') && tenancy()->initialized) {
            return 'tenant';
        }
        return 'web';
    }

    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar_path
            ? asset('storage/' . $this->avatar_path)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
    }

    protected $appends = ['avatar_url'];

    /* -----------------------------------------------------------------
     * 🔍 MEILISEARCH CONFIGURATION
     * ----------------------------------------------------------------- */
    public function toSearchableArray(): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // Flatten role name for easy filtering
            'role' => $this->roles->first()?->name ?? 'No Role',
            'is_active' => (bool) $this->is_active,
            // Index timestamp for sorting/filtering
            'created_at' => $this->created_at ? $this->created_at->timestamp : 0,
        ];
    }

    /* -----------------------------------------------------------------
     * 🔍 FILTER SCOPE (Database Fallback / ID Filtering)
     * ----------------------------------------------------------------- */
    public function scopeFilter(Builder $query, Request $request): Builder
    {
        return $query->when($request->ids, function ($q, $ids) {
            // Handles comma-separated IDs (e.g. from "Select All" export)
            $idArray = is_array($ids) ? $ids : explode(',', $ids);
            $q->whereIn('id', $idArray);
        })
        // Fallback search (only runs if not using Scout/Meilisearch in controller)
        ->when($request->search && !config('scout.driver'), function ($q, $search) {
             $q->where(function ($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
             });
        });
    }

    /**
     * Scope: Filter only active users
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
