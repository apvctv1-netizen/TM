"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { setAttendanceDay } from "@/app/(app)/attendance/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Employee = { id: string; employee_code: number; full_name: string };
type ShiftType = { id: string; code: string; label: string; parent_group: string };
type Entry = { employee_id: string; work_date: string; shift_type_id: string };

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const groupLabels: Record<string, string> = {
  HC: "Hành chính",
  CA1: "Ca 1 (Sáng)",
  CA2: "Ca 2 (Chiều)",
  CA3: "Ca 3 (Đêm)",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function DayCellEditor({
  employee,
  date,
  shiftTypes,
  selectedIds,
  onSaved,
}: {
  employee: Employee;
  date: string;
  shiftTypes: ShiftType[];
  selectedIds: string[];
  onSaved: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds));
  const [isPending, startTransition] = useTransition();

  const codes = shiftTypes.filter((s) => selectedIds.includes(s.id)).map((s) => s.code);

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
          className={cn(
            "flex h-9 w-14 items-center justify-center rounded text-xs font-medium hover:bg-muted",
            codes.length > 0 && "bg-primary/10 text-primary"
          )}
        >
          {codes.length > 0 ? codes.join(",") : ""}
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

  const holidaySet = useMemo(() => new Set(holidayDates), [holidayDates]);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function dateKey(day: number) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

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
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-48 bg-background">Nhân viên</TableHead>
            {days.map((day) => {
              const key = dateKey(day);
              const dow = new Date(year, month - 1, day).getDay();
              const isHoliday = holidaySet.has(key);
              const isWeekend = dow === 0 || dow === 6;
              return (
                <TableHead
                  key={day}
                  className={cn(
                    "min-w-14 text-center",
                    isHoliday && "bg-destructive/10 text-destructive",
                    !isHoliday && isWeekend && "bg-muted"
                  )}
                >
                  <div>{day}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{WEEKDAY_LABELS[dow]}</div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                <div>{employee.full_name}</div>
                <div className="text-xs text-muted-foreground">{employee.employee_code}</div>
              </TableCell>
              {days.map((day) => {
                const key = dateKey(day);
                const mapKey = `${employee.id}_${key}`;
                const selectedIds = entryMap.get(mapKey) ?? [];
                return (
                  <TableCell key={day} className="p-1 text-center">
                    {canEdit ? (
                      <DayCellEditor
                        employee={employee}
                        date={key}
                        shiftTypes={shiftTypes}
                        selectedIds={selectedIds}
                        onSaved={(ids) => {
                          setEntryMap((prev) => {
                            const next = new Map(prev);
                            next.set(mapKey, ids);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <span className="text-xs">
                        {shiftTypes
                          .filter((s) => selectedIds.includes(s.id))
                          .map((s) => s.code)
                          .join(",")}
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
