"use client";

import * as React from "react";

import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Columns as ColumnsIcon,
  Copy,
  Download,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  Column,
  ColumnDef,
  RowSelectionState,
  SortingState,
  Table as TanTable,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* -------------------- Types -------------------- */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    exportable?: boolean;
    printable?: boolean;
    exportValue?: (row: TData, index: number) => unknown;
    align?: "left" | "center" | "right";
  }
}

export type CompanySettingsInfo = {
  companyName?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  registrationNumber?: string;
};

export type BrandingSettingsInfo = {
  darkLogoUrl?: string;
};

/* -------------------- Hooks -------------------- */
function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Footer Component **/
const DataTableCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
DataTableCardFooter.displayName = "DataTableCardFooter";

/* -------------------- Column Header Component -------------------- */

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "-ml-3 h-8 data-[state=open]:bg-accent hover:bg-accent/50 group transition-all",
              column.getIsSorted()
                ? "text-foreground font-bold"
                : "text-muted-foreground"
            )}
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4 text-indigo-600 animate-in slide-in-from-top-1 fade-in duration-300" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4 text-indigo-600 animate-in slide-in-from-bottom-1 fade-in duration-300" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-50 transition-all duration-200" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Descending
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* -------------------- Helper Functions -------------------- */

function sortDataWithStickyTop(data: any[], idToPin = "1") {
  if (!Array.isArray(data)) return [];
  const pinned: any[] = [];
  const others: any[] = [];
  for (const row of data) {
    const rowId = String(row.id || row.user_id || row.uuid || "");
    if (rowId === idToPin) pinned.push(row);
    else others.push(row);
  }
  return [...pinned, ...others];
}

