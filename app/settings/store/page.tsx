"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { AppLink } from "@/components/layout/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StoreSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  
useEffect(() => {
  let active = true;

  async function loadStoreName() {
    try {
      const value = await window.electronAPI.getStoreName();

      if (active) {
        setStoreName(value);
      }
    } catch (cause: unknown) {
      if (active) {
        setError(
          cause instanceof Error
            ? cause.message
            : String(cause) || "Could not load application settings.",
        );
      }
    } finally {
      if (active) {
        setIsLoading(false);
      }
    }
  }

  void loadStoreName();

  return () => {
    active = false;
  };
}, []);


  console.log({ isLoading, isSaving, error });

  async function saveStoreName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const savedName = await window.electronAPI.setStoreName(storeName);
      setStoreName(savedName);
      setMessage("Store name saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save the store name.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Back to settings"
            nativeButton={false}
            render={<AppLink href="/settings" />}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Store Information
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure the store details used throughout NexTech.
            </p>
          </div>
        </header>

        <form
          onSubmit={(event) => void saveStoreName(event)}
          className="space-y-4 rounded-xl border bg-card p-5"
        >
          {isLoading && (
          <p role="status" className="text-sm text-yellow-500">
            Loading store settings...
          </p>
        )}
          <div>
            <h2 className="font-semibold">Barcode stickers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This name appears vertically along the left side of printed
              product stickers.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Store name
            <Input
              autoComplete="organization"
              maxLength={60}
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="Enter your store name"
              disabled={isLoading || isSaving}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
          <Button type="submit" disabled={isLoading || isSaving}>
            <Save />
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
        </form>
      </div>
    </main>
  );
}
