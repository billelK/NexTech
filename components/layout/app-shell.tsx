"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  if (pathname.includes("/barcode-sticker")) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <AppHeader />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}