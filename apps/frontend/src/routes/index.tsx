import type { AppRouter } from "@solmessage/api/router";
import { createFileRoute } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "../trpc/react";

type MessageListItem = inferRouterOutputs<AppRouter>["messages"]["list"][number];

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data, isLoading } = trpc.messages.list.useQuery();

  if (isLoading) {
    return <div style={{ padding: "0.5rem" }}>Loading messages…</div>;
  }

  const messages: MessageListItem[] = data ?? [];

  return (
    <div style={{ padding: "1rem", display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.5rem" }}>solMessage starter</h1>
        <p style={{ color: "#475569", maxWidth: "42rem" }}>This page uses tRPC to fetch seeded data from the Hono API. Replace it with your own feature logic when you're ready.</p>
      </header>
      <ul style={{ display: "grid", gap: "0.75rem", padding: 0, listStyle: "none" }}>
        {messages.map((message) => (
          <li
            key={message.id}
            style={{
              border: "1px solid #cbd5f5",
              borderRadius: "0.75rem",
              padding: "1rem",
              boxShadow: "0 8px 30px rgba(15, 23, 42, 0.07)",
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{message.title}</h2>
            {message.body ? <p style={{ color: "#475569", marginTop: "0.4rem" }}>{message.body}</p> : null}
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.75rem" }}>Created at {new Date(message.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
