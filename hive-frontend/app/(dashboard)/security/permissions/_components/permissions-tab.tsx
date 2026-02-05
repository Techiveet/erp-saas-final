"use client";

import * as React from "react";

import type { BrandingSettingsInfo, CompanySettingsInfo } from "@/components/datatable/data-table";

import { PermissionsTabClient } from "./permissions-tab-client";

type Props = {
  permissionsList: string[];
  tenantId: string | null;
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

// 1. Memoize the client component
const MemoizedPermissionsTabClient = React.memo(PermissionsTabClient);

export function PermissionsTab({
  permissionsList,
  tenantId,
  companySettings,
  brandingSettings,
}: Props) {
  // 2. Memoize the props object
  const clientProps = React.useMemo(() => ({
    permissionsList,
    tenantId,
    companySettings: companySettings || null,
    brandingSettings: brandingSettings || null,
  }), [
    permissionsList,
    tenantId,
    companySettings,
    brandingSettings
  ]);

  return (
    <div className="p-6">
      <MemoizedPermissionsTabClient {...clientProps} />
    </div>
  );
}

export default PermissionsTab;``