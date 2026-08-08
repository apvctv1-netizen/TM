"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { createGlobalSettings, deleteGlobalSettings } from "@/app/(app)/payroll/settings/actions";
import {
  globalSettingsFormSchema,
  type GlobalSettingsFormInput,
  type GlobalSettingsFormValues,
} from "@/lib/validation/payroll-settings.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type GlobalSettings = {
  id: string;
  effective_from: string;
  standard_cong: number;
  incentive_bonus_threshold_cong: number;
  incentive_bonus_rate: number;
  meal_allowance_rate: number;
  cght_knn_rate: number;
  social_insurance_rate: number;
};

const numberFmt = new Intl.NumberFormat("vi-VN");

function GlobalSettingsFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GlobalSettingsFormInput, unknown, GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsFormSchema),
    defaultValues: {
      effective_from: "",
      standard_cong: 26,
      incentive_bonus_threshold_cong: 25,
      incentive_bonus_rate: 16000,
      meal_allowance_rate: 30000,
      cght_knn_rate: 50000,
      social_insurance_rate: 0.105,
    },
  });

  async function onSubmit(values: GlobalSettingsFormValues) {
    const result = await createGlobalSettings(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success("Đã thêm cấu hình chung mới");
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Thêm cấu hình chung</DialogTitle>
          </DialogHeader>

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" data-invalid={!!errors.effective_from}>
              <FieldLabel htmlFor="effective_from">Ngày hiệu lực</FieldLabel>
              <Input id="effective_from" type="date" {...register("effective_from")} />
              <FieldError errors={errors.effective_from ? [errors.effective_from] : undefined} />
            </Field>

            <Field data-invalid={!!errors.standard_cong}>
              <FieldLabel htmlFor="standard_cong">Công chuẩn/tháng</FieldLabel>
              <Input id="standard_cong" type="number" step="0.01" {...register("standard_cong")} />
              <FieldError errors={errors.standard_cong ? [errors.standard_cong] : undefined} />
            </Field>

            <Field data-invalid={!!errors.incentive_bonus_threshold_cong}>
              <FieldLabel htmlFor="incentive_bonus_threshold_cong">Ngưỡng công thưởng chuyên cần</FieldLabel>
              <Input
                id="incentive_bonus_threshold_cong"
                type="number"
                step="0.01"
                {...register("incentive_bonus_threshold_cong")}
              />
              <FieldError
                errors={errors.incentive_bonus_threshold_cong ? [errors.incentive_bonus_threshold_cong] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.incentive_bonus_rate}>
              <FieldLabel htmlFor="incentive_bonus_rate">Đơn giá thưởng chuyên cần (đ/công)</FieldLabel>
              <Input id="incentive_bonus_rate" type="number" step="1" {...register("incentive_bonus_rate")} />
              <FieldError errors={errors.incentive_bonus_rate ? [errors.incentive_bonus_rate] : undefined} />
            </Field>

            <Field data-invalid={!!errors.meal_allowance_rate}>
              <FieldLabel htmlFor="meal_allowance_rate">Phụ cấp ăn ca (đ/công)</FieldLabel>
              <Input id="meal_allowance_rate" type="number" step="1" {...register("meal_allowance_rate")} />
              <FieldError errors={errors.meal_allowance_rate ? [errors.meal_allowance_rate] : undefined} />
            </Field>

            <Field data-invalid={!!errors.cght_knn_rate}>
              <FieldLabel htmlFor="cght_knn_rate">Phụ cấp CGHT/KNN (đ/công)</FieldLabel>
              <Input id="cght_knn_rate" type="number" step="1" {...register("cght_knn_rate")} />
              <FieldError errors={errors.cght_knn_rate ? [errors.cght_knn_rate] : undefined} />
            </Field>

            <Field data-invalid={!!errors.social_insurance_rate}>
              <FieldLabel htmlFor="social_insurance_rate">Tỉ lệ BHXH (vd 0.105)</FieldLabel>
              <Input id="social_insurance_rate" type="number" step="0.0001" {...register("social_insurance_rate")} />
              <FieldError errors={errors.social_insurance_rate ? [errors.social_insurance_rate] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              Thêm cấu hình
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GlobalSettingsSection({ settings, canEdit }: { settings: GlobalSettings[]; canEdit: boolean }) {
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, effectiveFrom: string) {
    startTransition(async () => {
      const result = await deleteGlobalSettings(id);
      if (result.success) toast.success(`Đã xoá cấu hình hiệu lực từ ${effectiveFrom}`);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cấu hình chung</CardTitle>
        {canEdit && (
          <>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              Thêm cấu hình
            </Button>
            <GlobalSettingsFormDialog open={addOpen} onOpenChange={setAddOpen} />
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hiệu lực từ</TableHead>
                <TableHead>Công chuẩn</TableHead>
                <TableHead>Ngưỡng thưởng CC</TableHead>
                <TableHead>Đơn giá thưởng CC</TableHead>
                <TableHead>Phụ cấp ăn ca</TableHead>
                <TableHead>Phụ cấp CGHT/KNN</TableHead>
                <TableHead>Tỉ lệ BHXH</TableHead>
                {canEdit && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{format(parseISO(s.effective_from), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{s.standard_cong}</TableCell>
                  <TableCell>{s.incentive_bonus_threshold_cong}</TableCell>
                  <TableCell>{numberFmt.format(s.incentive_bonus_rate)}</TableCell>
                  <TableCell>{numberFmt.format(s.meal_allowance_rate)}</TableCell>
                  <TableCell>{numberFmt.format(s.cght_knn_rate)}</TableCell>
                  <TableCell>{(s.social_insurance_rate * 100).toFixed(2)}%</TableCell>
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
                            <AlertDialogTitle>Xoá cấu hình?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Xoá cấu hình hiệu lực từ {format(parseISO(s.effective_from), "dd/MM/yyyy")}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Huỷ</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(s.id, format(parseISO(s.effective_from), "dd/MM/yyyy"))}
                            >
                              Xoá
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
