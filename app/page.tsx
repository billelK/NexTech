"use client";

import { useEffect, useState } from "react";

type AppInfo = {
  name: string;
  platform: NodeJS.Platform;
};

export default function Home() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
  let cancelled = false;

  const loadAppInfo = async () => {
    if (!window.electronAPI) {
      return;
    }

    const info = window.electronAPI.getAppInfo();

    if (!cancelled) {
      setAppInfo(info);
    }
  };

  void loadAppInfo();

  return () => {
    cancelled = true;
  };
}, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">NexTech</h1>

        <p className="mt-2 text-muted-foreground">
          Management System
        </p>

        {appInfo && (
          <div className="mt-6 rounded-lg border p-4 text-left">
            <p>
              <strong>Application:</strong> {appInfo.name}
            </p>

            <p>
              <strong>Platform:</strong> {appInfo.platform}
            </p>

            <p className="mt-2 text-sm text-green-600">
              ✓ Electron communication working
            </p>
          </div>
        )}
      </div>
    </main>
  );
}