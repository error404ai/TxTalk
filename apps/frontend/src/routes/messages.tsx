import { createFileRoute } from "@tanstack/react-router";
import { MessagesDashboard } from "../components/MessagesDashboard";

export const Route = createFileRoute("/messages")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MessagesDashboard />;
}
