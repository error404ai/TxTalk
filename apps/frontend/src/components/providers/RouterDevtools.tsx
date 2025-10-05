import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";

export function RouterDevtools() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (import.meta.env.PROD || !mounted) {
    return null;
  }

  return <TanStackRouterDevtools />;
}
