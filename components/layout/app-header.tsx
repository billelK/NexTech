"use client";

import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-white/6 bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
      </div>

      <div className="ml-4 hidden w-full max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search..."
            className="h-9 border-white/6 border bg-background pl-9"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
        >
          <Bell />
          <span className="sr-only">
            Notifications
          </span>
        </Button>

        <Separator
          orientation="vertical"
          className="mx-1 h-6"
        />

        <Avatar className="size-8">
          <AvatarFallback>
            H
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}