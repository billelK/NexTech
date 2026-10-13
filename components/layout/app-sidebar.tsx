"use client";

import { usePathname } from "next/navigation";
import {
  RefreshCw,
  Settings,
  Users,
  Layers
} from "lucide-react";
import {
  AppLink,
  getStaticExportHref,
} from "@/components/layout/app-link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  {
    title: "Inventory & Stock",
    href: "/inventory",
    icon: Layers,
  },
  {
    title: "Customers",
    href: "/Customers",
    icon: Users,
  },
  {
    title: "Resellers",
    href: "/resellers",
    icon: RefreshCw,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const logoSrc =
    process.env.NODE_ENV === "development"
      ? "/logo_app_white.png"
      : getStaticExportHref(pathname ?? "/", "/logo_app_white.png");

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/6"
    >
      <SidebarHeader className="border-b border-white/0 p-4 group-data-[collapsible=icon]:p-2">
        <AppLink
          href="/inventory"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black text-primary-foreground group-data-[collapsible=icon]:size-8">
            <img
              src={logoSrc}
              alt="NexTech logo"
              className="object-cover h-[25px] w-[25px]"
            />
          </div>

          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">
              NexTech
            </span>

            <span className="truncate text-xs text-muted-foreground">
              Management System
            </span>
          </div>
        </AppLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Main
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuButton
                    key={item.href}
                    render={
                      <AppLink href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </AppLink>
                    }
                    isActive={isActive}
                    tooltip={item.title}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.06] p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
                    render={
                    <AppLink href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </AppLink>
                    }
                    
                  />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}