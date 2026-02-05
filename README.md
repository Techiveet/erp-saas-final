🐝 Hive ERP - Next-Gen SaaS Control Hub

Hive is a high-performance, multi-tenant ERP ecosystem designed for the modern enterprise. Built with a focus on speed, observability, and modularity, it features a stateless Next.js 16 frontend communicating with a robust Laravel 12 API.
🚀 Key Features

    Multi-Tenancy: Automated database/domain isolation using stancl/tenancy.

    Real-time Observability: * Laravel Horizon: Visual queue monitoring for Redis-backed background jobs.

        Laravel Telescope: Deep introspection for debugging requests, queries, and logs.

    Smart Search: Blazing fast full-text search powered by Meilisearch.

    Secure Auth Bridge: Custom stateless-to-stateful bridge allowing API-authenticated Super Admins to access system dashboards (Horizon/Telescope) securely.

    Email Engine: Queued transactional emails via Mailpit for local development.

    Modern UI: A "Glassmorphism" inspired dashboard with collapsed/expanded sidebar states and dark mode support.

🛠 Tech Stack
Backend (The Hive API)

    Framework: Laravel 12

    Database: PostgreSQL 17

    Cache/Queue: Redis (Alpine)

    Search: Meilisearch

    Monitoring: Horizon & Telescope

    Auth: Laravel Sanctum (API) & Web Sessions (Internal Dashboards)

Frontend (The Control Hub)

    Framework: Next.js 16 (App Router)

    Styling: Tailwind CSS + Shadcn/UI

    Icons: Lucide React

    State Management: TanStack Query (React Query)

📦 Docker Infrastructure

The environment is fully containerized for consistent development across teams.
Service	Port	Description
Frontend	3000	Next.js Dev Server
Backend	8000	Laravel API & Horizon/Telescope UI
Database	5433	PostgreSQL (External Mapping)
Redis	6379	Cache & Horizon Queues
Mailpit	8025	Webmail Interface
Meilisearch	7700	Search Engine API
Adminer	8090	Database Management UI
🛠 Installation & Setup

    Clone the Repository:
    Bash

    git clone https://github.com/your-username/erp-saas-final.git
    cd erp-saas-final

    Environment Setup:
    Bash

    cp hive-backend/.env.example hive-backend/.env
    cp hive-frontend/.env.example hive-frontend/.env

    Spin Up Docker:
    Bash

    docker compose up -d --build

    Initial Application Setup:
    Bash

    # Install dependencies
    docker compose exec backend composer install
    docker compose exec frontend npm install

    # Generate keys and migrate
    docker compose exec backend php artisan key:generate
    docker compose exec backend php artisan migrate --seed

🛡 Security & Access

System-level monitors (Horizon and Telescope) are protected by a custom Auth Bridge. Only users with the Super Admin role or ID: 1 can access these routes. Accessing them from a tenant subdomain is strictly prohibited to maintain central security.
📄 License

This project is proprietary and confidential.