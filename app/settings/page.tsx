"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    window.electronAPI
      .getStoreName()
      .then((value) => {
        if (active) setStoreName(value);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load application settings.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveStoreName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const savedName = await window.electronAPI.setStoreName(storeName);
      setStoreName(savedName);
      setMessage("Shop name saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save the shop name.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Back to inventory"
          nativeButton={false}
          render={<Link href="/inventory" />}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure store information.</p>
        </div>
      </div>

      <form onSubmit={(event) => void saveStoreName(event)} className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Barcode stickers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This name appears vertically along the left side of printed product stickers.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Shop name
          <Input
            autoComplete="organization"
            maxLength={60}
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="Enter your shop name"
            disabled={isLoading || isSaving}
          />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" disabled={isLoading || isSaving}>
          <Save />
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
      </form>
    </main>
  );
}
