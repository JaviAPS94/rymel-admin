import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link } from "wouter";
import { RymelUIProvider } from "@rymel/ui";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Los enlaces de @rymel/ui navegan con wouter. */}
    <RymelUIProvider linkComponent={({ href, ...props }) => <Link href={href} {...props} />}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </RymelUIProvider>
  </StrictMode>
);
