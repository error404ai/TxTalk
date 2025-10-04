import { createFileRoute } from "@tanstack/react-router";
import { SendMessage } from "../components/SendMessage";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <SendMessage />;
}
