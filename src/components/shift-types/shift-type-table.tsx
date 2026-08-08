"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createShiftType,
  deleteShiftType,
  toggleShiftTypeActive,
  updateShiftType,
} from "@/app/(app)/shift-types/actions";
import {
  PARENT_GROUPS,
  shiftTypeFormSchema,
  type ShiftTypeFormInput,
  type ShiftTypeFormValues,
} from "@/lib/validation/shift-type.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ShiftType = {
  id: string;
  code: string;
  label: string;
  time_range: string | null;
  parent_group: string;
  work_unit_fraction: number;
  sort_order: number;
  is_active: boolean;
};

const groupLabels: Record<string, string> = {
  HC: "Hành chính",
  CA1: "Ca 1 (Sáng)",
  CA2: "Ca 2 (Chiều)",
  CA3: "Ca 3 (Đêm)",
};

function toDefaultValues(shiftType?: ShiftType): Partial<ShiftTypeFormInput> {
  if (!shiftType) {
    return { parent_group: "HC", is_active: true, sort_order: 0 };
  }
  return {
    code: shiftType.code,
    label: shiftType.label,
    time_range: shiftType.time_range ?? "",
    parent_group: shiftType.parent_group as ShiftTypeFormInput["parent_group"],
    work_unit_fraction: shiftType.work_unit_fraction,
    sort_order: shiftType.sort_order,
    is_active: shiftType.is_active,
  };
}

function ShiftTypeFormDialog({
  shiftType,
  open,
  onOpenChange,
}: {
  shiftType?: ShiftType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!shiftType;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftTypeFormInput, unknown, ShiftTypeFormValues>({
    resolver: zodResolver(shiftTypeFormSchema),
    defaultValues: toDefaultValues(shiftType),
  });

  async function onSubmit(values: ShiftTypeFormValues) {
    const result = isEdit
      ? await updateShiftType(shiftType.id, values)
      : await createShiftType(values);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(isEdit ? "Đã lưu thay đổi ca trực" : "Đã thêm ca trực mới");
    onOpenChange(false);
    reset(toDefaultValues());
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset(toDefaultValues(shiftType));
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Sửa ca trực" : "Thêm ca trực"}</DialogTitle>
          </DialogHeader>

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.code}>
              <FieldLabel htmlFor="code">Mã ca</FieldLabel>
              <Input id="code" disabled={isEdit} aria-invalid={!!errors.code} {...register("code")} />
              <FieldError errors={errors.code ? [errors.code] : undefined} />
            </Field>

            <Field data-invalid={!!errors.parent_group}>
              <FieldLabel htmlFor="parent_group">Nhóm ca</FieldLabel>
              <Controller
                control={control}
                name="parent_group"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="parent_group" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARENT_GROUPS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {groupLabels[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.parent_group ? [errors.parent_group] : undefined} />
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.label}>
              <FieldLabel htmlFor="label">Tên ca trực</FieldLabel>
              <Input id="label" aria-invalid={!!errors.label} {...register("label")} />
              <FieldError errors={errors.label ? [errors.label] : undefined} />
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.time_range}>
              <FieldLabel htmlFor="time_range">Khung giờ</FieldLabel>
              <Input id="time_range" placeholder="vd 06:00-14:00" {...register("time_range")} />
              <FieldError errors={errors.time_range ? [errors.time_range] : undefined} />
            </Field>

            <Field data-invalid={!!errors.work_unit_fraction}>
              <FieldLabel htmlFor="work_unit_fraction">Hệ số quy đổi công</FieldLabel>
              <Input
                id="work_unit_fraction"
                type="number"
                step="0.0001"
                aria-invalid={!!errors.work_unit_fraction}
                {...register("work_unit_fraction")}
              />
              <FieldError errors={errors.work_unit_fraction ? [errors.work_unit_fraction] : undefined} />
            </Field>

            <Field data-invalid={!!errors.sort_order}>
              <FieldLabel htmlFor="sort_order">Thứ tự hiển thị</FieldLabel>
              <Input id="sort_order" type="number" {...register("sort_order")} />
              <FieldError errors={errors.sort_order ? [errors.sort_order] : undefined} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Checkbox
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <FieldLabel htmlFor="is_active" className="font-normal">
                Đang sử dụng
              </FieldLabel>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              {isEdit ? "Lưu thay đổi" : "Thêm ca trực"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ShiftTypeTable({ shiftTypes }: { shiftTypes: ShiftType[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftType | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(shiftType: ShiftType) {
    startTransition(async () => {
      const result = await toggleShiftTypeActive(shiftType.id, !shiftType.is_active);
      if (!result.success) toast.error(result.message);
    });
  }

  function handleDelete(id: string, label: string) {
    startTransition(async () => {
      const result = await deleteShiftType(id);
      if (result.success) toast.success(`Đã xoá ca trực "${label}"`);
      else toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Thêm ca trực
            </Button>
          </DialogTrigger>
        </Dialog>
        <ShiftTypeFormDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã ca</TableHead>
              <TableHead>Tên ca trực</TableHead>
              <TableHead>Khung giờ</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Hệ số công</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shiftTypes.map((shiftType) => (
              <TableRow key={shiftType.id}>
                <TableCell className="font-medium">{shiftType.code}</TableCell>
                <TableCell>{shiftType.label}</TableCell>
                <TableCell className="text-muted-foreground">{shiftType.time_range || "—"}</TableCell>
                <TableCell>{groupLabels[shiftType.parent_group] ?? shiftType.parent_group}</TableCell>
                <TableCell>{shiftType.work_unit_fraction}</TableCell>
                <TableCell>
                  <Badge
                    variant={shiftType.is_active ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleToggleActive(shiftType)}
                  >
                    {shiftType.is_active ? "Đang dùng" : "Ngưng dùng"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(shiftType)}>
                      <Pencil />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm" disabled={isPending}>
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xoá ca trực?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn sắp xoá ca trực &quot;{shiftType.label}&quot; (mã {shiftType.code}). Không
                            thể xoá nếu ca này đã được dùng trong chấm công.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Huỷ</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(shiftType.id, shiftType.label)}
                          >
                            Xoá
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <ShiftTypeFormDialog
          shiftType={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
