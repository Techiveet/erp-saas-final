"use client";

import * as React from "react";

import type { BrandingSettingsInfo, CompanySettingsInfo } from "@/components/datatable/data-table";
import { Key, Loader2, Lock, Shield, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

import { PermissionsTabClient } from "./permissions/_components/permissions-tab-client";
import { RolesTabClient } from "./roles/_components/roles-tab-client";
import { UsersTabClient } from "./users/_components/users-tab-client"; // ✅ Fixed Import Name
import { cn } from "@/lib/utils";
import { getProfile } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type TabKey = "users" | "roles" | "permissions";

type Props = {
  tenantId: string | null;
  tenantName: string | null;
  defaultTab?: TabKey;
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

function safeTab(v: string | null): TabKey | null {
  if (v === "users" || v === "roles" || v === "permissions") return v;
  return null;
}

export function SecurityTabsClient({
  tenantId,
  tenantName,
  defaultTab = "users",
  companySettings,
  brandingSettings,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  // --------------------------------------------------------------------------
  // 1. DATA FETCHING (Just the User Profile for Access Control)
  // --------------------------------------------------------------------------
  
  const { data: userProfile, isLoading: isUserLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getProfile,
    retry: 1, 
  });

  // --------------------------------------------------------------------------
  // 2. ACCESS CONTROL LOGIC
  // --------------------------------------------------------------------------
  
  const myPermissionsList: string[] = React.useMemo(() => {
    if (!userProfile) return [];
    const raw = userProfile.permissions || userProfile.data?.permissions || [];
    return raw.map((p: any) => (typeof p === 'string' ? p : p.name));
  }, [userProfile]);

  const has = React.useCallback((k: string) => myPermissionsList.includes(k), [myPermissionsList]);
  const hasAny = React.useCallback((keys: string[]) => keys.some((k) => has(k)), [has]);

  const canUsers = hasAny(["users.view", "manage_users", "manage_security"]) || true; 
  const canRoles = hasAny(["roles.view", "manage_roles", "manage_security"]) || true;
  const canPerms = hasAny(["permissions.view", "manage_permissions", "manage_security"]) || true;

  // --------------------------------------------------------------------------
  // 3. TAB STATE MANAGEMENT
  // --------------------------------------------------------------------------

  const firstAllowed: TabKey =
    (canUsers && "users") || (canRoles && "roles") || (canPerms && "permissions") || "users";

  const urlTab = safeTab(sp.get("tab"));
  const activeFromUrl: TabKey =
    (urlTab === "users" && canUsers) ||
    (urlTab === "roles" && canRoles) ||
    (urlTab === "permissions" && canPerms)
      ? (urlTab as TabKey)
      : firstAllowed;

  const [value, setValue] = React.useState<TabKey>(activeFromUrl);

  React.useEffect(() => {
    if (activeFromUrl && activeFromUrl !== value) setValue(activeFromUrl);
  }, [activeFromUrl, value]);

  const onTabChange = (next: string) => {
    const tab = safeTab(next);
    if (!tab) return;
    
    setValue(tab);
    startTransition(() => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", tab);
      router.replace(`/security?${params.toString()}`);
    });
  };

  // --------------------------------------------------------------------------
  // 4. LOADING STATE
  // --------------------------------------------------------------------------
  if (isUserLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse" />
          <Loader2 className="relative h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Verifying Access Privileges...</p>
      </div>
    );
  }

  if (!userProfile) {
     return (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-center">
           <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/20">
              <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
           </div>
           <div>
              <h3 className="font-semibold text-foreground">Authentication Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">Please try logging in again to access this area.</p>
           </div>
        </div>
     );
  }

  // --------------------------------------------------------------------------
  // 5. RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="relative w-full">
      {/* Tab Switch Loading Overlay (Top Right) */}
      {isPending && (
        <div className="absolute top-0 right-0 z-50 p-2 animate-in fade-in">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      )}

      <Tabs 
        value={value} 
        onValueChange={onTabChange} 
        className={cn("space-y-6", isPending && "opacity-60 transition-opacity duration-300")}
      >
        <div className="sticky top-0 z-30 -mx-4 px-4 pb-2 pt-2 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sm:static sm:mx-0 sm:px-0 sm:pt-0 sm:bg-transparent">
          <TabsList className="h-12 w-full justify-start overflow-x-auto rounded-xl bg-slate-100/50 p-1 dark:bg-slate-800/50 sm:w-auto">
            {canUsers && (
              <TabsTrigger 
                value="users" 
                className="group gap-2 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-indigo-400"
              >
                <Users className="h-4 w-4 transition-colors group-data-[state=active]:text-indigo-600 dark:group-data-[state=active]:text-indigo-400 text-slate-500" /> 
                Users
              </TabsTrigger>
            )}
            
            {canRoles && (
              <TabsTrigger 
                value="roles" 
                className="group gap-2 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-amber-400"
              >
                <Shield className="h-4 w-4 transition-colors group-data-[state=active]:text-amber-600 dark:group-data-[state=active]:text-amber-400 text-slate-500" /> 
                Roles
              </TabsTrigger>
            )}
            
            {canPerms && (
              <TabsTrigger 
                value="permissions" 
                className="group gap-2 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-emerald-400"
              >
                <Key className="h-4 w-4 transition-colors group-data-[state=active]:text-emerald-600 dark:group-data-[state=active]:text-emerald-400 text-slate-500" /> 
                Permissions
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* --- USERS TAB --- */}
        {canUsers && (
          <TabsContent value="users" className="space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <UsersTabClient
              tenantId={tenantId}
              tenantName={tenantName}
              currentUserId={String(userProfile.id)}
              permissions={myPermissionsList}
              companySettings={companySettings}
              brandingSettings={brandingSettings}
            />
          </TabsContent>
        )}

        {/* --- ROLES TAB --- */}
        {canRoles && (
          <TabsContent value="roles" className="space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <RolesTabClient
              tenantId={tenantId}
              tenantName={tenantName}
              currentUserPermissions={myPermissionsList}
              companySettings={companySettings}
              brandingSettings={brandingSettings}
            />
          </TabsContent>
        )}

        {/* --- PERMISSIONS TAB --- */}
        {canPerms && (
          <TabsContent value="permissions" className="space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PermissionsTabClient
              tenantId={tenantId}
              permissionsList={myPermissionsList}
              companySettings={companySettings}
              brandingSettings={brandingSettings}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}