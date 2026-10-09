"use client"

import { Button } from "@/components/ui/button"
import {LayersPlus} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const fieldClassName =
  "flex flex-col gap-1.5 text-sm font-medium"

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function AddProductDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <LayersPlus className="size-4" />
        Add product
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Enter the product details. Product saving is not connected yet.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 sm:grid-cols-2">
          <label className={`${fieldClassName} sm:col-span-2`}>
            Product name
            <Input name="name" placeholder="e.g. NexTech Pro Laptop" required />
          </label>

          <label className={fieldClassName}>
            Brand
            <Input name="brand" placeholder="e.g. Lenovo" required />
          </label>

          <label className={fieldClassName}>
            Category
            <Input name="category" placeholder="e.g. Laptops" required />
          </label>

          <label className={fieldClassName}>
            Barcode
            <Input name="barcode" placeholder="Optional" />
          </label>

          <label className={fieldClassName}>
            Tracking type
            <select
              className={selectClassName}
              defaultValue="QUANTITY"
              name="trackingType"
              required
            >
              <option value="QUANTITY">Quantity</option>
              <option value="SERIALIZED">Serialized</option>
            </select>
          </label>

          <label className={fieldClassName}>
            Quantity
            <Input
              defaultValue={0}
              min={0}
              name="quantity"
              type="number"
              required
            />
          </label>

          <label className={fieldClassName}>
            Cost price
            <Input min={0} name="costPrice" type="number" required />
          </label>

          <label className={fieldClassName}>
            Selling price
            <Input min={0} name="sellingPrice" type="number" required />
          </label>

          <label className={`${fieldClassName} sm:col-span-2`}>
            Status
            <select
              className={selectClassName}
              defaultValue=""
              name="status"
            >
              <option value="">No status</option>
              <option value="AVAILABLE">Available</option>
              <option value="HELD">Held</option>
              <option value="SOLD">Sold</option>
            </select>
          </label>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled type="button">
            Add product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
