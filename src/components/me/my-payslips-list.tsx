"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FieldSeparator } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PayrollEntry = {
  id: string;
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
  luong_theo_ctt: number;
  tien_tang_ca: number;
  tien_truc_le_tet: number;
  tien_nghi_le_tet: number;
  tien_ca_dem: number;
  tien_luong_che_do: number;
  tien_phep_nam: number;
  thuong_hoan_thanh: number;
  thuong_khuyen_khich: number;
  ho_tro_an_giua_ca: number;
  tien_thuong_cght_knn: number;
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
  payroll_periods: { period_year: number; period_month: number; status: string };
};

const numberFmt = new Intl.NumberFormat("vi-VN");

const CONG_FIELDS: { name: keyof PayrollEntry; label: string }[] = [
  { name: "standard_cong", label: "Công chuẩn" },
  { name: "ctt", label: "Tổng công (CTT)" },
  { name: "cong_chinh", label: "Công chính" },
  { name: "tang_ca", label: "Tăng ca" },
  { name: "cong_truc_le_tet", label: "Công trực Lễ/Tết" },
  { name: "cong_ca_dem", label: "Công ca đêm" },
  { name: "cong_che_do", label: "Công chế độ" },
  { name: "so_ngay_nghi_le_tet", label: "Số ngày nghỉ Lễ/Tết" },
  { name: "cong_ht_dao_tao", label: "Công HT đào tạo" },
  { name: "ngay_nghi_phep_nam", label: "Ngày nghỉ phép năm" },
  { name: "cght_knn", label: "Công CGHT/KNN" },
];

const INCOME_FIELDS: { name: keyof PayrollEntry; label: string }[] = [
  { name: "luong_theo_ctt", label: "Lương theo CTT" },
  { name: "tien_tang_ca", label: "Tiền tăng ca" },
  { name: "tien_truc_le_tet", label: "Tiền trực Lễ/Tết" },
  { name: "tien_nghi_le_tet", label: "Tiền nghỉ Lễ/Tết" },
  { name: "tien_ca_dem", label: "Tiền ca đêm" },
  { name: "tien_luong_che_do", label: "Tiền lương chế độ" },
  { name: "tien_phep_nam", label: "Tiền phép năm" },
  { name: "thuong_hoan_thanh", label: "Thưởng hoàn thành" },
  { name: "thuong_khuyen_khich", label: "Thưởng khuyến khích" },
  { name: "ho_tro_an_giua_ca", label: "Hỗ trợ ăn giữa ca" },
  { name: "tien_thuong_cght_knn", label: "Tiền thưởng CGHT/KNN" },
  { name: "tien_trach_nhiem", label: "Tiền trách nhiệm" },
  { name: "tien_hoc_viec", label: "Tiền học việc" },
  { name: "bo_sung_luong", label: "Bổ sung lương (+/-)" },
];

const DEDUCTION_FIELDS: { name: keyof PayrollEntry; label: string }[] = [
  { name: "tru_bhxh", label: "Trừ BHXH" },
  { name: "thu_ho", label: "Thu hộ" },
  { name: "thue_tncn", label: "Thuế TNCN" },
  { name: "truy_thu", label: "Truy thu" },
];

function DetailSheet({
  entry,
  open,
  onOpenChange,
}: {
  entry: PayrollEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Bảng lương tháng {entry.payroll_periods.period_month}/{entry.payroll_periods.period_year}
          </SheetTitle>
          <SheetDescription>Hợp đồng {entry.contract_type_snapshot}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Công</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {CONG_FIELDS.map((f) => (
                <div key={f.name} className="flex justify-between rounded bg-muted px-2 py-1">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{entry[f.name] as number}</span>
                </div>
              ))}
            </div>
          </div>

          <FieldSeparator />

          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Thu nhập</p>
            <div className="flex flex-col gap-1 text-sm">
              {INCOME_FIELDS.map((f) => (
                <div key={f.name} className="flex justify-between">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{numberFmt.format(entry[f.name] as number)}</span>
                </div>
              ))}
            </div>
          </div>

          <FieldSeparator />

          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Khấu trừ</p>
            <div className="flex flex-col gap-1 text-sm">
              {DEDUCTION_FIELDS.map((f) => (
                <div key={f.name} className="flex justify-between">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{numberFmt.format(entry[f.name] as number)}</span>
                </div>
              ))}
            </div>
          </div>

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
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MyPayslipsList({ entries }: { entries: PayrollEntry[] }) {
  const [selected, setSelected] = useState<PayrollEntry | null>(null);

  if (entries.length === 0) {
    return (
      <Empty className="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>Chưa có bảng lương nào</EmptyTitle>
          <EmptyDescription>Bảng lương sẽ hiển thị tại đây sau khi kỳ lương được khoá.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kỳ lương</TableHead>
            <TableHead>Hợp đồng</TableHead>
            <TableHead>Tổng công</TableHead>
            <TableHead>Thực lãnh</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                Tháng {entry.payroll_periods.period_month}/{entry.payroll_periods.period_year}
              </TableCell>
              <TableCell>{entry.contract_type_snapshot}</TableCell>
              <TableCell>{entry.ctt}</TableCell>
              <TableCell className="font-medium">{numberFmt.format(entry.tong_luong_nhan)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => setSelected(entry)}>
                  Xem chi tiết
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected && (
        <DetailSheet entry={selected} open={!!selected} onOpenChange={(open) => !open && setSelected(null)} />
      )}
    </div>
  );
}
