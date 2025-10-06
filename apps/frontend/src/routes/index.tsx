import { createFileRoute } from "@tanstack/react-router";
import { SendMessage } from "../components/SendMessage";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  console.log("import.meta.env.VITE_API_URL", import.meta.env.VITE_API_URL);
  return <SendMessage />;
}
