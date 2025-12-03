"use client";

import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <TopNav />
      <main className="container mx-auto px-4 py-6">{children}</main>
      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          This is not investment advice. Data is fetched via public sources and
          may be inaccurate or delayed. Please verify before investing.
        </p>
      </footer>
    </div>
  );
}

