"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Globe, KeyRound, Lock, Pencil, PlusCircle, Trash2, X, Sparkles, Filter } from "lucide-react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type CompanySettingsInfo, type BrandingSettingsInfo } from "@/components/datatable/data-table";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

// API
import { fetchPermissions, createPermission, updatePermission, bulkDeletePermissions } from "@/lib/api";

/* TYPES */
export type PermissionWithFlag = {
  id: string;
  name: string;
  key: string;
  isGlobal: boolean; 
  scope?: "CENTRAL" | "TENANT";
  createdAt: string;
};

type Props = {
  tenantId: string | null;
  permissionsList: string[];
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

function slugifyPermissionKey(name: string): string {
  return name.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "") || "permission";
}

export function PermissionsTabClient({
  tenantId,
  permissionsList = [],
  companySettings,
  brandingSettings,
}: Props) {
  const queryClient = useQueryClient();

  const has = React.useCallback((key: string) => permissionsList.includes(key), [permissionsList]);
  
  // Permissions (Fallback to true for development if needed)
  const canView = true;   // has("permissions.view");
  const canCreate = true; // has("permissions.create");
  const canUpdate = true; // has("permissions.update");
  const canDelete = true; // has("permissions.delete");

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = useLocalStorage<number>("perms_table_size", 10);
  const [search, setSearch] = React.useState("");
  
  // ✅ Selection State
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false);
  const [bulkDeletable, setBulkDeletable] = React.useState<PermissionWithFlag[]>([]);

  // Dialog State
  const [createOpen, setCreateOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [selectedPerm, setSelectedPerm] = React.useState<PermissionWithFlag | null>(null);

  // Form State
  const [autoKey, setAutoKey] = React.useState(true);
  const [formName, setFormName] = React.useState("");
  const [formKey, setFormKey] = React.useState("");

  const isEdit = !!selectedPerm;

  // --- DATA FETCHING ---
  const { data: queryData, isLoading, isFetching } = useQuery({
    queryKey: ["permissions", page, pageSize, search, tenantId],
    queryFn: async () => {
      const res = await fetchPermissions({ page, pageSize, search });
      
      // ✅ ROBUST EXTRACTION: Handle Pagination Object vs Array
      let raw: any[] = [];
      let total = 0;

      if (Array.isArray(res)) {
          // Direct array
          raw = res;
          total = res.length;
      } else if (Array.isArray(res?.permissions)) {
          // Key "permissions" is array
          raw = res.permissions;
          total = res.meta?.total || raw.length;
      } else if (Array.isArray(res?.permissions?.data)) {
          // Key "permissions" is Paginator (Laravel Default)
          raw = res.permissions.data;
          total = res.permissions.total || res.meta?.total || 0;
      } else if (Array.isArray(res?.data)) {
          // Root "data" is array (API Resource)
          raw = res.data;
          total = res.meta?.total || raw.length;
      }

      const mapped: PermissionWithFlag[] = raw.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        key: p.name, // Spatie usually uses name as key
        isGlobal: p.is_system || (p.guard_name === 'web' && !!tenantId), // Lock central perms if viewing from tenant
        scope: p.guard_name === 'tenant' ? "TENANT" : "CENTRAL",
        createdAt: p.created_at
      }));

      return { rows: mapped, total };
    },
    enabled: canView,
    staleTime: 5000
  });

  const rows = queryData?.rows || [];
  const totalEntries = queryData?.total || 0;

  // --- MUTATIONS ---
  const createMut = useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setCreateOpen(false);
      toast.success("Permission created");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create")
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updatePermission({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setCreateOpen(false);
      toast.success("Permission updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update")
  });

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeletePermissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setBulkDialogOpen(false);
      setRowSelection({});
      toast.success("Permissions deleted");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete")
  });

  // --- HANDLERS ---
  function resetForm() {
    setFormName("");
    setFormKey("");
    setAutoKey(true);
  }

  const openCreate = () => {
    if (!canCreate) return;
    setSelectedPerm(null);
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (p: PermissionWithFlag) => {
    if (!canUpdate) return;
    if (p.isGlobal) {
      toast.error("System permissions cannot be modified.");
      return;
    }
    setSelectedPerm(p);
    setFormName(p.name);
    setFormKey(p.key);
    setAutoKey(false);
    setCreateOpen(true);
  };

  const openView = (p: PermissionWithFlag) => {
    if (!canView) return;
    setSelectedPerm(p);
    setViewOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formName.trim(), key: formKey.trim() };
    if (isEdit && selectedPerm) {
      updateMut.mutate({ id: Number(selectedPerm.id), payload });
    } else {
      createMut.mutate(payload);
    }
  };

  // ✅ Batch Delete Logic
  function confirmBulkDelete(rowsToDelete: PermissionWithFlag[]) {
    if (!canDelete) return;
    
    const deletable = rowsToDelete.filter((r) => !r.isGlobal);
    if (!deletable.length) {
      toast.warning("Selected permissions are system-locked and cannot be deleted.");
      return;
    }
    
    if (deletable.length < rowsToDelete.length) {
      toast.info(`${rowsToDelete.length - deletable.length} protected permissions will be skipped.`);
    }

    setBulkDeletable(deletable);
    setBulkDialogOpen(true);
  }

  function handleBulkDeleteConfirm() {
    const ids = bulkDeletable.map(r => r.id);
    bulkDeleteMut.mutate(ids);
  }

  // --- COLUMNS ---
  const columns = React.useMemo<ColumnDef<PermissionWithFlag>[]>(() => [
    {
      // ✅ FIX: Changed ID from "select" to "serial_number" to avoid collision with Checkbox column
      id: "serial_number",
      header: "#",
      size: 50,
      cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{(page - 1) * pageSize + row.index + 1}</span>,
      enableSorting: false,
      meta: { exportable: true, exportValue: (_, index) => (page - 1) * pageSize + index + 1 },
    },
    {
      id: "name",
      header: "Permission Name",
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.isGlobal ? (
            <Globe className="h-3 w-3 text-muted-foreground" />
          ) : (
            <KeyRound className="h-3 w-3 text-indigo-500" />
          )}
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
      meta: { exportable: true }
    },
    {
      id: "key",
      header: "System Key",
      accessorFn: (row) => row.key,
      cell: ({ row }) => <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">{row.original.key}</code>,
      meta: { exportable: true }
    },
    {
      id: "type",
      header: "Type",
      accessorFn: (row) => (row.isGlobal ? "System" : "Custom"),
      cell: ({ row }) => row.original.isGlobal ? 
        <Badge variant="secondary" className="text-[10px] font-normal shadow-sm">System</Badge> : 
        <Badge variant="outline" className="bg-indigo-50 text-[10px] font-normal text-indigo-700 border-indigo-200 shadow-sm">Custom</Badge>,
      meta: { exportable: true }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const p = row.original;
        const isLocked = p.isGlobal;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => openView(p)} disabled={!canView}>
              {(!canView) ? <Lock className="h-4 w-4 opacity-50" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:bg-amber-50 disabled:opacity-30" onClick={() => openEdit(p)} disabled={!canUpdate || isLocked}>
              {(isLocked || !canUpdate) ? <Lock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 disabled:opacity-30" disabled={!canDelete || isLocked} onClick={() => confirmBulkDelete([p])}>
              {(isLocked || !canDelete) ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
      meta: { align: "right" },
    },
  ], [canDelete, canUpdate, canView, page, pageSize]);

  // --- RENDER ---
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-500" />
            Permissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">Manage fine-grained access controls.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Permission
          </Button>
        )}
      </div>


      {/* DATA TABLE with Export & Selection */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          totalEntries={totalEntries}
          loading={isLoading || isFetching}
          pageIndex={page}
          pageSize={pageSize}
          
          // ✅ Query State Updates
          onQueryChange={(q: any) => {
             if (q.page) setPage(q.page);
             if (q.pageSize) setPageSize(q.pageSize);
             if (q.search !== undefined) setSearch(q.search);
          }}
          searchPlaceholder="Search permissions..."
          
          // ✅ Enable Selection & Batch Actions
          enableRowSelection={true}
          selectedRowIds={rowSelection}
          onSelectionChange={({ selectedRowIds }) => setRowSelection(selectedRowIds)}
          onDeleteRows={async (rows) => confirmBulkDelete(rows)} 
          
          // ✅ Enable Export & Print
          exportEndpoint={`/permissions/export?search=${search}`} 
          resourceName="permissions"
          
          companySettings={companySettings ?? undefined}
          brandingSettings={brandingSettings ?? undefined}
        />
      </div>

      {/* ... DIALOGS ... */}
      
      {/* CREATE / EDIT DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={cn("sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border bg-background p-0")}>
          <div className="relative border-b px-6 py-5 bg-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20"><Sparkles className="h-4 w-4 text-indigo-600" /></span>
                {isEdit ? "Edit Permission" : "Create Permission"}
              </DialogTitle>
              <DialogDescription>Use a stable key for code checks (RBAC).</DialogDescription>
            </DialogHeader>
            <button type="button" onClick={() => setCreateOpen(false)} className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted transition"><X className="h-4 w-4" /></button>
          </div>
          <ScrollArea className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Name <span className="text-red-500">*</span></label>
                <input className="w-full rounded-xl border bg-muted/30 p-2.5 text-sm" value={formName} onChange={(e) => { setFormName(e.target.value); if(autoKey) setFormKey(slugifyPermissionKey(e.target.value)); }} required placeholder="e.g. View Dashboard" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between"><label className="text-xs font-bold uppercase text-muted-foreground">Key</label><button type="button" className="text-[10px] text-indigo-600 font-medium hover:underline" onClick={() => setAutoKey((v) => !v)}>{autoKey ? "Auto: ON" : "Auto: OFF"}</button></div>
                <input className="w-full rounded-xl border bg-muted/30 p-2.5 text-sm font-mono" value={formKey} onChange={(e) => { setAutoKey(false); setFormKey(e.target.value); }} required placeholder="dashboard.view" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createMut.isPending || updateMut.isPending}>{(createMut.isPending || updateMut.isPending) ? "Saving..." : "Save Changes"}</Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-24 w-full relative">
             <div className="absolute -bottom-8 left-6">
                <div className="h-16 w-16 bg-background rounded-xl border-4 border-background shadow-lg flex items-center justify-center">
                   <KeyRound className="h-8 w-8 text-indigo-600" />
                </div>
             </div>
          </div>
          <div className="pt-10 px-6 pb-6">
             <div className="flex justify-between items-start mb-6">
                 <div>
                    <DialogTitle className="text-xl font-bold text-foreground">{selectedPerm?.name}</DialogTitle>
                    <DialogDescription className="font-mono text-xs mt-1">{selectedPerm?.key}</DialogDescription>
                 </div>
                 <Badge variant="secondary">{selectedPerm?.isGlobal ? "System" : "Custom"}</Badge>
             </div>
             <div className="text-right"><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* BULK DELETE CONFIRM */}
      <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete {bulkDeletable.length} permissions?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Roles using these permissions will lose access immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleBulkDeleteConfirm}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}