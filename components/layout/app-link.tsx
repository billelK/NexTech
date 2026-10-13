"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type AppLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  children?: ReactNode;
};

export function getStaticExportHref(currentRoute: string, targetRoute: string) {
  const currentSegments = currentRoute.split("/").filter(Boolean);
  const targetSegments = targetRoute.split("/").filter(Boolean);
  const currentDirectories = currentSegments.slice(0, -1);
  const targetDirectories = targetSegments.slice(0, -1);

  let sharedDirectoryCount = 0;
  while (
    sharedDirectoryCount < currentDirectories.length &&
    sharedDirectoryCount < targetDirectories.length &&
    currentDirectories[sharedDirectoryCount] ===
      targetDirectories[sharedDirectoryCount]
  ) {
    sharedDirectoryCount += 1;
  }

  const relativeDirectories = [
    ...currentDirectories
      .slice(sharedDirectoryCount)
      .map(() => ".."),
    ...targetDirectories.slice(sharedDirectoryCount),
  ];
  const targetName = targetSegments.at(-1) ?? "index";
  const targetFile = /\.[a-z0-9]+$/i.test(targetName)
    ? targetName
    : `${targetName}.html`;
  return `./${[...relativeDirectories, targetFile].join("/")}`;
}

export function AppLink({ href, children, ...props }: AppLinkProps) {
  const pathname = usePathname() ?? "/";

  if (process.env.NODE_ENV === "development") {
    return <Link href={href} {...props}>{children}</Link>;
  }

  return (
    <a href={getStaticExportHref(pathname, href)} {...props}>
      {children}
    </a>
  );
}
