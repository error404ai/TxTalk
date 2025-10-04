import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../trpc/react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data, isLoading } = trpc.health.ping.useQuery();

  return <div>Index Page, Loading is {isLoading ? "true" : "false"}</div>;
}
