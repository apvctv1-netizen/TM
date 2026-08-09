"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { setAttendanceDay, setAttendanceNote } from "@/app/(app)/attendance/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Employee = { id: string; employee_code: number; full_name: string; position_code: string | null };
type ShiftType = { id: string; code: string; label: string; parent_group: string; work_unit_fraction: number };
type Entry = { employee_id: string; work_date: string; shift_type_id: string; note?: string | null };
type DayMeta = { day: number; key: string; dow: number; isHoliday: boolean; isWeekend: boolean };
type NoteTarget = { employeeId: string; employeeName: string; date: string };

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const numberFmt = new Intl.NumberFormat("vi-VN");

const groupLabels: Record<string, string> = {
  HC: "Hành chính",
  CA1: "Ca 1 (Sáng)",
  CA2: "Ca 2 (Chiều)",
  CA3: "Ca 3 (Đêm)",
};

// Màu theo nhóm ca để phân biệt nhanh bằng mắt — nền nhạt + chữ đậm, đủ tương
// phản ở cả light/dark vì theme hiện tại (globals.css) là grayscale thuần.
const GROUP_BADGE_COLORS: Record<string, string> = {
  HC: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  CA1: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  CA2: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  CA3: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};
const DEFAULT_BADGE_COLOR = "bg-muted text-muted-foreground";

function badgeColor(group: string) {
  return GROUP_BADGE_COLORS[group] ?? DEFAULT_BADGE_COLOR;
}

