"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductDeleteDialogProps = {
  product: { id: number; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => Promise<void>;
};

export function ProductDeleteDialog({
  product,
  onOpenChange,
  onDeleted,
}: ProductDeleteDialogProps) {
  const isOpen = product !== null;
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!product) return;

    setIsDeleting(true);
    try {
      await window.electronAPI.deleteProduct(product.id);
      await onDeleted();
      toast.success("Product deleted successfully.");
      onOpenChange(false);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not delete the product.";
      toast.error(`Product could not be deleted: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete product?</DialogTitle>
          <DialogDescription>
            {product
              ? `This permanently deletes ${product.name}, its specifications, and its stock movement history.`
              : "This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting || !product}
            onClick={() => void handleDelete()}
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
