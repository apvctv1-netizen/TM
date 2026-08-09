"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { parseDsnsFile, validateAgainstLookups, type ParsedImportRow } from "@/lib/excel/dsns-import";
import { importEmployees, type ImportSummary } from "@/app/(app)/personnel/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RowStatus = "new" | "update" | "error";

type PreviewRow = ParsedImportRow & { status: RowStatus; selected: boolean };

function statusBadge(status: RowStatus) {
  if (status === "new") return <Badge variant="secondary">Mới</Badge>;
  if (status === "update") return <Badge variant="outline">Cập nhật</Badge>;
  return <Badge variant="destructive">Lỗi</Badge>;
}

export function ImportWizard({
  partnerCodes,
  positionCodes,
  existingEmployeeCodes,
}: {
  partnerCodes: string[];
  positionCodes: string[];
  existingEmployeeCodes: number[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, startImportTransition] = useTransition();
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const existingCodes = useMemo(() => new Set(existingEmployeeCodes), [existingEmployeeCodes]);
  const partnerCodeSet = useMemo(() => new Set(partnerCodes), [partnerCodes]);
  const positionCodeSet = useMemo(() => new Set(positionCodes), [positionCodes]);

  const validCount = rows.filter((r) => r.status !== "error").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const selectedCount = rows.filter((r) => r.selected).length;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setSummary(null);
    setIsParsing(true);
    try {
      const parsed = await parseDsnsFile(file);
      const checked = validateAgainstLookups(parsed, {
        partnerCodes: partnerCodeSet,
        positionCodes: positionCodeSet,
      });
      const preview: PreviewRow[] = checked.map((row) => {
        const status: RowStatus = !row.data
          ? "error"
          : existingCodes.has(row.data.employee_code)
            ? "update"
            : "new";
        return { ...row, status, selected: status !== "error" };
      });
      setRows(preview);
      if (preview.length === 0) {
        toast.warning("Không tìm thấy dòng dữ liệu nào trong file.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không đọc được file Excel.");
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  }

  function toggleRow(rowNumber: number, checked: boolean) {
    setRows((prev) => prev.map((r) => (r.rowNumber === rowNumber ? { ...r, selected: checked } : r)));
  }

  function handleImport() {
    const selectedRows = rows.filter((r) => r.selected && r.data);
    startImportTransition(async () => {
      const result = await importEmployees(selectedRows.map((r) => r.data!));
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSummary(result.summary);
      toast.success(
        `Đã nhập ${result.summary.inserted} mới, cập nhật ${result.summary.updated}` +
          (result.summary.errors.length > 0 ? `, lỗi ${result.summary.errors.length}` : "")
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href="/api/personnel/template" download>
                <Download data-icon="inline-start" />
                Tải file mẫu
              </a>
            </Button>
          </div>
          <label
            htmlFor="dsns-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center hover:bg-muted/50"
          >
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName ?? "Chọn file Excel (.xlsx) theo layout sheet DSNS"}
            </span>
            <span className="text-xs text-muted-foreground">Nhấn để chọn file từ máy</span>
          </label>
          <input
            id="dsns-file"
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={handleFileChange}
          />
          {isParsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Đang đọc file...
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {rows.length} dòng — {validCount} hợp lệ, {errorCount} lỗi. Đã chọn {selectedCount} dòng để nhập.
            </div>
            <Button onClick={handleImport} disabled={selectedCount === 0 || isImporting}>
              {isImporting ? <Spinner className="mr-2 size-4" /> : <Upload data-icon="inline-start" />}
              Xác nhận nhập ({selectedCount})
            </Button>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Dòng</TableHead>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Chi tiết lỗi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell>
                      <Checkbox
                        checked={row.selected}
                        disabled={row.status === "error"}
                        onCheckedChange={(checked) => toggleRow(row.rowNumber, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                    <TableCell>{row.data?.employee_code ?? "—"}</TableCell>
                    <TableCell>{row.data?.full_name ?? "—"}</TableCell>
                    <TableCell>{row.data?.start_date ?? "—"}</TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                    <TableCell className="text-sm text-destructive">
                      {row.errors.join("; ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {rows.length === 0 && !isParsing && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSpreadsheet />
            </EmptyMedia>
            <EmptyTitle>Chưa có file nào được chọn</EmptyTitle>
            <EmptyDescription>
              Chọn file Excel để xem trước dữ liệu trước khi nhập vào hệ thống.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {summary && (
        <Alert>
          <AlertTitle>Kết quả nhập</AlertTitle>
          <AlertDescription>
            <p>
              Đã thêm mới {summary.inserted}, cập nhật {summary.updated} nhân sự.
            </p>
            {summary.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-4">
                {summary.errors.map((e, i) => (
                  <li key={i}>
                    Mã {e.employee_code}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
