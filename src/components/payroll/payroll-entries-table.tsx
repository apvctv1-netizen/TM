"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, Pencil } from "lucide-react";

import { updatePayrollEntry } from "@/app/(app)/payroll/[periodId]/actions";
import {
  payrollEntryFormSchema,
  type PayrollEntryFormInput,
  type PayrollEntryFormValues,
} from "@/lib/validation/payroll-entry.schema";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Wallet } from "lucide-react";

type PayrollEntry = {
  id: string;
  employee_id: string;
  contract_type_snapshot: string;
  standard_cong: number;
  ctt: number;
  cong_chinh: number;
  tang_ca: number;
  cong_truc_le_tet: number;
  cong_ca_dem: number;
  cong_che_do: number;
  so_ngay_nghi_le_tet: number;
  cong_ht_dao_tao: number;
  ngay_nghi_phep_nam: number;
  cght_knn: number;
  tien_trach_nhiem: number;
  tien_hoc_viec: number;
  bo_sung_luong: number;
  tru_bhxh: number;
  thu_ho: number;
  thue_tncn: number;
  truy_thu: number;
  tong_luong: number;
  tong_khau_tru: number;
  tong_luong_nhan: number;
  employees: { full_name: string; employee_code: number } | null;
};

const numberFmt = new Intl.NumberFormat("vi-VN");

const MANUAL_CONG_FIELDS: { name: keyof PayrollEntryFormValues; label: string }[] = [
  { name: "cong_che_do", label: "Công chế độ" },
  { name: "so_ngay_nghi_le_tet", label: "Số ngày nghỉ Lễ/Tết" },
  { name: "cong_ht_dao_tao", label: "Công HT đào tạo" },
  { name: "ngay_nghi_phep_nam", label: "Ngày nghỉ phép năm" },
  { name: "cght_knn", label: "Công CGHT/KNN" },
];

const MANUAL_TIEN_FIELDS: { name: keyof PayrollEntryFormValues; label: string }[] = [
  { name: "tien_trach_nhiem", label: "Tiền trách nhiệm" },
  { name: "tien_hoc_viec", label: "Tiền học việc" },
  { name: "bo_sung_luong", label: "Bổ sung lương (+/-)" },
  { name: "tru_bhxh", label: "Trừ BHXH" },
  { name: "thu_ho", label: "Thu hộ" },
  { name: "thue_tncn", label: "Thuế TNCN" },
  { name: "truy_thu", label: "Truy thu" },
];

function AUTO_CONG_FIELDS(entry: PayrollEntry) {
  return [
    { label: "Công chuẩn", value: entry.standard_cong },
    { label: "Tổng công (CTT)", value: entry.ctt },
    { label: "Công chính", value: entry.cong_chinh },
    { label: "Tăng ca", value: entry.tang_ca },
    { label: "Công trực Lễ/Tết", value: entry.cong_truc_le_tet },
    { label: "Công ca đêm", value: entry.cong_ca_dem },
  ];
}

