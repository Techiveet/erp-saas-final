//app/(dashboard)/security/users/_components/users-tab.tsx
"use client";

import * as React from "react";

import type { BrandingSettingsInfo, CompanySettingsInfo } from "@/components/datatable/data-table";

import { UsersTabClient } from "./users-tab-client";

type Props = {
  permissionsList: string[];
  tenantId: string | null;
  tenantName: string | null;
  currentUserId: string;
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

// Memoize the props to prevent unnecessary re-renders
const MemoizedUsersTabClient = React.memo(UsersTabClient);

export function UsersTab({
  permissionsList,
  tenantId,
  tenantName,
  currentUserId,
  companySettings,
  brandingSettings,
}: Props) {
  // Memoize the props object to prevent unnecessary re-renders
  const clientProps = React.useMemo(() => ({
    permissions: permissionsList,
    tenantId,
    tenantName,
    currentUserId,
    companySettings: companySettings || null,
    brandingSettings: brandingSettings || null,
  }), [
    permissionsList, 
    tenantId, 
    tenantName, 
    currentUserId, 
    companySettings, 
    brandingSettings
  ]);

  return (
    <div className="p-6">
      <MemoizedUsersTabClient {...clientProps} />
    </div>
  );
}