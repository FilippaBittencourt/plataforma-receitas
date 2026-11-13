import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compartilhar")({
  beforeLoad: () => {
    throw redirect({ to: "/publicar", search: { origem: "externa" } });
  },
});
