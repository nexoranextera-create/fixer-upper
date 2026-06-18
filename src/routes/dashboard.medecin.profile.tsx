import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/dashboard/ProfileView";

export const Route = createFileRoute("/dashboard/medecin/profile")({
  component: () => <ProfileView role="collab" />,
});
