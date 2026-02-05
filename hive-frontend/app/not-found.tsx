import { WorkspaceNotFound } from "@/components/auth/workspace-not-found";

export default function GlobalNotFound() {
  return (
    <WorkspaceNotFound 
      title="Page Not Found"
      message="The page you are looking for does not exist."
    />
  );
}