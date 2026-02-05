"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Pencil,
  PlusCircle,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
  Upload,
  ImageIcon,
  Filter,
  X,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  fetchRoles,
} from "@/lib/api";

import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

/* -------------------- TYPES -------------------- */
export type UserForClient = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  isActive: boolean;
  avatarUrl?: string | null;
  userRoles: {
    id: string;
    roleId: string | null;
    role: { key: string; name: string; scope?: "CENTRAL" | "TENANT" };
  }[];
};

type Props = {
  currentUserId?: string;
  tenantId: string | null;
  tenantName: string | null;
  permissions?: string[];
  companySettings?: CompanySettingsInfo | null;
  brandingSettings?: BrandingSettingsInfo | null;
};

/* -------------------- MAIN COMPONENT -------------------- */

export function UsersTabClient(props: Props) {
  const { tenantId, tenantName, companySettings, brandingSettings } = props;
  const isCentralAdmin = !tenantId;
  const queryClient = useQueryClient();

  // --------------------------------------------------------------------------
  // OPTIMIZED HELPERS
  // --------------------------------------------------------------------------
  const isProtectedUser = React.useCallback((user: any) => {
    if (!user) return false;
    if (user.id === "1" || user.id === 1) return true;

    if (
      user.role &&
      typeof user.role === "string" &&
      user.role.includes("Super Admin")
    ) {
      return true;
    }

    if (user.userRoles && Array.isArray(user.userRoles)) {
      return user.userRoles.some((r: any) => r.role?.name === "Super Admin");
    }

    return false;
  }, []);

  const getStorageUrl = React.useCallback(
    (path: string | null | undefined, explicitUrl?: string | null): string | null => {
      if (explicitUrl) {
        if (explicitUrl.includes("localhost") && !explicitUrl.includes(":8000")) {
          return explicitUrl.replace("localhost", "localhost:8000");
        }
        return explicitUrl;
      }
      if (!path) return null;
      const cleanPath = path.replace(/^\/+/, "");
      return `http://localhost:8000/storage/${cleanPath}`;
    },
    [],
  );

  const generateStrongPassword = React.useCallback((length = 12) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(randomValues[i] % chars.length);
    }
    return password;
  }, []);

  const initials = React.useCallback((name?: string | null, email?: string) => {
    const src = (name || email || "").trim();
    if (!src) return "??";
    const parts = src.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return src[0]!.toUpperCase();
  }, []);

  const formatDate = React.useCallback((dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Invalid Date";
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  }, []);

  const getRoleBadgeVariant = React.useCallback((roleName: string) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("super admin")) return "default";
    if (r.includes("admin") || r.includes("owner")) return "destructive";
    if (r.includes("manager") || r.includes("editor")) return "secondary";
    return "outline";
  }, []);

  const mapServerUserToClient = React.useCallback(
    (u: any): UserForClient => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      isActive: !!u.is_active,
      createdAt: u.created_at,
      avatarUrl: getStorageUrl(u.avatar_path, u.avatar_url),
      userRoles: (u.roles || []).map((r: any) => ({
        id: String(r.id),
        roleId: String(r.id),
        role: {
          key: r.name,
          name: r.name,
          scope: r.guard_name === "tenant" ? "TENANT" : "CENTRAL",
        },
      })),
    }),
    [getStorageUrl],
  );

  // --- Query State ---
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = useLocalStorage<number>("users_table_page_size", 10);
  const [search, setSearch] = React.useState("");
  const [tableKey, setTableKey] = React.useState(0);

  // Sorting
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserForClient | null>(null);
  const [viewUser, setViewUser] = React.useState<UserForClient | null>(null);
  const isEdit = !!editingUser;

  // Form State
  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formPassword, setFormPassword] = React.useState("");
  const [formRoleId, setFormRoleId] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [formAvatarUrl, setFormAvatarUrl] = React.useState<string | null>(null);
  const [formAvatarFile, setFormAvatarFile] = React.useState<File | null>(null);
  const [isAvatarRemoved, setIsAvatarRemoved] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // 1. OPTIMIZED DATA FETCHING
  // --------------------------------------------------------------------------

  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ["users", page, pageSize, search, statusFilter, roleFilter, dateFrom, dateTo, sortCol, sortDir, tenantId],
    queryFn: async () => {
      const res = await fetchUsers({
        page,
        pageSize,
        search: search.trim(),
        status: statusFilter,
        role: roleFilter,
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: sortCol,
        sort_direction: sortDir,
        tenant_id: tenantId,
      });

      const rawUsers = Array.isArray(res) ? res : res.users || res.data || [];
      const total = res.total || res.meta?.total || rawUsers.length;

      return {
        rows: rawUsers.map(mapServerUserToClient),
        total,
      };
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles", tenantId],
    queryFn: () => fetchRoles(tenantId),
    staleTime: 1000 * 60 * 30,
  });

  // ✅ FIXED: Hide Super Admin from Dropdown
  const assignableRoles = React.useMemo(() => {
    let rawRoles: any[] = [];

    // Robust extraction logic
    if (Array.isArray(rolesData)) {
      rawRoles = rolesData;
    } else if (rolesData?.roles && Array.isArray(rolesData.roles)) {
      rawRoles = rolesData.roles;
    } else if (rolesData?.roles?.data && Array.isArray(rolesData.roles.data)) {
      rawRoles = rolesData.roles.data;
    } else if (rolesData?.data && Array.isArray(rolesData.data)) {
      rawRoles = rolesData.data;
    }

    return rawRoles
      .map((r: any) => ({
        id: String(r.id),
        key: r.name,
        name: r.name,
        scope: r.guard_name === "tenant" ? "TENANT" : "CENTRAL",
      }))
      .filter((r: any) => {
        // 1. Scope Check
        const scopeMatch = isCentralAdmin ? r.scope === "CENTRAL" : r.scope === "TENANT";
        // 2. Hide Super Admin
        const isNotSuper = r.name !== "Super Admin"; 
        return scopeMatch && isNotSuper;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [rolesData, isCentralAdmin]);

  // --------------------------------------------------------------------------
  // 2. MUTATIONS
  // --------------------------------------------------------------------------

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create user");
    },
  });

  const updateMut = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update user");
    },
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  // --------------------------------------------------------------------------
  // 3. HANDLERS
  // --------------------------------------------------------------------------

  const handleQueryChange = React.useCallback(
    (q: any) => {
      const updates: any = {};
      if (q.page !== undefined && q.page !== page) { updates.page = q.page; setPage(q.page); }
      if (q.pageSize !== undefined && q.pageSize !== pageSize) { updates.pageSize = q.pageSize; setPageSize(q.pageSize); }
      if (q.search !== undefined && q.search !== search) { updates.search = q.search; setSearch(q.search); }
      if (q.sortCol !== undefined && q.sortCol !== sortCol) { updates.sortCol = q.sortCol; setSortCol(q.sortCol); }
      if (q.sortDir !== undefined && q.sortDir !== sortDir) { updates.sortDir = q.sortDir; setSortDir(q.sortDir); }
    },
    [page, pageSize, search, sortCol, sortDir, setPageSize],
  );

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }, [queryClient]);

  const resetFilters = React.useCallback(() => {
    setStatusFilter("all");
    setRoleFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setSortCol(null);
    setSortDir(null);
    setPage(1);
    setTableKey((prev) => prev + 1);
  }, []);

  const handleDeleteRows = React.useCallback(
    async (rows: UserForClient[]) => {
      try {
        await Promise.all(rows.map((r) => deleteMut.mutateAsync(Number(r.id))));
      } catch (error) {
        console.error("Error deleting rows:", error);
      }
    },
    [deleteMut],
  );

  const resetForm = React.useCallback(() => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    // Defaults to first available role (Super Admin is already filtered out)
    setFormRoleId(assignableRoles[0]?.id || "");
    setFormAvatarUrl(null);
    setFormAvatarFile(null);
    setIsAvatarRemoved(false);
    setShowPassword(false);
  }, [assignableRoles]);

  const openCreate = React.useCallback(() => {
    setEditingUser(null);
    resetForm();
    setCreateDialogOpen(true);
  }, [resetForm]);

  const openEdit = React.useCallback(
    (u: UserForClient) => {
      if (isProtectedUser(u)) {
        toast.error("This user profile cannot be edited.");
        return;
      }
      setEditingUser(u);
      setFormName(u.name || "");
      setFormEmail(u.email);
      setFormAvatarUrl(u.avatarUrl ? `${u.avatarUrl}?t=${Date.now()}` : null);
      setFormAvatarFile(null);
      setIsAvatarRemoved(false);
      
      // Select current role
      const currentRole = u.userRoles[0]?.roleId;
      setFormRoleId(currentRole || assignableRoles[0]?.id || "");
      
      setFormPassword("");
      setCreateDialogOpen(true);
    },
    [assignableRoles, isProtectedUser],
  );

  const handleFileSelect = React.useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return;
    }
    setFormAvatarFile(file);
    setIsAvatarRemoved(false);
    setFormAvatarUrl(URL.createObjectURL(file));
  }, []);

  const onFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
    },
    [handleFileSelect],
  );

  const onDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    },
    [handleFileSelect],
  );

  const removeAvatar = React.useCallback(() => {
    setFormAvatarFile(null);
    setFormAvatarUrl(null);
    setIsAvatarRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("name", formName.trim());
      formData.append("email", formEmail.trim().toLowerCase());

      if (formPassword) formData.append("password", formPassword);
      if (tenantId) formData.append("tenant_id", tenantId);

      const roleObj = assignableRoles.find((r: any) => r.id === formRoleId);
      if (roleObj) {
        formData.append("role", roleObj.name);
      }

      if (formAvatarFile) formData.append("avatar", formAvatarFile);
      else if (isAvatarRemoved) formData.append("remove_avatar", "1");

      try {
        if (isEdit && editingUser) {
          await updateMut.mutateAsync({
            id: Number(editingUser.id),
            formData,
          });
        } else {
          await createMut.mutateAsync(formData);
        }
        setCreateDialogOpen(false);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [
      formName,
      formEmail,
      formPassword,
      formRoleId,
      formAvatarFile,
      isAvatarRemoved,
      isEdit,
      editingUser,
      assignableRoles,
      tenantId,
      updateMut,
      createMut,
    ],
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        await deleteMut.mutateAsync(Number(id));
      } catch (error) {
        console.error("Delete error:", error);
      }
    },
    [deleteMut],
  );

  const handleToggle = React.useCallback(
    async (id: string, currentStatus: boolean) => {
      try {
        await toggleMut.mutateAsync(Number(id));
      } catch (error) {
        console.error("Toggle error:", error);
      }
    },
    [toggleMut],
  );

  const getPrimaryRoleName = React.useCallback((u: any) => {
    if (u.role && typeof u.role === "string") {
      return u.role;
    }
    if (u.userRoles && Array.isArray(u.userRoles) && u.userRoles.length > 0) {
      return u.userRoles[0]?.role?.name || "Member";
    }
    return "Member";
  }, []);

  // --------------------------------------------------------------------------
  // 4. OPTIMIZED COLUMNS DEFINITION
  // --------------------------------------------------------------------------
  const columns = React.useMemo<ColumnDef<UserForClient>[]>(
    () => [
      {
        id: "serial_number",
        header: "#",
        size: 60,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {(page - 1) * pageSize + row.index + 1}
          </span>
        ),
        enableSorting: false,
        meta: {
          exportable: true,
          printable: true,
          exportValue: (_, index) => (page - 1) * pageSize + index + 1,
        },
      },
      {
        id: "name",
        accessorKey: "name",
        header: "User",
        enableSorting: true,
        cell: ({ row }) => {
          const u = row.original;
          const isSuper = isProtectedUser(u);
          return (
            <div className="flex items-center gap-3">
              <Avatar
                className={cn(
                  "h-9 w-9 border",
                  isSuper ? "border-amber-500/50" : "border-border",
                )}
              >
                <AvatarImage
                  src={u.avatarUrl || ""}
                  alt={u.name || "User"}
                  className="object-cover"
                />
                <AvatarFallback
                  className={cn(
                    "text-white text-[10px] font-bold",
                    isSuper
                      ? "bg-amber-600"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600",
                  )}
                >
                  {initials(u.name, u.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground leading-tight flex items-center gap-1.5 truncate">
                  {u.name || "Unknown User"}
                  {isSuper && (
                    <Shield className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {u.email}
                </span>
              </div>
            </div>
          );
        },
        meta: {
          exportable: true,
          printable: true,
          exportValue: (row) => row.name || "Unknown User",
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        enableSorting: true,
        meta: {
          exportable: true,
          printable: true,
        },
      },
      {
        id: "role",
        header: "Role",
        enableSorting: true,
        accessorFn: (row) => getPrimaryRoleName(row),
        cell: ({ row }) => {
          const roleName = getPrimaryRoleName(row.original);
          const variant = getRoleBadgeVariant(roleName);
          return (
            <Badge variant={variant} className="capitalize shadow-sm">
              {roleName}
            </Badge>
          );
        },
        meta: {
          exportable: true,
          printable: true,
          exportValue: (row) => getPrimaryRoleName(row),
        },
      },
      {
        id: "is_active",
        accessorKey: "isActive",
        header: "Status",
        enableSorting: true,
        cell: ({ row }) => {
          const u = row.original;
          const isSuper = isProtectedUser(u);
          return (
            <div className="flex items-center gap-2.5">
              <Switch
                checked={u.isActive}
                onCheckedChange={() => handleToggle(u.id, u.isActive)}
                disabled={toggleMut.isPending || isSuper}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                  u.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                )}
              >
                {u.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
        meta: {
          exportable: true,
          printable: true,
          exportValue: (row) => {
            if (
              (row as any).status &&
              typeof (row as any).status === "string"
            ) {
              return (row as any).status;
            }
            return row.isActive ? "Active" : "Inactive";
          },
        },
      },
      {
        id: "created_at",
        accessorKey: "createdAt",
        header: "Joined",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">
              {formatDate(row.original.createdAt)}
            </span>
          </div>
        ),
        meta: {
          exportable: true,
          printable: true,
          exportValue: (row) => {
            const dateValue = (row as any).joined || row.createdAt;
            try {
              const date = new Date(dateValue);
              return isNaN(date.getTime())
                ? ""
                : date.toISOString().split("T")[0];
            } catch {
              return "";
            }
          },
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => {
          const u = row.original;
          const isSuper = isProtectedUser(u);

          if (isSuper) {
            return (
              <div className="flex items-center justify-end h-8">
                <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-widest border border-amber-500/20 px-2 py-0.5 rounded-full select-none cursor-not-allowed">
                  Protected
                </span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => {
                  setViewUser(u);
                  setViewDialogOpen(true);
                }}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                onClick={() => openEdit(u)}
                title="Edit User"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <strong>{u.email}</strong>{" "}
                      and remove their data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleDelete(u.id)}
                    >
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
        meta: {
          exportable: false,
          printable: false,
        },
      },
    ],
    [
      page,
      pageSize,
      handleToggle,
      toggleMut.isPending,
      handleDelete,
      openEdit,
      isProtectedUser,
      initials,
      getPrimaryRoleName,
      getRoleBadgeVariant,
      formatDate,
    ],
  );

  // --------------------------------------------------------------------------
  // 5. RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCog className="h-5 w-5 text-indigo-500" />
            Team Members
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage access and roles for the {tenantName || "System"} workspace.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[130px] bg-background">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {assignableRoles.map((role: any) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-background border border-input rounded-md px-2 h-9 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Joined:
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-sm w-[110px] focus:outline-none"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-sm w-[110px] focus:outline-none"
              />
            </div>

            {(statusFilter !== "all" ||
              roleFilter !== "all" ||
              dateFrom ||
              dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                title="Reset all filters"
              >
                <X className="mr-1 h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <DataTable
          key={tableKey}
          columns={columns}
          data={usersData?.rows || []}
          totalEntries={usersData?.total || 0}
          loading={isLoading || isFetching}
          exportEndpoint={`/users/export?status=${statusFilter}&role=${roleFilter}&date_from=${dateFrom}&date_to=${dateTo}&search=${search}&sort_by=${sortCol || ""}&sort_direction=${sortDir || ""}&tenant_id=${tenantId || ""}`}
          resourceName="users"
          enableRowSelection={true}
          pageIndex={page}
          pageSize={pageSize}
          onQueryChange={handleQueryChange}
          onRefresh={handleRefresh}
          onDeleteRows={handleDeleteRows}
          searchPlaceholder="Filter by name or email..."
          companySettings={companySettings ?? undefined}
          brandingSettings={brandingSettings ?? undefined}
        />
      </div>

      {/* Dialogs - Create/Edit */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-5 border-b border-border/40 bg-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl"><div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><UserCog className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>{isEdit ? "Edit Profile" : "New Team Member"}</DialogTitle>
              <DialogDescription className="ml-10">{isEdit ? "Update user details." : "Invite a new user to collaborate."}</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-5">
                <div className={cn("relative group shrink-0 transition-all duration-200 cursor-pointer", isDragging && "scale-105 ring-4 ring-indigo-500/20 rounded-full")} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}>
                  <Avatar className={cn("h-20 w-20 border-2 border-dashed transition-colors", isDragging ? "border-indigo-500" : "border-border group-hover:border-indigo-500/50")}>
                    <AvatarImage src={formAvatarUrl || ""} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground"><ImageIcon className="h-8 w-8 opacity-50" /></AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"><Upload className="h-5 w-5 text-white" /></div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileInputChange} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">Profile Photo</h4>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 2MB.</p>
                  {formAvatarUrl && <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeAvatar(); }} className="h-7 px-2 text-xs text-red-500 hover:text-red-600 -ml-2">Remove Photo</Button>}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g. Sarah Connor" className="bg-muted/30" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required disabled={isEdit} placeholder="sarah@skynet.com" className="pl-9 bg-muted/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                  <Select value={formRoleId} onValueChange={setFormRoleId} required>
                    <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Select Role" /></SelectTrigger>
                    
                    {/* ✅ FIX: Dropdown opens strictly downwards & looks attractive */}
                    <SelectContent 
                      className="max-h-[200px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-xl" 
                      position="popper" 
                      side="bottom" 
                      align="start" 
                      sideOffset={4} 
                      avoidCollisions={false}
                    >
                      {assignableRoles.map((r: any) => (
                        <SelectItem key={r.id} value={r.id} className="focus:bg-indigo-50 dark:focus:bg-indigo-900/20 cursor-pointer py-2.5">
                          <div className="flex items-center gap-2">
                            {r.name}
                            <Badge variant="outline" className="text-[10px] h-4 px-1 border-indigo-200 text-indigo-700 bg-indigo-50">{r.scope}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password {isEdit && <span className="text-xs font-normal text-muted-foreground">(Optional)</span>}</Label>
                  <div className="relative">
                    {/* ✅ Password shows actual value if typed/generated, or "Unchanged" placeholder if empty in Edit mode */}
                    <Input id="password" type={showPassword ? "text" : "password"} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required={!isEdit} placeholder={isEdit ? "Unchanged" : "••••••••"} className="pr-9 bg-muted/30" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
              </div>
              
              {/* ✅ FIX: Generator visible in Edit mode too */}
              <div className="flex justify-end">
                <Button type="button" variant="link" size="sm" onClick={() => { setFormPassword(generateStrongPassword()); setShowPassword(true); }} className="h-auto p-0 text-xs text-indigo-600 gap-1.5">
                  <RefreshCw className="h-3 w-3" /> Generate Strong Password
                </Button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-lg">Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogs - View */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 h-24 w-full relative">
            <div className="absolute -bottom-8 left-6">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage
                  src={viewUser?.avatarUrl || ""}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                  {initials(viewUser?.name, viewUser?.email)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="pt-10 px-6 pb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground truncate">
                  {viewUser?.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground truncate">
                  {viewUser?.email}
                </DialogDescription>
              </div>
              <Badge
                variant={viewUser?.isActive ? "default" : "secondary"}
                className={
                  viewUser?.isActive
                    ? "bg-emerald-500 hover:bg-emerald-600 shrink-0"
                    : "shrink-0"
                }
              >
                {viewUser?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/50 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Role
                </p>
                <p className="font-semibold text-foreground flex items-center gap-2 truncate">
                  <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  {viewUser && getPrimaryRoleName(viewUser)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Joined
                </p>
                <p className="font-semibold text-foreground flex items-center gap-2 truncate">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {viewUser?.createdAt && formatDate(viewUser.createdAt)}
                </p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  User ID
                </p>
                <code className="text-xs bg-muted py-1 px-2 rounded block w-full overflow-hidden text-ellipsis">
                  {viewUser?.id}
                </code>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}