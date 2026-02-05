"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  Filter,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  PlusCircle,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DataTable,
  type CompanySettingsInfo,
  type BrandingSettingsInfo,
} from "@/components/datatable/data-table";

import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole
} from "@/lib/api";

import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

/* -------------------- TYPES -------------------- */

export type RoleForClient = {
  id: string;
  key: string;
  name: string;
  scope: "CENTRAL" | "TENANT";
  permissionsCount: number;
  createdAt: string;
  permissions?: { id: string; name: string; key?: string }[];
};

export type PermissionLite = {
  id: string;
  name: string;
  key?: string;
  group?: string;
};

type Props = {
  tenantId: string | null;
  tenantName: string | null;
  currentUserPermissions: string[];
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

/* -------------------- HELPERS -------------------- */

const PROTECTED_ROLE_KEYS = ["central_superadmin", "tenant_superadmin", "super_admin", "admin"];

function slugifyRoleKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* -------------------- MAIN COMPONENT -------------------- */

export function RolesTabClient(props: Props) {
  const { tenantId, tenantName, companySettings, brandingSettings, currentUserPermissions } = props;
  const queryClient = useQueryClient();

  // --- Permissions Check ---
  // In production, uncomment the check. For now, fallback to true if permissions aren't fully set up.
  const canView = true;   // has("roles.view");
  const canCreate = true; // has("roles.create");
  const canUpdate = true; // has("roles.update");
  const canDelete = true; // has("roles.delete");

  // --- Helpers ---
  const formatDate = React.useCallback((dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { return dateStr; }
  }, []);

  const isProtectedRole = React.useCallback((role: RoleForClient) => {
    return PROTECTED_ROLE_KEYS.includes(role.key) || role.name.toLowerCase().includes('super admin');
  }, []);

  // --- State ---
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = useLocalStorage<number>("roles_table_page_size", 10);
  const [search, setSearch] = React.useState("");
  const [tableKey, setTableKey] = React.useState(0);
  
  // ✅ Selection State
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Sorting
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<string | null>(null);

  // Filters
  const [scopeFilter, setScopeFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  // Dialogs
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [viewModalOpen, setViewModalOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Selection & Editing
  const [selectedRole, setSelectedRole] = React.useState<RoleForClient | null>(null);
  const [roleToDelete, setRoleToDelete] = React.useState<RoleForClient | null>(null);
  const isEdit = !!selectedRole;

  // Form State
  const [formName, setFormName] = React.useState("");
  const [formKey, setFormKey] = React.useState("");
  const [autoKey, setAutoKey] = React.useState(true);
  const [selectedPermIds, setSelectedPermIds] = React.useState<string[]>([]);
  const [permSearch, setPermSearch] = React.useState("");
  const [permFilter, setPermFilter] = React.useState<"all" | "enabled" | "disabled">("all");

  // --------------------------------------------------------------------------
  // 1. DATA FETCHING
  // --------------------------------------------------------------------------

  const { data: rolesData, isLoading: isRolesLoading, isFetching } = useQuery({
    queryKey: ["roles", tenantId, page, pageSize, search, sortCol, sortDir, scopeFilter, dateFrom, dateTo],
    queryFn: async () => {
      const res = await fetchRoles(tenantId); 
      
      // ✅ SAFE EXTRACTION: Handle Pagination vs Array
      let raw: any[] = [];
      if (Array.isArray(res)) {
        raw = res;
      } else if (res?.roles && Array.isArray(res.roles)) {
        raw = res.roles;
      } else if (res?.roles?.data && Array.isArray(res.roles.data)) {
        raw = res.roles.data; // Paginated response
      } else if (res?.data && Array.isArray(res.data)) {
        raw = res.data;
      }

      let list: RoleForClient[] = raw.map((r: any) => ({
        id: String(r.id),
        key: r.name,
        name: r.name,
        scope: r.guard_name === 'tenant' ? "TENANT" : "CENTRAL",
        permissionsCount: r.permissions?.length || 0,
        createdAt: r.created_at,
        permissions: r.permissions || []
      }));

      // Client-side Filtering
      if (search) {
        list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
      }
      
      if (scopeFilter !== 'all') {
        list = list.filter(r => r.scope === scopeFilter);
      }

      if (dateFrom) {
        const fromTime = new Date(dateFrom).getTime();
        list = list.filter(r => new Date(r.createdAt).getTime() >= fromTime);
      }
      if (dateTo) {
        const toTime = new Date(dateTo).getTime();
        list = list.filter(r => new Date(r.createdAt).getTime() <= toTime + 86400000); 
      }

      // Client-side Sorting
      if (sortCol) {
        list.sort((a: any, b: any) => {
          const aVal = a[sortCol!] || "";
          const bVal = b[sortCol!] || "";
          if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Client-side Pagination logic (if API returns full list)
      const total = list.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      return { rows: list.slice(start, end), total };
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5, 
  });

  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => fetchPermissions({ pageSize: 1000 }),
    staleTime: 1000 * 60 * 60, 
  });

  const allPermissions: PermissionLite[] = React.useMemo(() => {
    // ✅ SAFE EXTRACTION: Handle Pagination vs Array
    let raw: any[] = [];

    if (Array.isArray(permissionsData)) {
      raw = permissionsData;
    } else if (permissionsData?.permissions && Array.isArray(permissionsData.permissions)) {
      raw = permissionsData.permissions;
    } else if (permissionsData?.permissions?.data && Array.isArray(permissionsData.permissions.data)) {
       // This handles the Paginated response from Meilisearch/Laravel
      raw = permissionsData.permissions.data;
    } else if (permissionsData?.data && Array.isArray(permissionsData.data)) {
      raw = permissionsData.data;
    }
      
    return raw.map((p: any) => ({ 
      id: String(p.id), 
      name: p.name, 
      key: p.name,
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [permissionsData]);

  // --------------------------------------------------------------------------
  // 2. MUTATIONS
  // --------------------------------------------------------------------------

  const createMut = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setCreateModalOpen(false);
      toast.success("Role created successfully");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create role")
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateRole({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setCreateModalOpen(false);
      toast.success("Role updated successfully");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update role")
  });

  const deleteMut = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted");
    },
    onError: () => toast.error("Failed to delete role")
  });

  // --------------------------------------------------------------------------
  // 3. HANDLERS
  // --------------------------------------------------------------------------

  const handleQueryChange = React.useCallback((q: any) => {
    if (q.page !== undefined) setPage(q.page);
    if (q.pageSize !== undefined) setPageSize(q.pageSize);
    if (q.search !== undefined) setSearch(q.search);
    if (q.sortCol !== undefined) setSortCol(q.sortCol);
    if (q.sortDir !== undefined) setSortDir(q.sortDir);
  }, [setPageSize]);

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["roles"] });

  const resetFilters = () => {
    setSearch("");
    setScopeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setSortCol(null);
    setTableKey(prev => prev + 1);
  };

  const resetForm = React.useCallback(() => {
    setFormName("");
    setFormKey("");
    setAutoKey(true);
    setSelectedPermIds([]);
    setPermSearch("");
    setPermFilter("all");
  }, []);

  const openCreate = () => {
    if (!canCreate) return;
    setSelectedRole(null);
    resetForm();
    setCreateModalOpen(true);
  };

  const openEdit = (role: RoleForClient) => {
    if (!canUpdate || isProtectedRole(role)) return;
    setSelectedRole(role);
    setFormName(role.name);
    setFormKey(role.key);
    setAutoKey(false);
    const currentPermIds = role.permissions?.map((p: any) => String(p.id)) || [];
    setSelectedPermIds(currentPermIds);
    setCreateModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPermNames = allPermissions
      .filter(p => selectedPermIds.includes(p.id))
      .map(p => p.name);

    const payload = { 
      name: formName, 
      guard_name: tenantId ? 'tenant' : 'web',
      permissions: selectedPermNames 
    };

    if (isEdit && selectedRole) {
      updateMut.mutate({ id: Number(selectedRole.id), payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleBatchDelete = React.useCallback(async (rows: RoleForClient[]) => {
    const deletable = rows.filter(r => !isProtectedRole(r));
    
    if (deletable.length === 0) {
      toast.warning("All selected roles are protected and cannot be deleted.");
      return;
    }

    if (deletable.length < rows.length) {
      toast.warning(`${rows.length - deletable.length} protected roles were skipped.`);
    }

    try {
      await Promise.all(deletable.map(r => deleteMut.mutateAsync(Number(r.id))));
      toast.success(`Deleted ${deletable.length} roles successfully.`);
      setRowSelection({}); // Clear selection after delete
    } catch (e) {
      console.error(e);
    }
  }, [deleteMut, isProtectedRole]);

  const handleDeleteSingle = () => {
    if (roleToDelete) {
      deleteMut.mutate(Number(roleToDelete.id));
      setDeleteDialogOpen(false);
    }
  };

  // --- Permission Selection Logic ---
  const visiblePermissions = React.useMemo(() => {
    let result = allPermissions;
    const q = permSearch.toLowerCase().trim();
    if (q) result = result.filter(p => p.name.toLowerCase().includes(q));
    
    if (permFilter === "enabled") result = result.filter(p => selectedPermIds.includes(p.id));
    else if (permFilter === "disabled") result = result.filter(p => !selectedPermIds.includes(p.id));
    
    return result;
  }, [allPermissions, permSearch, permFilter, selectedPermIds]);

  const togglePermission = (id: string) => {
    setSelectedPermIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllVisible = () => {
    const visibleIds = visiblePermissions.map(p => p.id);
    const allSelected = visibleIds.every(id => selectedPermIds.includes(id));
    if (allSelected) setSelectedPermIds(prev => prev.filter(id => !visibleIds.includes(id)));
    else setSelectedPermIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  // --------------------------------------------------------------------------
  // 4. COLUMNS
  // --------------------------------------------------------------------------

  const columns = React.useMemo<ColumnDef<RoleForClient>[]>(() => [
    {
      id: "serial_number",
      header: "#",
      size: 50,
      cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{(page - 1) * pageSize + row.index + 1}</span>,
      enableSorting: false,
      meta: { exportable: true, exportValue: (_, index) => (page - 1) * pageSize + index + 1 },
    },
    {
      id: "name",
      header: "Role Name",
      accessorFn: row => row.name,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.name}</span>
          <span className="text-[11px] text-muted-foreground font-mono">{row.original.key}</span>
        </div>
      ),
      meta: { exportable: true }
    },
    {
      id: "scope",
      header: "Scope",
      accessorKey: "scope",
      cell: ({ row }) => (
        <Badge variant={row.original.scope === "CENTRAL" ? "secondary" : "outline"} className="text-[10px] font-normal shadow-sm">
          {row.original.scope}
        </Badge>
      ),
      meta: { exportable: true }
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{row.original.permissionsCount}</span>
        </div>
      ),
      meta: { exportable: true, exportValue: (row) => row.permissionsCount }
    },
    {
      id: "createdAt",
      header: "Created",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">{formatDate(row.original.createdAt)}</span>
        </div>
      ),
      meta: { exportable: true }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      size: 100,
      cell: ({ row }) => {
        const r = row.original;
        const isProtected = isProtectedRole(r);

        return (
          <div className="flex items-center justify-end gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
              onClick={() => { setSelectedRole(r); setViewModalOpen(true); }}
              title="View Details"
              disabled={!canView}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 transition-colors", 
                isProtected ? "text-muted-foreground/30" : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              )}
              onClick={() => openEdit(r)}
              title={isProtected ? "Protected Role" : "Edit Role"}
              disabled={!canUpdate || isProtected}
            >
              {isProtected ? <Lock className="h-3.5 w-3.5" /> : <Pencil className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 transition-colors", 
                isProtected ? "text-muted-foreground/30" : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              )}
              onClick={() => { setRoleToDelete(r); setDeleteDialogOpen(true); }}
              title={isProtected ? "Protected Role" : "Delete Role"}
              disabled={!canDelete || isProtected}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ], [canView, canUpdate, canDelete, isProtectedRole, formatDate, page, pageSize]);

  // --------------------------------------------------------------------------
  // 5. RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-500" />
            Roles Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Define roles and assign capabilities to your {tenantName || "System"} team.
          </p>
        </div>
        {canCreate && (
          <Button 
            onClick={openCreate} 
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Role
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
             <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="h-9 w-[130px] bg-background">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                  <SelectItem value="CENTRAL">Central</SelectItem>
                </SelectContent>
             </Select>

             <div className="flex items-center gap-2 bg-background border border-input rounded-md px-2 h-9">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Created:</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-sm w-[110px] focus:outline-none" />
                <span className="text-muted-foreground">-</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-sm w-[110px] focus:outline-none" />
             </div>

             {(scopeFilter !== "all" || search || dateFrom || dateTo) && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={resetFilters}
                 className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
               >
                 <X className="mr-1 h-3.5 w-3.5" /> Clear
               </Button>
             )}
          </div>
        </div>
      </div>

      {/* ✅ DATA TABLE with Exports & Selection Enabled */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <DataTable
          key={tableKey}
          columns={columns}
          data={rolesData?.rows || []}
          totalEntries={rolesData?.total || 0}
          loading={isRolesLoading || isFetching}
          pageIndex={page}
          pageSize={pageSize}
          onQueryChange={handleQueryChange}
          onRefresh={handleRefresh}
          searchPlaceholder="Search roles by name..."
          
          enableRowSelection={true}
          selectedRowIds={rowSelection}
          onSelectionChange={(payload) => setRowSelection(payload.selectedRowIds)}
          
          // ✅ Export now points to your backend API
          exportEndpoint={`/roles/export?search=${search}&scope=${scopeFilter}&tenant_id=${tenantId || ""}`} 
          resourceName="roles"
          
          onDeleteRows={handleBatchDelete}

          companySettings={companySettings ?? undefined}
          brandingSettings={brandingSettings ?? undefined}
        />
      </div>

      {/* ... DIALOGS ... */}
      
      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-5 border-b border-border/40 bg-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                   <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                {isEdit ? "Edit Role" : "New Role"}
              </DialogTitle>
              <DialogDescription className="ml-10">
                {isEdit ? "Modify permissions and details." : "Define a new role and its capabilities."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1">
            <form id="role-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Name <span className="text-red-500">*</span></Label>
                  <Input 
                    required 
                    placeholder="e.g. Sales Manager" 
                    value={formName} 
                    onChange={e => { 
                      setFormName(e.target.value); 
                      if(autoKey) setFormKey(slugifyRoleKey(e.target.value)); 
                    }} 
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Key</Label>
                      <button type="button" onClick={() => setAutoKey(!autoKey)} className="text-[10px] text-indigo-600 hover:underline font-medium">
                        Auto: {autoKey ? "ON" : "OFF"}
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                      <Input 
                        required 
                        className="pl-9 font-mono text-xs bg-muted/30" 
                        placeholder="sales_manager" 
                        value={formKey} 
                        onChange={e => { setAutoKey(false); setFormKey(e.target.value); }} 
                        disabled={isEdit} 
                      />
                    </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                   <Label className="text-sm font-medium">Permissions Assignment</Label>
                   <div className="flex gap-1 bg-muted p-1 rounded-lg">
                     {['all', 'enabled', 'disabled'].map((f: any) => (
                       <button 
                         key={f} 
                         type="button" 
                         onClick={() => setPermFilter(f)} 
                         className={cn(
                           "text-[10px] uppercase px-3 py-1 rounded-md transition-all font-bold tracking-wide",
                           permFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-muted-foreground hover:bg-white/50'
                         )}
                       >
                         {f}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9 h-9 bg-background" 
                        placeholder="Filter permissions..." 
                        value={permSearch} 
                        onChange={e => setPermSearch(e.target.value)} 
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                        <span>{visiblePermissions.length} permissions found</span>
                        <button type="button" onClick={toggleAllVisible} className="text-indigo-600 hover:underline font-medium">
                          Toggle All Visible
                        </button>
                    </div>

                    <div className="h-64 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2 custom-scrollbar">
                       {visiblePermissions.map(p => {
                          const isSelected = selectedPermIds.includes(p.id);
                          return (
                             <div 
                               key={p.id} 
                               onClick={() => togglePermission(p.id)} 
                               className={cn(
                                 "cursor-pointer border rounded-lg p-3 flex items-start gap-3 transition-all select-none group",
                                 isSelected 
                                   ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                                   : 'bg-background border-transparent hover:border-border hover:shadow-sm'
                               )}
                             >
                                <div className={cn("mt-0.5", isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground")}>
                                  {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                  <div className={cn("text-sm font-medium leading-none", isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-foreground")}>
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono mt-1 truncate" title={p.key}>
                                    {p.key}
                                  </div>
                                </div>
                             </div>
                          )
                       })}
                       {visiblePermissions.length === 0 && (
                         <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
                           <Search className="h-6 w-6 opacity-20" />
                           <span className="text-xs">No matching permissions found.</span>
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="text-right text-xs text-muted-foreground">
                   <span className="font-medium text-foreground">{selectedPermIds.length}</span> permissions selected total
                 </div>
              </div>
            </form>
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex justify-end gap-3">
             <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="rounded-lg">Cancel</Button>
             <Button 
               type="submit" 
               form="role-form" 
               disabled={createMut.isPending || updateMut.isPending} 
               className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 min-w-[120px]"
             >
               {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {isEdit ? "Save Changes" : "Create Role"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60">
           <div className="bg-gradient-to-br from-amber-500 to-orange-600 h-24 w-full relative">
             <div className="absolute -bottom-8 left-6">
                <div className="h-16 w-16 bg-background rounded-xl border-4 border-background shadow-lg flex items-center justify-center">
                   <Shield className="h-8 w-8 text-amber-600" />
                </div>
             </div>
           </div>
           <div className="pt-10 px-6 pb-6">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <DialogTitle className="text-xl font-bold text-foreground">{selectedRole?.name}</DialogTitle>
                    <DialogDescription className="font-mono text-xs mt-1">{selectedRole?.key}</DialogDescription>
                 </div>
                 <Badge variant="outline">{selectedRole?.scope}</Badge>
              </div>
              
              <div className="space-y-4">
                 <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Granted Permissions</h4>
                 <ScrollArea className="h-[200px] rounded-lg border bg-muted/20 p-2">
                    <div className="grid grid-cols-1 gap-1">
                       {selectedRole?.permissions?.map(p => (
                          <div key={p.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded border border-transparent hover:border-border">
                             <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                             <span>{p.name}</span>
                          </div>
                       ))}
                       {(!selectedRole?.permissions || selectedRole.permissions.length === 0) && (
                          <div className="text-xs text-muted-foreground text-center py-4">No permissions assigned.</div>
                       )}
                    </div>
                 </ScrollArea>
              </div>

              <div className="mt-6 flex justify-end">
                 <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                 <ShieldAlert className="h-5 w-5" /> Delete Role?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete the role <strong>{roleToDelete?.name}</strong>. 
                <br /><br />
                Users currently assigned to this role will lose their associated permissions immediately. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSingle} className="bg-red-600 hover:bg-red-700">
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}