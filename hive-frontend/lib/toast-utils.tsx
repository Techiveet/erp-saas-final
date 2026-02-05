import { toast } from "sonner";

type ToastMessages<T> = {
  loading: string;
  success: string | ((data: T) => React.ReactNode);
  error?: string | ((error: any) => React.ReactNode);
};

export async function actionToast<T>(
  promise: Promise<T>,
  messages: ToastMessages<T>
) {
  return toast.promise(promise, {
    // Sonner automatically adds a Spinner for loading
    loading: (
      <span className="font-medium text-foreground">{messages.loading}</span>
    ),
    
    // Sonner automatically adds a Green Check for success (because of richColors)
    success: (data) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground">Success</span>
        <span className="text-sm text-muted-foreground">
          {typeof messages.success === "function"
            ? messages.success(data)
            : messages.success}
        </span>
      </div>
    ),
    
    // Sonner automatically adds a Red X for error (because of richColors)
    error: (err) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground">Error</span>
        <span className="text-sm text-muted-foreground">
          {typeof messages.error === "function"
            ? messages.error(err)
            : messages.error || "Something went wrong"}
        </span>
      </div>
    ),
    
    // Global styling for the toast card
    className: "group border-border bg-background/95 backdrop-blur-md shadow-xl",
    duration: 4000,
  });
}