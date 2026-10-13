"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { CatalogEntry } from "@/electron/db/queries/catalog";
import { AppLink } from "@/components/layout/app-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CatalogPageKind = "categories" | "brands";

const PAGE_SIZE = 10;

function getErrorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

function fetchRecords(isCategory: boolean) {
  if (typeof window.electronAPI === "undefined") {
    return Promise.reject(
      new Error("Catalog settings are only available in the NexTech desktop app."),
    );
  }

  return isCategory
    ? window.electronAPI.getCategories()
    : window.electronAPI.getBrands();
}

export function CatalogManagementPage({
  kind,
}: {
  kind: CatalogPageKind;
}) {
  const isCategory = kind === "categories";
  const singularName = isCategory ? "category" : "brand";
  const pluralName = isCategory ? "categories" : "brands";
  const title = isCategory ? "Categories" : "Brands";

  const [records, setRecords] = useState<CatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CatalogEntry | null>(null);
  const [recordName, setRecordName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogEntry | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const nextRecords = await fetchRecords(isCategory);
      setRecords(nextRecords);
      setLoadError(null);
    } catch (cause) {
      setLoadError(
        getErrorMessage(cause, `Could not load ${pluralName}.`),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isCategory, pluralName]);

  useEffect(() => {
    let active = true;
    fetchRecords(isCategory)
      .then((nextRecords) => {
        if (active) setRecords(nextRecords);
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadError(
            getErrorMessage(cause, `Could not load ${pluralName}.`),
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isCategory, pluralName]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return records;
    return records.filter((record) =>
      record.name.toLowerCase().includes(normalizedSearch),
    );
  }, [records, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openCreateDialog() {
    setEditingRecord(null);
    setRecordName("");
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditDialog(record: CatalogEntry) {
    setEditingRecord(record);
    setRecordName(record.name);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeFormDialog(open: boolean) {
    setIsFormOpen(open);
    if (!open) {
      setEditingRecord(null);
      setRecordName("");
      setFormError(null);
    }
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = recordName.trim();
    if (!normalizedName) {
      setFormError(`Enter a ${singularName} name.`);
      return;
    }
    if (normalizedName.length > 60) {
      setFormError("Names must be 60 characters or fewer.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingRecord) {
        if (isCategory) {
          await window.electronAPI.updateCategory(
            editingRecord.id,
            normalizedName,
          );
        } else {
          await window.electronAPI.updateBrand(editingRecord.id, normalizedName);
        }
      } else if (isCategory) {
        await window.electronAPI.createCategory(normalizedName);
      } else {
        await window.electronAPI.createBrand(normalizedName);
      }

      closeFormDialog(false);
      setPage(1);
      setIsLoading(true);
      setLoadError(null);
      await loadRecords();
    } catch (cause) {
      setFormError(
        getErrorMessage(cause, `Could not save the ${singularName}.`),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (isCategory) {
        await window.electronAPI.deleteCategory(deleteTarget.id);
      } else {
        await window.electronAPI.deleteBrand(deleteTarget.id);
      }
      setDeleteTarget(null);
      setPage(1);
      setIsLoading(true);
      setLoadError(null);
      await loadRecords();
    } catch (cause) {
      setDeleteError(
        getErrorMessage(cause, `Could not delete the ${singularName}.`),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              View and manage the {pluralName} used in your product catalog.
            </p>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-col gap-3 border-b border-white/6 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={`Search ${pluralName}`}
                placeholder={`Search ${pluralName}...`}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
            <Button onClick={openCreateDialog}>
              <Plus />
              Add {singularName}
            </Button>
          </div>

          {loadError && (
            <div
              role="alert"
              className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                        onClick={() => {
                          setIsLoading(true);
                          setLoadError(null);
                          void loadRecords();
                        }}
              >
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              Loading {pluralName}...
            </p>
          ) : loadError && records.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {title} could not be displayed until they can be loaded.
            </p>
          ) : records.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-medium">No {pluralName} yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a {singularName} to make it available in your product
                catalog.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No {pluralName} match &quot;{search}&quot;.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{isCategory ? "Category" : "Brand"}</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${record.name}`}
                              onClick={() => openEditDialog(record)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${record.name}`}
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setDeleteTarget(record);
                                setDeleteError(null);
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredRecords.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-white/6 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}{" "}
                    of {filteredRecords.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Previous page"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft />
                    </Button>
                    <span className="min-w-16 text-center text-xs text-muted-foreground">
                      Page {currentPage} of {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Next page"
                      disabled={currentPage >= pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Dialog open={isFormOpen} onOpenChange={closeFormDialog}>
        <DialogContent>
          <form onSubmit={(event) => void saveRecord(event)} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {editingRecord
                  ? `Edit ${singularName}`
                  : `Add ${singularName}`}
              </DialogTitle>
              <DialogDescription>
                {editingRecord
                  ? `Update the name for this ${singularName}.`
                  : `Add a name for this ${singularName}.`}
              </DialogDescription>
            </DialogHeader>
            <label className="grid gap-2 text-sm font-medium">
              Name
              <Input
                autoFocus
                maxLength={60}
                value={recordName}
                onChange={(event) => setRecordName(event.target.value)}
                placeholder={`Enter ${singularName} name`}
                disabled={isSaving}
              />
            </label>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => closeFormDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {singularName}
              {deleteTarget ? ` "${deleteTarget.name}"` : ""}
              ?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. {isCategory ? "Categories" : "Brands"}{" "}
              assigned to products cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
