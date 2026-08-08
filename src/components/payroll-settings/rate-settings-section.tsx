"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { createRateSettings, deleteRateSettings } from "@/app/(app)/payroll/settings/actions";
import {
  CONTRACT_TYPES,
  rateSettingsFormSchema,
  type RateSettingsFormInput,
  type RateSettingsFormValues,
} from "@/lib/validation/payroll-settings.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type RateSettings = {
  id: string;
  effective_from: string;
  contract_type: string;
  base_salary: number;
  overtime_multiplier: number;
  holiday_work_multiplier: number;
  night_shift_multiplier: number;
  holiday_off_pay_enabled: boolean;
  completion_bonus_amount: number;
};

const numberFmt = new Intl.NumberFormat("vi-VN");

function RateSettingsFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RateSettingsFormInput, unknown, RateSettingsFormValues>({
    resolver: zodResolver(rateSettingsFormSchema),
    defaultValues: {
      effective_from: "",
      contract_type: "CT",
      base_salary: 0,
      overtime_multiplier: 1.5,
      holiday_work_multiplier: 3,
      night_shift_multiplier: 0.3,
      holiday_off_pay_enabled: true,
      completion_bonus_amount: 200000,
    },
  });

  async function onSubmit(values: RateSettingsFormValues) {
    const result = await createRateSettings(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success("Đã thêm đơn giá mới");
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Thêm đơn giá theo hợp đồng</DialogTitle>
          </DialogHeader>

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.effective_from}>
              <FieldLabel htmlFor="effective_from">Ngày hiệu lực</FieldLabel>
              <Input id="effective_from" type="date" {...register("effective_from")} />
              <FieldError errors={errors.effective_from ? [errors.effective_from] : undefined} />
            </Field>

            <Field data-invalid={!!errors.contract_type}>
              <FieldLabel htmlFor="contract_type">Loại hợp đồng</FieldLabel>
              <Controller
                control={control}
                name="contract_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="contract_type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c === "CT" ? "Chính thức (CT)" : "Thời vụ (TV)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.contract_type ? [errors.contract_type] : undefined} />
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.base_salary}>
              <FieldLabel htmlFor="base_salary">Lương cơ bản</FieldLabel>
              <Input id="base_salary" type="number" step="1" {...register("base_salary")} />
              <FieldError errors={errors.base_salary ? [errors.base_salary] : undefined} />
            </Field>

            <Field data-invalid={!!errors.overtime_multiplier}>
              <FieldLabel htmlFor="overtime_multiplier">Hệ số làm thêm giờ</FieldLabel>
              <Input id="overtime_multiplier" type="number" step="0.01" {...register("overtime_multiplier")} />
              <FieldError errors={errors.overtime_multiplier ? [errors.overtime_multiplier] : undefined} />
            </Field>

            <Field data-invalid={!!errors.holiday_work_multiplier}>
              <FieldLabel htmlFor="holiday_work_multiplier">Hệ số làm ngày Lễ/Tết</FieldLabel>
              <Input
                id="holiday_work_multiplier"
                type="number"
                step="0.01"
                {...register("holiday_work_multiplier")}
              />
              <FieldError errors={errors.holiday_work_multiplier ? [errors.holiday_work_multiplier] : undefined} />
            </Field>

            <Field data-invalid={!!errors.night_shift_multiplier}>
              <FieldLabel htmlFor="night_shift_multiplier">Hệ số phụ cấp ca đêm</FieldLabel>
              <Input
                id="night_shift_multiplier"
                type="number"
                step="0.01"
                {...register("night_shift_multiplier")}
              />
              <FieldError errors={errors.night_shift_multiplier ? [errors.night_shift_multiplier] : undefined} />
            </Field>

            <Field data-invalid={!!errors.completion_bonus_amount}>
              <FieldLabel htmlFor="completion_bonus_amount">Thưởng hoàn thành công việc</FieldLabel>
              <Input
                id="completion_bonus_amount"
                type="number"
                step="1"
                {...register("completion_bonus_amount")}
              />
              <FieldError errors={errors.completion_bonus_amount ? [errors.completion_bonus_amount] : undefined} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                control={control}
                name="holiday_off_pay_enabled"
                render={({ field }) => (
                  <Checkbox
                    id="holiday_off_pay_enabled"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <FieldLabel htmlFor="holiday_off_pay_enabled" className="font-normal">
                Có tiền nghỉ Lễ/Tết
              </FieldLabel>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              Thêm đơn giá
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RateSettingsSection({ settings, canEdit }: { settings: RateSettings[]; canEdit: boolean }) {
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, label: string) {
    startTransition(async () => {
      const result = await deleteRateSettings(id);
      if (result.success) toast.success(`Đã xoá đơn giá ${label}`);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Đơn giá theo hợp đồng</CardTitle>
        {canEdit && (
          <>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              Thêm đơn giá
            </Button>
            <RateSettingsFormDialog open={addOpen} onOpenChange={setAddOpen} />
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hiệu lực từ</TableHead>
                <TableHead>Hợp đồng</TableHead>
                <TableHead>Lương cơ bản</TableHead>
                <TableHead>HS làm thêm</TableHead>
                <TableHead>HS ngày Lễ</TableHead>
                <TableHead>HS ca đêm</TableHead>
                <TableHead>Tiền nghỉ Lễ</TableHead>
                <TableHead>Thưởng HTCV</TableHead>
                {canEdit && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => {
                const label = `${s.contract_type} — ${format(parseISO(s.effective_from), "dd/MM/yyyy")}`;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{format(parseISO(s.effective_from), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.contract_type}</Badge>
                    </TableCell>
                    <TableCell>{numberFmt.format(s.base_salary)}</TableCell>
                    <TableCell>{s.overtime_multiplier}</TableCell>
                    <TableCell>{s.holiday_work_multiplier}</TableCell>
                    <TableCell>{s.night_shift_multiplier}</TableCell>
                    <TableCell>{s.holiday_off_pay_enabled ? "Có" : "Không"}</TableCell>
                    <TableCell>{numberFmt.format(s.completion_bonus_amount)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm" disabled={isPending}>
                              <Trash2 />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xoá đơn giá?</AlertDialogTitle>
                              <AlertDialogDescription>Xoá đơn giá {label}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Huỷ</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => handleDelete(s.id, label)}>
                                Xoá
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
