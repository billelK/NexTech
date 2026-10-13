import { ArrowUpRight, Boxes, Store, Tags } from "lucide-react";
import { AppLink } from "@/components/layout/app-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

const settingsSections = [
  {
    title: "Store Information",
    description: "Manage the store name used on printed barcode stickers.",
    href: "/settings/store",
    icon: Store,
  },
  {
    title: "Categories",
    description: "Organize products into clear inventory categories.",
    href: "/settings/categories",
    icon: Tags,
  },
  {
    title: "Brands",
    description: "Manage the brands available when adding products.",
    href: "/settings/brands",
    icon: Boxes,
  },
];

export default function SettingsPage() {
  return (
    <main className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your store and organize your product catalog.
          </p>
        </header>

        <section
          aria-label="Settings sections"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {settingsSections.map(({ title, description, href, icon: Icon }) => (
            <AppLink
              key={href}
              href={href}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full gap-5 border-white/8 py-5 transition-colors group-hover:border-white/15 group-hover:bg-muted/30">
                <CardContent className="flex items-start gap-4 px-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-muted/50 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{title}</CardTitle>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                    <CardDescription className="mt-2 leading-relaxed">
                      {description}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </AppLink>
          ))}
        </section>
      </div>
    </main>
  );
}