function getExportValue(
  rowOriginal: any,
  column: any,
  rowIndex: number
): string {
  const meta = column.columnDef.meta || {};
  const colId = column.id;
  const header =
    typeof column.columnDef.header === "string" ? column.columnDef.header : "";

  // 1. Custom Export Function
  if (typeof meta.exportValue === "function") {
    const result = meta.exportValue(rowOriginal, rowIndex);
    return result != null ? String(result) : "";
  }

  // 2. Try to get value from row
  let val: any;

  if (typeof column.columnDef.accessorFn === "function") {
    val = column.columnDef.accessorFn(rowOriginal);
  } else if (column.columnDef.accessorKey) {
    val = rowOriginal[column.columnDef.accessorKey];
  } else {
    val = rowOriginal[colId];
  }

  // 3. Handle dot notation
  if (val === undefined && colId.includes(".")) {
    val = colId
      .split(".")
      .reduce((o: any, i: any) => (o != null ? o[i] : undefined), rowOriginal);
  }

  if (val == null) return "";

  // 5. Handle dates
  const lowerHeader = header.toLowerCase();
  const lowerColId = colId.toLowerCase();

  const isDateColumn = [
    "joined",
    "created",
    "date",
    "updated",
    "created_at",
    "createdat",
  ].some((k) => lowerHeader.includes(k) || lowerColId.includes(k));

  if (isDateColumn) {
    try {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch {
      // Fall through
    }
  }

  // 6. Handle boolean status
  if (lowerColId.includes("status") || lowerHeader.includes("status")) {
    if (typeof val === "boolean") {
      return val ? "Active" : "Inactive";
    }
    if (val === "active" || val === "inactive") {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
  }

  // 7. Handle arrays
  if (Array.isArray(val)) {
    return val
      .map((v) => {
        if (typeof v === "object" && v != null) {
          return v.name || v.title || v.key || JSON.stringify(v);
        }
        return String(v);
      })
      .filter(Boolean)
      .join(", ");
  }

  // 8. Handle objects
  if (typeof val === "object" && val !== null) {
    return val.name || val.title || val.label || JSON.stringify(val);
  }

  return String(val);
}

function getPaginationRange(currentPage: number, totalPages: number) {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  range.push(1);
  if (totalPages <= 1) return range;

  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i < totalPages && i > 1) range.push(i);
  }
  range.push(totalPages);

  for (const i of range) {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1);
      else if (i - l !== 1) rangeWithDots.push("...");
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function printSimpleTable(
  dataRows: any[],
  title = "Table",
  companySettings?: CompanySettingsInfo,
  brandingSettings?: BrandingSettingsInfo
) {
  if (!dataRows || dataRows.length === 0) {
    toast.error("No data to print");
    return;
  }

  const thStyle =
    'style="text-align:left;padding:8px 12px;background:#f8f9fa;border-bottom:2px solid #ddd;font-size:12px;font-weight:bold;"';
  const tdStyle =
    'style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;vertical-align:top;"';

  const logo = brandingSettings?.darkLogoUrl
    ? `<img src="${brandingSettings.darkLogoUrl}" style="height:40px;" />`
    : "";

  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #eee;padding-bottom:10px;">
      <div>
        <h1 style="margin:0;font-size:20px;">${
          companySettings?.companyName || title
        }</h1>
        <p style="margin:5px 0 0;font-size:12px;color:#666;">Generated: ${new Date().toLocaleString()}</p>
      </div>
      ${logo}
    </div>
  `;

  const firstRow = dataRows[0];

  const keys = Object.keys(firstRow).filter(
    (key) =>
      ![
        "id",
        "serial_number",
        "avatar",
        "avatarUrl",
        "avatar_path",
        "user_id",
        "uuid",
        "roleId",
        "role_id",
      ].includes(key)
  );

  let headers = `<th ${thStyle}>#</th>`;
  headers += keys
    .map((key) => {
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `<th ${thStyle}>${label}</th>`;
    })
    .join("");

  const rows = dataRows
    .map((row, index) => {
      let cells = `<td ${tdStyle}>${index + 1}</td>`;
      cells += keys
        .map((key) => `<td ${tdStyle}>${row[key] ?? ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const printWindow = window.open("", "_blank");

  if (printWindow) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { word-wrap: break-word; font-size: 11px; }
            @media print { 
                .no-print { display: none; } 
                @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${headerHtml}
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    toast.error("Popup blocked! Please allow popups to print.");
  }
}

/* -------------------- MAIN COMPONENT -------------------- */

type SelectionChangePayload<TData> = {
  selectedRowIds: RowSelectionState;
  selectedRowsOnPage: TData[];
  selectedCountOnPage: number;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalEntries: number;
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onQueryChange: (q: any) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  serverSearchDebounceMs?: number;
  className?: string;
  enableRowSelection?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  selectedRowIds?: RowSelectionState;
  onSelectionChange?: (payload: SelectionChangePayload<TData>) => void;
  onDeleteRows?: (rows: TData[]) => Promise<void> | void;
  onRefresh?: () => void;
  companySettings?: CompanySettingsInfo;
  brandingSettings?: BrandingSettingsInfo;
  exportEndpoint?: string;
  resourceName?: string;
}

function DataTableInner<TData, TValue>({
  columns,
  data = [],
  totalEntries = 0,
  loading = false,
  pageIndex = 1,
  pageSize = 5,
  pageSizeOptions = [5, 10, 15, 25, 50, 100, 200],
  onQueryChange,
  title = "Table",
  description,
  searchPlaceholder = "Search...",
  serverSearchDebounceMs = 400,
  className,
  enableRowSelection = false,
  getRowId,
  selectedRowIds: controlledRowSelection,
  onSelectionChange,
  onDeleteRows,
  onRefresh,
  companySettings,
  brandingSettings,
  exportEndpoint,
}: DataTableProps<TData, TValue>) {
  // 1. STATE INITIALIZATION
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    {}
  );
  const [searchValue, setSearchValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const effectiveRowSelection = controlledRowSelection ?? rowSelection;

  const debouncedSearch = useDebouncedValue(
    searchValue,
    serverSearchDebounceMs
  );

  // Pagination Logic Safe Guards
  const safePageSize = pageSize > 0 ? pageSize : 10;
  const pageCount = Math.max(
    1,
    Math.ceil((totalEntries || 0) / safePageSize)
  );
  const pageIndex0 = Math.max(0, (pageIndex ?? 1) - 1);
  const currentPage = pageIndex0 + 1;
  
  const canPrev = pageIndex0 > 0;
  const canNext = pageIndex0 + 1 < pageCount;

  const selectedCount = Object.keys(effectiveRowSelection).length;
  const hasSelection = enableRowSelection && selectedCount > 0;

  // Track previous search to prevent infinite reset loops
  const prevSearchRef = React.useRef(debouncedSearch);

  React.useEffect(() => {
    // Only fire query change if search changes materially.
    // This check is crucial: without it, any prop change (like pagination)
    // triggers this effect if onQueryChange isn't memoized in parent,
    // resetting page to 1 constantly.
    if (prevSearchRef.current !== debouncedSearch) {
      prevSearchRef.current = debouncedSearch;
      onQueryChange({ page: 1, search: debouncedSearch?.trim() || "" });
    }
  }, [debouncedSearch, onQueryChange]);

  // 2. DEFINE COLUMNS AND TABLE
  const selectionColumn = React.useMemo<ColumnDef<TData, TValue>>(
    () => ({
      id: "select",
      enableSorting: false,
      enableHiding: false,
      size: 40,
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        </div>
      ),
      meta: { exportable: false, printable: false, align: "center" },
    }),
    []
  );

  const handleSortingChange = (updaterOrValue: any) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
    const sortRule = newSorting.length > 0 ? newSorting[0] : null;

    onQueryChange({
      page: 1,
      sortCol: sortRule?.id,
      sortDir: sortRule?.desc ? "desc" : "asc",
    });
  };

  const mergedColumns = React.useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [columns, enableRowSelection, selectionColumn]
  );

  const table = useReactTable({
    data,
    columns: mergedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection: enableRowSelection ? effectiveRowSelection : {},
      pagination: { pageIndex: pageIndex0, pageSize: safePageSize },
    },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater(effectiveRowSelection)
          : updater;
      if (!controlledRowSelection) setRowSelection(next);
      const rows = table
        .getRowModel()
        .rows.filter((r) => !!next[r.id])
        .map((r) => r.original);
      onSelectionChange?.({
        selectedRowIds: next,
        selectedRowsOnPage: rows,
        selectedCountOnPage: rows.length,
      });
    },
    getRowId: getRowId ?? ((row: any, i) => row.id ?? row.uuid ?? String(i)),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
  });

  // 3. DEFINE HANDLERS
  const handleDownload = React.useCallback(
    async (format: "csv" | "xlsx" | "pdf", fromSelection = false) => {
      if (!exportEndpoint) {
        toast.error("Export endpoint not configured.");
        return;
      }

      try {
        setBusy(true);
        const toastId = toast.loading(
          `Preparing ${format.toUpperCase()} export...`
        );

        const params: any = { type: format };
        if (debouncedSearch) params.search = debouncedSearch;

        if (sorting.length > 0) {
          params.sortCol = sorting[0].id;
          params.sortDir = sorting[0].desc ? "desc" : "asc";
        }

        if (fromSelection && Object.keys(effectiveRowSelection).length > 0) {
          params.ids = Object.keys(effectiveRowSelection).join(",");
        }

        const response = await api.get(exportEndpoint, {
          params,
          responseType: "blob",
        });

        const contentDisposition = response.headers["content-disposition"];
        let filename = `export_${new Date().toISOString().split("T")[0]}.${format}`;

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) filename = match[1];
        }

        downloadBlob(new Blob([response.data]), filename);
        toast.success("Download complete", { id: toastId });
      } catch (e: any) {
        console.error("Export error:", e);
        toast.error("Failed to download file.");
      } finally {
        setBusy(false);
      }
    },
    [exportEndpoint, debouncedSearch, sorting, effectiveRowSelection]
  );

  const handleCopy = React.useCallback(
    async (fromSelection = false) => {
      const cols = table
        .getAllLeafColumns()
        .filter(
          (c) =>
            c.getIsVisible() &&
            c.columnDef?.meta?.exportable !== false &&
            !["select", "actions"].includes(c.id)
        );

      const generateTextBlob = (dataRows: any[]) => {
        if (!dataRows || dataRows.length === 0) return "";

        const header = cols
          .map((c) =>
            typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
          )
          .join("\t");

        const lines = dataRows.map((row: any, i: number) =>
          cols
            .map((c) => {
              if (
                ["serial_number", "id", "uuid", "#"].includes(c.id)
              ) {
                return (i + 1).toString();
              }
              return getExportValue(row, c, i);
            })
            .join("\t")
        );

        return [header, ...lines].join("\n");
      };

      let rowsToCopy: any[] = [];
      if (fromSelection) {
        rowsToCopy = table.getSelectedRowModel().rows.map((r) => r.original);
      } else {
        rowsToCopy = data;
      }

      if (rowsToCopy.length > 0) {
        const sortedLocal = sortDataWithStickyTop(rowsToCopy, "1");
        const text = generateTextBlob(sortedLocal);
        try {
          await navigator.clipboard.writeText(text);
          toast.success(`Copied ${sortedLocal.length} rows`);
          return;
        } catch (err) {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          toast.success(`Copied ${sortedLocal.length} rows`);
          return;
        }
      }

      if (!exportEndpoint) {
        toast.error("No data available to copy");
        return;
      }

      try {
        setBusy(true);
        toast.loading("Fetching data...", { id: "copy-loading" });

        const params: any = { type: "copy" };
        if (debouncedSearch) params.search = debouncedSearch;

        if (sorting.length > 0) {
          params.sortCol = sorting[0].id;
          params.sortDir = sorting[0].desc ? "desc" : "asc";
        }

        if (fromSelection && Object.keys(effectiveRowSelection).length > 0) {
          params.ids = Object.keys(effectiveRowSelection).join(",");
        }

        const { data: res } = await api.get(exportEndpoint, { params });
        const rows = res.data || (Array.isArray(res) ? res : []);

        if (rows.length === 0) {
          toast.error("No data found", { id: "copy-loading" });
          return;
        }

        const sortedRows = sortDataWithStickyTop(rows, "1");
        const text = generateTextBlob(sortedRows);

        try {
          await navigator.clipboard.writeText(text);
          toast.success(`Copied ${sortedRows.length} rows`, {
            id: "copy-loading",
          });
        } catch (err) {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          toast.success(`Copied ${sortedRows.length} rows`, {
            id: "copy-loading",
          });
        }
      } catch (error) {
        console.error("Copy error:", error);
        toast.error("Failed to copy", { id: "copy-loading" });
      } finally {
        setBusy(false);
      }
    },
    [table, data, exportEndpoint, debouncedSearch, sorting, effectiveRowSelection]
  );

  const handlePrintClick = React.useCallback(
    async (fromSelection = false) => {
      if (!exportEndpoint) {
        let rowsToPrint = fromSelection
          ? table.getSelectedRowModel().rows.map((r) => r.original)
          : data;

        if (rowsToPrint.length === 0) {
          toast.error("No data to print");
          return;
        }

        const sortedRows = sortDataWithStickyTop(rowsToPrint, "1");
        printSimpleTable(
          sortedRows,
          title,
          companySettings,
          brandingSettings
        );
        return;
      }

      try {
        setBusy(true);
        toast.loading("Preparing print view...", { id: "print-toast" });

        const params: any = { type: "print" };
        if (debouncedSearch) params.search = debouncedSearch;

        if (sorting.length > 0) {
          params.sortCol = sorting[0].id;
          params.sortDir = sorting[0].desc ? "desc" : "asc";
        }

        if (fromSelection && Object.keys(effectiveRowSelection).length > 0) {
          params.ids = Object.keys(effectiveRowSelection).join(",");
        }

        const { data: res } = await api.get(exportEndpoint, { params });
        const rows = res.data || (Array.isArray(res) ? res : []);

        if (rows.length === 0) {
          toast.error("No data to print", { id: "print-toast" });
          return;
        }

        printSimpleTable(rows, title, companySettings, brandingSettings);
        toast.dismiss("print-toast");
      } catch (e) {
        console.error("Print error:", e);
        toast.error("Failed to load data for printing", {
          id: "print-toast",
        });
      } finally {
        setBusy(false);
      }
    },
    [
      table,
      data,
      exportEndpoint,
      debouncedSearch,
      sorting,
      effectiveRowSelection,
      title,
      companySettings,
      brandingSettings,
    ]
  );

  const handleDeleteSelected = React.useCallback(async () => {
    if (!onDeleteRows || !selectedCount) return;
    setBusy(true);
    try {
      // @ts-ignore
      await onDeleteRows(
        table.getSelectedRowModel().rows.map((r) => r.original)
      );
      setRowSelection({});
      onSelectionChange?.({
        selectedRowIds: {},
        selectedRowsOnPage: [],
        selectedCountOnPage: 0,
      });
    } finally {
      setBusy(false);
    }
  }, [onDeleteRows, selectedCount, table, onSelectionChange]);

  const handleResetAndReload = React.useCallback(() => {
    setSearchValue("");
    setSorting([]);
    setRowSelection({});
    onQueryChange({ page: 1, search: "", sortCol: null, sortDir: null });
    onSelectionChange?.({
      selectedRowIds: {},
      selectedRowsOnPage: [],
      selectedCountOnPage: 0,
    });
    onRefresh?.();
    toast.success("Table refreshed");
  }, [onQueryChange, onSelectionChange, onRefresh]);

  // 4. RENDER UI
  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {(title || description) && (
          <div className="p-6 border-b border-border">
            {title && (
              <h3 className="text-lg font-semibold leading-none tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9 w-full pl-9 bg-background/50 focus-visible:ring-1"
              />
              {!!searchValue && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchValue("")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Separator orientation="vertical" className="hidden h-6 sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 bg-background border-dashed"
                >
                  <ColumnsIcon className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-52 bg-popover z-[100] border border-border shadow-md"
              >
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllLeafColumns()
                  .filter(
                    (c) => c.getCanHide() && !["seq", "select"].includes(c.id)
                  )
                  .map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={c.getIsVisible()}
                      onCheckedChange={(v) => c.toggleVisibility(!!v)}
                      className="capitalize cursor-pointer"
                    >
                      {typeof c.columnDef.header === "string"
                        ? c.columnDef.header
                        : c.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
              <select
                className="h-9 w-16 rounded-md border border-input bg-background px-2 text-xs font-medium focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                value={pageSize}
                onChange={(e) => {
                  onQueryChange({
                    page: 1,
                    pageSize: Number(e.target.value),
                  });
                }}
                disabled={loading || busy}
                title="Rows per page"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasSelection && exportEndpoint && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleCopy(false)}
                  disabled={loading || busy}
                  title="Copy All"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={loading || busy}
                      title="Export"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-popover border border-border shadow-md z-[100]"
                  >
                    <DropdownMenuItem onClick={() => handleDownload("csv")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("xlsx")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handlePrintClick(false)}
                  disabled={loading || busy}
                  title="Print All"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-dashed"
              onClick={handleResetAndReload}
              disabled={loading || busy}
              title="Reload & Reset"
            >
              <RotateCcw
                className={cn(
                  "h-4 w-4",
                  (loading || busy) && "animate-spin-reverse"
                )}
              />
            </Button>
          </div>
        </div>

        <div className="relative border-t border-border">
          {(loading || busy) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[2px] transition-all duration-300">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-medium text-muted-foreground animate-pulse">
                  Updating...
                </span>
              </div>
            </div>
          )}

          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow
                    key={hg.id}
                    className="border-b hover:bg-transparent border-border/60"
                  >
                    {hg.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        className={cn(
                          "h-10 px-4",
                          h.column.columnDef.meta?.align === "center"
                            ? "text-center"
                            : ""
                        )}
                      >
                        <DataTableColumnHeader
                          column={h.column}
                          title={
                            typeof h.column.columnDef.header === "string"
                              ? h.column.columnDef.header
                              : ""
                          }
                        />
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && data.length === 0 ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {table.getAllLeafColumns().map((c) => (
                        <TableCell
                          key={`sk-${i}-${c.id}`}
                          className="px-4 py-3"
                        >
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group transition-colors border-b border-border/40 hover:bg-muted/30",
                        row.getIsSelected() && "bg-muted/10"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "px-4 py-3 align-middle text-sm",
                            cell.column.id === "select" && "px-2"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllLeafColumns().length || 1}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                          <Search className="h-6 w-6 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">
                          No results found.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DataTableCardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 px-6 border-t border-border bg-background/50">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing{" "}
              <span className="font-medium text-foreground">
                {totalEntries > 0 ? (pageIndex - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(pageIndex * pageSize, totalEntries)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {totalEntries}
              </span>{" "}
              entries
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-1.5 order-1 sm:order-2">
            <Button
              variant="outline"
              className="h-9 px-3 text-xs font-medium"
              onClick={() =>
                onQueryChange({ page: Math.max(1, currentPage - 1) })
              }
              disabled={!canPrev || loading || busy}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {getPaginationRange(pageIndex, pageCount).map(
                (pageNumber, idx) => {
                  if (pageNumber === "...")
                    return (
                      <div
                        key={`dots-${idx}`}
                        className="h-9 w-9 flex items-center justify-center text-sm text-muted-foreground select-none"
                      >
                        ...
                      </div>
                    );
                  const isCurrent = pageNumber === pageIndex;
                  return (
                    <Button
                      key={pageNumber}
                      variant={isCurrent ? "default" : "outline"}
                      className={cn(
                        "h-9 w-9 p-0 text-sm font-medium transition-all",
                        isCurrent
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 border-indigo-600"
                          : "text-muted-foreground hover:text-foreground hover:border-indigo-300"
                      )}
                      onClick={() =>
                        onQueryChange({ page: Number(pageNumber) })
                      }
                      disabled={loading || busy}
                    >
                      {pageNumber}
                    </Button>
                  );
                }
              )}
            </div>
            <Button
              variant="outline"
              className="h-9 px-3 text-xs font-medium"
              onClick={() =>
                onQueryChange({
                  page: Math.min(pageCount, currentPage + 1),
                })
              }
              disabled={!canNext || loading || busy}
            >
              Next
            </Button>
          </div>
        </DataTableCardFooter>
      </div>

      {hasSelection && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 backdrop-blur-xl p-2 pl-4 text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-50">
            <div className="flex items-center gap-2 border-r border-zinc-300 dark:border-zinc-700 pr-3">
              <span className="flex h-5 min-w-[1.25rem] px-1.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {selectedCount}
              </span>
              <span className="text-xs font-medium hidden sm:inline">
                Selected
              </span>
            </div>
            <div className="flex items-center gap-1">
              {exportEndpoint && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleCopy(true)}
                    disabled={loading || busy}
                    title="Copy Selected"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full text-xs"
                        disabled={loading || busy}
                      >
                        <Download className="mr-2 h-3.5 w-3.5" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      side="top"
                      className="mb-2 bg-popover border border-border shadow-md z-[110]"
                    >
                      <DropdownMenuItem
                        onClick={() => handleDownload("csv", true)}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload("xlsx", true)}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload("pdf", true)}
                      >
                        <FileText className="mr-2 h-4 w-4" /> PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-full text-xs"
                    onClick={() => handlePrintClick(true)}
                    disabled={loading || busy}
                  >
                    <Printer className="mr-2 h-3.5 w-3.5" /> Print
                  </Button>
                </>
              )}
              {onDeleteRows && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  onClick={handleDeleteSelected}
                  disabled={loading || busy}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full ml-1"
              onClick={() => {
                setRowSelection({});
                onSelectionChange?.({
                  selectedRowIds: {},
                  selectedRowsOnPage: [],
                  selectedCountOnPage: 0,
                });
              }}
              disabled={loading || busy}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ EXPORT MEMOIZED COMPONENT
export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;