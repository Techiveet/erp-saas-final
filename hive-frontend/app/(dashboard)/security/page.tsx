// hive-frontend/app/(dashboard)/security/page.tsx

import { SecurityTabsClient } from "./security-tabs-client";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecurityPage({ searchParams }: PageProps) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isTenant = host.includes('.') && !host.startsWith('www.');
  const tenantName = isTenant ? host.split('.')[0] : "Central System";

  const sp = (await searchParams) ?? {};
  const requestedTab = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) || "users";

  return (
    <div className="px-4 py-4 lg:px-6 lg:py-6 xl:px-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Security & Access — <span className="text-indigo-600 capitalize">{tenantName}</span>
        </h1>
        <p className="text-sm text-gray-500">
           Manage security settings for {isTenant ? "this workspace" : "the central system"}.
        </p>
      </div>

      <SecurityTabsClient
        tenantId={isTenant ? "current" : null}
        tenantName={tenantName}
        defaultTab={requestedTab as any}
      />
    </div>
  );
}