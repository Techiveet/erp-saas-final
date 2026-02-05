// hive-frontend/components/auth/logout-button.tsx
"use client";

import * as React from "react";

import { Loader2, LogOut, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
  mode?: "dropdown" | "sidebar"; // Defaults to 'dropdown'
  collapsed?: boolean;
}

export function LogoutButton({ 
  className, 
  mode = "dropdown", // <--- If you don't pass 'sidebar', this causes the crash!
  collapsed = false 
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async (event: React.SyntheticEvent | Event) => {
    // We removed event.preventDefault() so dropdowns close immediately on click
    
    if (isLoading) return;

    setIsLoading(true);

    // Push toast down so it doesn't overlap nav bars
    const toastId = toast.loading("Disconnecting from Hive...", {
      duration: Infinity,
      style: { marginTop: "60px" },
    });

    try {
      await logout();

      toast.success("See you next time!", { 
        id: toastId, 
        duration: 2000,
        style: { marginTop: "60px" } 
      });
      
      router.push("/sign-in"); 

    } catch (error: any) {
      console.error("Logout Error:", error);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("hive_token");
        localStorage.removeItem("user_data");
      }
      
      toast.error("Session cleared locally", { 
        id: toastId,
        style: { marginTop: "60px" }
      });
      
      router.push("/sign-in");
    } 
  };

  // ------------------------------------------------------------
  // MODE 1: SIDEBAR (Standard Button)
  // ------------------------------------------------------------
  if (mode === "sidebar") {
    return (
      <Button
        variant="ghost"
        onClick={handleLogout}
        disabled={isLoading}
        title="Sign Out"
        className={cn(
          "group relative w-full overflow-hidden transition-all duration-300",
          "rounded-2xl border border-transparent",
          "hover:bg-red-50 hover:border-red-100 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:border-red-900/20 dark:hover:text-red-400",
          collapsed ? "h-10 w-10 justify-center px-0" : "h-10 justify-start px-3",
          className
        )}
      >
        <div className="relative z-10 flex items-center">
            {isLoading ? (
            <Loader2 className={cn("animate-spin", collapsed ? "h-5 w-5" : "mr-3 h-4 w-4")} />
            ) : (
            <LogOut 
                className={cn(
                "transition-transform duration-300 group-hover:-translate-x-0.5",
                collapsed ? "h-5 w-5" : "mr-3 h-4 w-4"
                )} 
            />
            )}
            
            {!collapsed && (
            <span className="font-medium transition-opacity duration-300">
                {isLoading ? "Signing out..." : "Sign Out"}
            </span>
            )}
        </div>
      </Button>
    );
  }

  // ------------------------------------------------------------
  // MODE 2: DROPDOWN (Default Behavior)
  // ------------------------------------------------------------
  // If mode="dropdown" (or is missing), this runs. 
  // This fails if used outside a <DropdownMenu>!
  return (
    <DropdownMenuItem
      onSelect={handleLogout}
      disabled={isLoading}
      className={cn(
        "group cursor-pointer gap-2 p-2.5 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/20 dark:focus:text-red-400",
        className
      )}
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-border/50 bg-background transition-colors group-hover:border-red-200 group-hover:bg-red-100 dark:group-hover:border-red-900 dark:group-hover:bg-red-900/20",
        isLoading && "animate-pulse"
      )}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground group-hover:text-red-600" />
        ) : (
          <Power className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-red-600 dark:text-muted-foreground dark:group-hover:text-red-400" />
        )}
      </div>
      
      <div className="flex flex-col space-y-0.5">
         <span className="text-sm font-medium leading-none">
            Log out
         </span>
         <span className="text-[10px] text-muted-foreground group-hover:text-red-600/70">
            End session securely
         </span>
      </div>
    </DropdownMenuItem>
  );
}