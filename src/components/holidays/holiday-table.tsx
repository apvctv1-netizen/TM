"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

import {
  createHoliday,
  deleteHoliday,
  updateHoliday,
} from "@/app/(app)/holidays/actions";
import {
  holidayFormSchema,
  type HolidayFormInput,
  type HolidayFormValues,
} from "@/lib/validation/holiday.schema";
import { Button } from "@/components/ui/button";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CalendarDays } from "lucide-react";

type Holiday = {
  id: string;
  holiday_date: string;
  name: string;
};

function HolidayFormDialog({
  holiday,
  open,
  onOpenChange,
}: {
  holiday?: Holiday;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!holiday;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormInput, unknown, HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: holiday
      ? { holiday_date: holiday.holiday_date, name: holiday.name }
      : { holiday_date: "", name: "" },
  });

  async function onSubmit(values: HolidayFormValues) {
    const result = isEdit ? await updateHoliday(holiday.id, values) : await createHoliday(values);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(isEdit ? "Đã lưu thay đổi ngày lễ" : "Đã thêm ngày lễ mới");
    onOpenChange(false);
    reset({ holiday_date: "", name: "" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset(holiday ? { holiday_date: holiday.holiday_date, name: holiday.name } : { holiday_date: "", name: "" });
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Sửa ngày lễ" : "Thêm ngày lễ"}</DialogTitle>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.holiday_date}>
              <FieldLabel htmlFor="holiday_date">Ngày</FieldLabel>
              <Input
                id="holiday_date"
                type="date"
                aria-invalid={!!errors.holiday_date}
                {...register("holiday_date")}
              />
              <FieldError errors={errors.holiday_date ? [errors.holiday_date] : undefined} />
            </Field>

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Tên ngày lễ</FieldLabel>
              <Input id="name" placeholder="vd Ngày Quốc khánh" aria-invalid={!!errors.name} {...register("name")} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              {isEdit ? "Lưu thay đổi" : "Thêm ngày lễ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HolidayTable({ holidays }: { holidays: Holiday[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    startTransition(async () => {
      const result = await deleteHoliday(id);
      if (result.success) toast.success(`Đã xoá ngày lễ "${name}"`);
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
              Thêm ngày lễ
            </Button>
          </DialogTrigger>
        </Dialog>
        <HolidayFormDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>

      {holidays.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Chưa có ngày lễ nào</EmptyTitle>
            <EmptyDescription>Thêm ngày lễ để tính công làm ngày Lễ/Tết khi tổng hợp lương.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Tên ngày lễ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">
                    {format(parseISO(holiday.holiday_date), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(holiday)}>
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
                            <AlertDialogTitle>Xoá ngày lễ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn sắp xoá ngày lễ &quot;{holiday.name}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Huỷ</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(holiday.id, holiday.name)}
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
      )}

      {editing && (
        <HolidayFormDialog
          holiday={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