// Tint cho cả cột ngày lễ / cuối tuần. Header dùng nền ĐẶC (không alpha) vì
// các ô header đang "sticky top-0" — nền có alpha sẽ để lộ dữ liệu các hàng
// cuộn ngang qua bên dưới, gây hiện tượng mờ/đè chữ khi kéo bảng. Thân bảng
// (không sticky) vẫn dùng nền có alpha để không át màu badge ca bên trong.
function columnTint(meta: DayMeta, variant: "header" | "body") {
  if (variant === "header") {
    if (meta.isHoliday) return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
    if (meta.isWeekend) return "bg-muted";
    return "bg-background";
  }
  if (meta.isHoliday) return "bg-destructive/5";
  if (meta.isWeekend) return "bg-muted/30";
  return "";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ShiftBadges({ shifts }: { shifts: ShiftType[] }) {
  if (shifts.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center justify-center gap-0.5">
      {shifts.map((s) => (
        <span
          key={s.id}
          className={cn("rounded px-1 py-0.5 text-[10px] font-semibold leading-none", badgeColor(s.parent_group))}
        >
          {s.code}
        </span>
      ))}
    </span>
  );
}

function NoteDot({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <span
      title={note}
      className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary ring-1 ring-background"
    />
  );
}

function AttendanceNoteDialog({
  target,
  onOpenChange,
  canEdit,
  onSave,
}: {
  target: NoteTarget & { note: string | null };
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onSave: (note: string) => Promise<void>;
}) {
  const [value, setValue] = useState(target.note ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await onSave(value);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi chú chấm công</DialogTitle>
          <DialogDescription>
            {target.employeeName} — {target.date.split("-").reverse().join("/")}
          </DialogDescription>
        </DialogHeader>
        {canEdit ? (
          <Textarea
            autoFocus
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nhập ghi chú cho ngày công này..."
          />
        ) : (
          <p className="text-sm text-muted-foreground">{target.note || "Không có ghi chú."}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {canEdit ? "Huỷ" : "Đóng"}
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Spinner className="mr-2 size-4" />}
              Lưu
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DayCellEditor({
  employee,
  date,
  shiftTypes,
  selectedIds,
  note,
  onSaved,
  onRequestNote,
}: {
  employee: Employee;
  date: string;
  shiftTypes: ShiftType[];
  selectedIds: string[];
  note: string | null;
  onSaved: (ids: string[]) => void;
  onRequestNote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds));
  const [isPending, startTransition] = useTransition();

  const selectedShifts = shiftTypes.filter((s) => selectedIds.includes(s.id));

  const groups = useMemo(() => {
    const map = new Map<string, ShiftType[]>();
    for (const s of shiftTypes) {
      if (!map.has(s.parent_group)) map.set(s.parent_group, []);
      map.get(s.parent_group)!.push(s);
    }
    return map;
  }, [shiftTypes]);

  function handleSave() {
    startTransition(async () => {
      const ids = [...checked];
      const result = await setAttendanceDay(employee.id, date, ids);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      onSaved(ids);
      setOpen(false);
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setChecked(new Set(selectedIds));
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onContextMenu={(e) => {
            e.preventDefault();
            onRequestNote();
          }}
          className="relative flex h-9 w-14 items-center justify-center rounded hover:bg-muted"
        >
          <ShiftBadges shifts={selectedShifts} />
          <NoteDot note={note} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            {employee.full_name} — {date.split("-").reverse().join("/")}
          </p>
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {[...groups.entries()].map(([group, items]) => (
              <div key={group} className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground">{groupLabels[group] ?? group}</p>
                {items.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked.has(s.id)}
                      onCheckedChange={(v) => {
                        setChecked((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(s.id);
                          else next.delete(s.id);
                          return next;
                        });
                      }}
                    />
                    <span>
                      {s.code} — {s.label}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending && <Spinner className="mr-2 size-4" />}
              Lưu
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AttendanceGrid({
  year,
  month,
  daysInMonth,
  employees,
  shiftTypes,
  entries,
  holidayDates,
  canEdit,
}: {
  year: number;
  month: number;
  daysInMonth: number;
  employees: Employee[];
  shiftTypes: ShiftType[];
  entries: Entry[];
  holidayDates: string[];
  canEdit: boolean;
}) {
  const [entryMap, setEntryMap] = useState(() => {
    const map = new Map<string, string[]>();
    for (const e of entries) {
      const key = `${e.employee_id}_${e.work_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e.shift_type_id);
    }
    return map;
  });

  const [noteMap, setNoteMap] = useState(() => {
    const map = new Map<string, string>();
    for (const e of entries) {
      if (!e.note) continue;
      const key = `${e.employee_id}_${e.work_date}`;
      if (!map.has(key)) map.set(key, e.note);
    }
    return map;
  });

  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null);

  async function handleSaveNote(note: string) {
    if (!noteTarget) return;
    const result = await setAttendanceNote(noteTarget.employeeId, noteTarget.date, note);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setNoteMap((prev) => {
      const next = new Map(prev);
      const key = `${noteTarget.employeeId}_${noteTarget.date}`;
      const trimmed = note.trim();
      if (trimmed) next.set(key, trimmed);
      else next.delete(key);
      return next;
    });
    setNoteTarget(null);
  }

  const holidaySet = useMemo(() => new Set(holidayDates), [holidayDates]);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dayMeta: DayMeta[] = useMemo(
    () =>
      days.map((day) => {
        const key = `${year}-${pad2(month)}-${pad2(day)}`;
        const dow = new Date(year, month - 1, day).getDay();
        return { day, key, dow, isHoliday: holidaySet.has(key), isWeekend: dow === 0 || dow === 6 };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daysInMonth, year, month, holidaySet]
  );

  const fractionById = useMemo(
    () => new Map(shiftTypes.map((s) => [s.id, s.work_unit_fraction])),
    [shiftTypes]
  );
  const shiftById = useMemo(() => new Map(shiftTypes.map((s) => [s.id, s])), [shiftTypes]);

  // Tổng công theo Line (position_code) mỗi ngày — tương đương hàng "Tổng
  // Line KT / Tổng Line KTKD / Tổng Công" ở cuối bảng chấm công gốc, dùng để
  // đối soát nhanh quân số trực mỗi ngày theo từng nhóm.
  const lineGroups = useMemo(() => {
    const codes = [...new Set(employees.map((e) => e.position_code).filter((c): c is string => !!c))].sort();
    const groups = codes.map((code) => ({
      code,
      employeeIds: new Set(employees.filter((e) => e.position_code === code).map((e) => e.id)),
    }));
    const unassigned = employees.filter((e) => !e.position_code).map((e) => e.id);
    if (unassigned.length > 0) {
      groups.push({ code: "Chưa gán Line", employeeIds: new Set(unassigned) });
    }
    return groups;
  }, [employees]);

  const dailyTotalsByLine = useMemo(() => {
    return lineGroups.map((group) => {
      const totals = dayMeta.map((meta) => {
        let sum = 0;
        for (const empId of group.employeeIds) {
          for (const shiftId of entryMap.get(`${empId}_${meta.key}`) ?? []) {
            sum += fractionById.get(shiftId) ?? 0;
          }
        }
        return sum;
      });
      return { code: group.code, totals };
    });
  }, [lineGroups, entryMap, fractionById, dayMeta]);

  const grandTotals = dayMeta.map((_, i) => dailyTotalsByLine.reduce((sum, line) => sum + line.totals[i], 0));

  // Đối soát công trực lễ/tết + ca đêm cả tháng theo từng Line — tương đương
  // bảng "Vào các ngày nghỉ lễ theo chế độ Nhà nước..." ở cuối bảng chấm công
  // gốc. Ở bản gốc, ngày lễ được đánh dấu thủ công bằng tiền tố "L" trước mã
  // ca; ở đây suy ra trực tiếp từ bảng holidays nên không cần nhập tay riêng.
  const holidayPaySummary = useMemo(() => {
    return lineGroups.map((group) => {
      const bucket = { ca12hc: { thuong: 0, le: 0 }, ca3: { thuong: 0, le: 0 } };
      for (const entry of entries) {
        if (!group.employeeIds.has(entry.employee_id)) continue;
        const shift = shiftById.get(entry.shift_type_id);
        if (!shift) continue;
        const target = shift.parent_group === "CA3" ? bucket.ca3 : bucket.ca12hc;
        if (holidaySet.has(entry.work_date)) target.le += shift.work_unit_fraction;
        else target.thuong += shift.work_unit_fraction;
      }
      return { code: group.code, ...bucket };
    });
  }, [lineGroups, entries, shiftById, holidaySet]);

  const holidayPayGrandTotal = holidayPaySummary.reduce(
    (acc, line) => ({
      thuong: acc.thuong + line.ca12hc.thuong + line.ca3.thuong,
      le: acc.le + line.ca12hc.le + line.ca3.le,
    }),
    { thuong: 0, le: 0 }
  );

  if (employees.length === 0) {
    return (
      <Empty className="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>Không có nhân viên nào đang làm việc trong tháng này</EmptyTitle>
          <EmptyDescription>Kiểm tra lại danh sách Nhân sự hoặc chọn tháng khác.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table containerClassName="max-h-[70vh] rounded-xl border">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 top-0 z-20 min-w-48 bg-background font-bold">
                Nhân viên
              </TableHead>
              {dayMeta.map((meta) => (
                <TableHead
                  key={meta.day}
                  className={cn("sticky top-0 z-10 min-w-14 text-center font-bold", columnTint(meta, "header"))}
                >
                  <div>{meta.day}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{WEEKDAY_LABELS[meta.dow]}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="sticky left-0 z-10 bg-background font-medium">
                  <div>{employee.full_name}</div>
                  <div className="text-xs text-muted-foreground">{employee.employee_code}</div>
                </TableCell>
                {dayMeta.map((meta) => {
                  const mapKey = `${employee.id}_${meta.key}`;
                  const selectedIds = entryMap.get(mapKey) ?? [];
                  const note = noteMap.get(mapKey) ?? null;
                  return (
                    <TableCell key={meta.day} className={cn("p-1 text-center", columnTint(meta, "body"))}>
                      {canEdit ? (
                        <DayCellEditor
                          employee={employee}
                          date={meta.key}
                          shiftTypes={shiftTypes}
                          selectedIds={selectedIds}
                          note={note}
                          onSaved={(ids) => {
                            setEntryMap((prev) => {
                              const next = new Map(prev);
                              next.set(mapKey, ids);
                              return next;
                            });
                          }}
                          onRequestNote={() =>
                            setNoteTarget({ employeeId: employee.id, employeeName: employee.full_name, date: meta.key })
                          }
                        />
                      ) : (
                        <span
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setNoteTarget({
                              employeeId: employee.id,
                              employeeName: employee.full_name,
                              date: meta.key,
                            });
                          }}
                          className="relative mx-auto flex h-9 w-14 items-center justify-center"
                        >
                          <ShiftBadges shifts={shiftTypes.filter((s) => selectedIds.includes(s.id))} />
                          <NoteDot note={note} />
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {dailyTotalsByLine.map((line) => (
              <TableRow key={line.code} className="border-t-2">
                <TableCell className="sticky left-0 z-10 bg-background text-sm font-medium text-muted-foreground">
                  Tổng Line {line.code}
                </TableCell>
                {line.totals.map((total, i) => (
                  <TableCell
                    key={dayMeta[i].day}
                    className={cn("p-1 text-center text-xs text-muted-foreground", columnTint(dayMeta[i], "body"))}
                  >
                    {numberFmt.format(total)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="border-t-2 bg-muted/50">
              <TableCell className="sticky left-0 z-10 bg-muted text-sm font-semibold">Tổng Công</TableCell>
              {grandTotals.map((total, i) => (
                <TableCell
                  key={dayMeta[i].day}
                  className={cn("p-1 text-center text-sm font-semibold", columnTint(dayMeta[i], "body"))}
                >
                  {numberFmt.format(total)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
      </Table>

      <div className="w-full max-w-full overflow-hidden rounded-xl border">
        <p className="border-b bg-muted/60 px-4 py-2 text-sm font-bold">
          Đối soát công trực Lễ/Tết &amp; ca đêm trong tháng {month}/{year}
        </p>
        <Table className="min-w-[560px]" containerClassName="overflow-x-auto">
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-28 font-bold">Line</TableHead>
                <TableHead className="w-40 font-bold">Ca</TableHead>
                <TableHead className="w-28 text-right font-bold">Ngày thường</TableHead>
                <TableHead className="w-28 text-right font-bold text-destructive">Ngày lễ</TableHead>
                <TableHead className="w-28 text-right font-bold">Tổng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidayPaySummary.map((line, i) => {
                const rowTotal = {
                  thuong: line.ca12hc.thuong + line.ca3.thuong,
                  le: line.ca12hc.le + line.ca3.le,
                };
                const zebra = i % 2 === 1 ? "bg-muted/15" : "";
                return (
                  <Fragment key={line.code}>
                    <TableRow className={zebra}>
                      <TableCell rowSpan={3} className="align-middle font-medium">
                        {line.code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">Tổng ca 1,2,HC</TableCell>
                      <TableCell className="text-right">{numberFmt.format(line.ca12hc.thuong)}</TableCell>
                      <TableCell className="text-right text-destructive">
                        {numberFmt.format(line.ca12hc.le)}
                      </TableCell>
                      <TableCell className="text-right">
                        {numberFmt.format(line.ca12hc.thuong + line.ca12hc.le)}
                      </TableCell>
                    </TableRow>
                    <TableRow className={zebra}>
                      <TableCell className="text-muted-foreground">Công Ca 3</TableCell>
                      <TableCell className="text-right">{numberFmt.format(line.ca3.thuong)}</TableCell>
                      <TableCell className="text-right text-destructive">{numberFmt.format(line.ca3.le)}</TableCell>
                      <TableCell className="text-right">{numberFmt.format(line.ca3.thuong + line.ca3.le)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t bg-muted/30 font-semibold">
                      <TableCell>Tổng Line {line.code}</TableCell>
                      <TableCell className="text-right">{numberFmt.format(rowTotal.thuong)}</TableCell>
                      <TableCell className="text-right text-destructive">{numberFmt.format(rowTotal.le)}</TableCell>
                      <TableCell className="text-right">{numberFmt.format(rowTotal.thuong + rowTotal.le)}</TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
              <TableRow className="border-t-2 border-primary/30 bg-primary/10 font-semibold">
                <TableCell colSpan={2}>Tổng {holidayPaySummary.map((l) => l.code).join(" + ")}</TableCell>
                <TableCell className="text-right">{numberFmt.format(holidayPayGrandTotal.thuong)}</TableCell>
                <TableCell className="text-right text-destructive">
                  {numberFmt.format(holidayPayGrandTotal.le)}
                </TableCell>
                <TableCell className="text-right">
                  {numberFmt.format(holidayPayGrandTotal.thuong + holidayPayGrandTotal.le)}
                </TableCell>
              </TableRow>
            </TableBody>
        </Table>
      </div>

      {noteTarget && (
        <AttendanceNoteDialog
          key={`${noteTarget.employeeId}_${noteTarget.date}`}
          target={{ ...noteTarget, note: noteMap.get(`${noteTarget.employeeId}_${noteTarget.date}`) ?? null }}
          onOpenChange={(open) => {
            if (!open) setNoteTarget(null);
          }}
          canEdit={canEdit}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}
