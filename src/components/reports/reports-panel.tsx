"use client";

import { useState } from "react";
import { FileSpreadsheet, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Period = { id: string; period_year: number; period_month: number; status: string };

export function ReportsPanel({ periods }: { periods: Period[] }) {
  const [selectedId, setSelectedId] = useState<string>(periods[0]?.id ?? "");
  const selected = periods.find((p) => p.id === selectedId);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" /> Danh sách nhân sự
          </CardTitle>
          <CardDescription>Xuất toàn bộ hồ sơ nhân viên hiện có ra file Excel (DSNS).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/api/personnel/export">
              <FileSpreadsheet data-icon="inline-start" />
              Xuất Excel
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4" /> Bảng lương theo kỳ
          </CardTitle>
          <CardDescription>Chọn kỳ lương để xuất chi tiết bảng lương ra file Excel.</CardDescription>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyTitle>Chưa có kỳ lương nào</EmptyTitle>
                <EmptyDescription>Vào trang Bảng lương để tính lương trước.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <FieldGroup className="flex flex-row flex-wrap items-end gap-4">
              <Field className="w-48">
                <FieldLabel htmlFor="report-period">Kỳ lương</FieldLabel>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger id="report-period" className="w-full">
                    <SelectValue placeholder="Chọn kỳ lương" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        Tháng {p.period_month}/{p.period_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {selected && (
                <Badge variant={selected.status === "locked" ? "outline" : "secondary"}>
                  {selected.status === "locked" ? "Đã khoá" : "Đang mở"}
                </Badge>
              )}
              <Button asChild>
                <a href={`/api/payroll/${selectedId}/export`}>
                  <FileSpreadsheet data-icon="inline-start" />
                  Xuất Excel
                </a>
              </Button>
            </FieldGroup>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
