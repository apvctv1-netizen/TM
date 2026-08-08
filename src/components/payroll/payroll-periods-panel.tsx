"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, LockOpen, Wallet } from "lucide-react";

import { calculatePayrollPeriod, setPeriodLocked } from "@/app/(app)/payroll/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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

type Period = {
  id: string;
  period_year: number;
  period_month: number;
  status: string;
};

export function PayrollPeriodsPanel({ periods, canEdit }: { periods: Period[]; canEdit: boolean }) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [isCalculating, startCalculate] = useTransition();
  const [pendingLockId, setPendingLockId] = useState<string | null>(null);
  const [isLocking, startLocking] = useTransition();

  function handleCalculate() {
    startCalculate(async () => {
      const result = await calculatePayrollPeriod(year, month);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(`Đã tính lương kỳ ${month}/${year}`);
      router.push(`/payroll/${result.periodId}`);
    });
  }

  function handleToggleLock(period: Period) {
    setPendingLockId(period.id);
    startLocking(async () => {
      const result = await setPeriodLocked(period.id, period.status !== "locked");
      if (!result.success) toast.error(result.message);
      else toast.success(period.status === "locked" ? "Đã mở khoá kỳ lương" : "Đã khoá kỳ lương");
      setPendingLockId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Tính lương</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="flex flex-row flex-wrap items-end gap-4">
              <Field className="w-28">
                <FieldLabel htmlFor="calc-month">Tháng</FieldLabel>
                <Input
                  id="calc-month"
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                />
              </Field>
              <Field className="w-32">
                <FieldLabel htmlFor="calc-year">Năm</FieldLabel>
                <Input id="calc-year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </Field>
              <Button onClick={handleCalculate} disabled={isCalculating}>
                {isCalculating ? <Spinner className="mr-2 size-4" /> : <Wallet data-icon="inline-start" />}
                Tính lương
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {periods.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>Chưa có kỳ lương nào</EmptyTitle>
            <EmptyDescription>Chọn tháng/năm ở trên và bấm &quot;Tính lương&quot; để bắt đầu.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kỳ lương</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">
                    <Link href={`/payroll/${period.id}`} className="hover:underline">
                      Tháng {period.period_month}/{period.period_year}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={period.status === "locked" ? "outline" : "secondary"}>
                      {period.status === "locked" ? "Đã khoá" : "Đang mở"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/payroll/${period.id}`}>Xem chi tiết</Link>
                      </Button>
                      {canEdit && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isLocking && pendingLockId === period.id}
                            >
                              {period.status === "locked" ? <LockOpen /> : <Lock />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {period.status === "locked" ? "Mở khoá kỳ lương?" : "Khoá kỳ lương?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {period.status === "locked"
                                  ? "Mở khoá để có thể tính lại hoặc sửa tay bảng lương kỳ này."
                                  : "Sau khi khoá, không thể sửa hay tính lại bảng lương kỳ này cho đến khi mở khoá. Nhân viên sẽ thấy được phiếu lương của mình."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Huỷ</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleToggleLock(period)}>
                                {period.status === "locked" ? "Mở khoá" : "Khoá kỳ"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
