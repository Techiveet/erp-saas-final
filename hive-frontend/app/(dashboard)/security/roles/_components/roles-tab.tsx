"use client";

import * as React from "react";

import type { BrandingSettingsInfo, CompanySettingsInfo } from "@/components/datatable/data-table";

import { RolesTabClient } from "./roles-tab-client";

type Props = {
  permissionsList: string[];
  tenantId: string | null;
  tenantName: string | null;
  currentUserId: string;
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

// 1. Memoize the client component to prevent re-renders on parent state changes
const MemoizedRolesTabClient = React.memo(RolesTabClient);

export function RolesTab({
  permissionsList,
  tenantId,
  tenantName,
  currentUserId,
  companySettings,
  brandingSettings,
}: Props) {
  // 2. Memoize the props object
  const clientProps = React.useMemo(() => ({
    currentUserPermissions: permissionsList,
    tenantId,
    tenantName,
    companySettings: companySettings || null,
    brandingSettings: brandingSettings || null,
  }), [
    permissionsList,
    tenantId,
    tenantName,
    companySettings,
    brandingSettings
  ]);

  return (
    <div className="p-6">
      <MemoizedRolesTabClient {...clientProps} />
    </div>
  );
}

export default RolesTab;