function EntrySheet({
  entry,
  periodId,
  canEdit,
  open,
  onOpenChange,
}: {
  entry: PayrollEntry;
  periodId: string;
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayrollEntryFormInput, unknown, PayrollEntryFormValues>({
    resolver: zodResolver(payrollEntryFormSchema),
    defaultValues: {
      cong_che_do: entry.cong_che_do,
      so_ngay_nghi_le_tet: entry.so_ngay_nghi_le_tet,
      cong_ht_dao_tao: entry.cong_ht_dao_tao,
      ngay_nghi_phep_nam: entry.ngay_nghi_phep_nam,
      cght_knn: entry.cght_knn,
      tien_trach_nhiem: entry.tien_trach_nhiem,
      tien_hoc_viec: entry.tien_hoc_viec,
      bo_sung_luong: entry.bo_sung_luong,
      tru_bhxh: entry.tru_bhxh,
      thu_ho: entry.thu_ho,
      thue_tncn: entry.thue_tncn,
      truy_thu: entry.truy_thu,
    },
  });

  async function onSubmit(values: PayrollEntryFormValues) {
    const result = await updatePayrollEntry(entry.id, periodId, values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success("Đã lưu bảng lương");
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{entry.employees?.full_name ?? "Nhân viên"}</SheetTitle>
          <SheetDescription>
            {entry.employees?.employee_code} — Hợp đồng {entry.contract_type_snapshot}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 px-4 pb-4">
          <fieldset disabled={!canEdit || isSubmitting} className="contents">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Công tự động (từ chấm công)</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {AUTO_CONG_FIELDS(entry).map((f) => (
                  <div key={f.label} className="flex justify-between rounded bg-muted px-2 py-1">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <FieldSeparator />

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Công nhập tay</p>
              <FieldGroup className="gap-3">
                {MANUAL_CONG_FIELDS.map((f) => (
                  <Field key={f.name} orientation="horizontal" data-invalid={!!errors[f.name]}>
                    <FieldLabel htmlFor={f.name} className="flex-1 font-normal">
                      {f.label}
                    </FieldLabel>
                    <Input
                      id={f.name}
                      type="number"
                      step="0.01"
                      className="w-28"
                      {...register(f.name)}
                    />
                    <FieldError errors={errors[f.name] ? [errors[f.name]] : undefined} />
                  </Field>
                ))}
              </FieldGroup>
            </div>

            <FieldSeparator />

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Tiền nhập tay</p>
              <FieldGroup className="gap-3">
                {MANUAL_TIEN_FIELDS.map((f) => (
                  <Field key={f.name} orientation="horizontal" data-invalid={!!errors[f.name]}>
                    <FieldLabel htmlFor={f.name} className="flex-1 font-normal">
                      {f.label}
                    </FieldLabel>
                    <Input
                      id={f.name}
                      type="number"
                      step="1"
                      className="w-32"
                      {...register(f.name)}
                    />
                    <FieldError errors={errors[f.name] ? [errors[f.name]] : undefined} />
                  </Field>
                ))}
              </FieldGroup>
            </div>
          </fieldset>

          <FieldSeparator />

          <div className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng lương</span>
              <span className="font-medium">{numberFmt.format(entry.tong_luong)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng khấu trừ</span>
              <span className="font-medium">{numberFmt.format(entry.tong_khau_tru)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Thực lãnh</span>
              <span>{numberFmt.format(entry.tong_luong_nhan)}</span>
            </div>
          </div>

          {canEdit && (
            <SheetFooter className="p-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="mr-2 size-4" />}
                Lưu thay đổi
              </Button>
            </SheetFooter>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function PayrollEntriesTable({
  periodId,
  entries,
  canEdit,
}: {
  periodId: string;
  entries: PayrollEntry[];
  canEdit: boolean;
}) {
  const [selected, setSelected] = useState<PayrollEntry | null>(null);
  const [, startTransition] = useTransition();

  if (entries.length === 0) {
    return (
      <Empty className="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>Chưa có dữ liệu lương cho kỳ này</EmptyTitle>
          <EmptyDescription>Quay lại trang Bảng lương và bấm &quot;Tính lương&quot;.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-bold">Mã NV</TableHead>
            <TableHead className="font-bold">Họ tên</TableHead>
            <TableHead className="font-bold">Hợp đồng</TableHead>
            <TableHead className="font-bold">Tổng công</TableHead>
            <TableHead className="font-bold">Tổng lương</TableHead>
            <TableHead className="font-bold">Khấu trừ</TableHead>
            <TableHead className="font-bold">Thực lãnh</TableHead>
            <TableHead className="text-right font-bold">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.employees?.employee_code}</TableCell>
              <TableCell
                className="cursor-pointer font-medium hover:text-primary hover:underline"
                onClick={() => startTransition(() => setSelected(entry))}
              >
                {entry.employees?.full_name}
              </TableCell>
              <TableCell>{entry.contract_type_snapshot}</TableCell>
              <TableCell>{entry.ctt}</TableCell>
              <TableCell>{numberFmt.format(entry.tong_luong)}</TableCell>
              <TableCell>{numberFmt.format(entry.tong_khau_tru)}</TableCell>
              <TableCell className="font-medium">{numberFmt.format(entry.tong_luong_nhan)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startTransition(() => setSelected(entry))}
                >
                  {canEdit ? <Pencil /> : <Eye />}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected && (
        <EntrySheet
          entry={selected}
          periodId={periodId}
          canEdit={canEdit}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </div>
  );
}
