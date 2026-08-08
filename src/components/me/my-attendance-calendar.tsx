import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ShiftType = { id: string; code: string; label: string; parent_group: string };
type Entry = { work_date: string; shift_type_id: string };

const WEEKDAY_LABELS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function MyAttendanceCalendar({
  year,
  month,
  daysInMonth,
  entries,
  shiftTypes,
  holidayDates,
}: {
  year: number;
  month: number;
  daysInMonth: number;
  entries: Entry[];
  shiftTypes: ShiftType[];
  holidayDates: string[];
}) {
  const shiftById = new Map(shiftTypes.map((s) => [s.id, s]));
  const holidaySet = new Set(holidayDates);

  const entriesByDate = new Map<string, ShiftType[]>();
  for (const e of entries) {
    const shift = shiftById.get(e.shift_type_id);
    if (!shift) continue;
    if (!entriesByDate.has(e.work_date)) entriesByDate.set(e.work_date, []);
    entriesByDate.get(e.work_date)!.push(shift);
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Ngày</TableHead>
              <TableHead className="w-32">Thứ</TableHead>
              <TableHead>Ca trực</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => {
              const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;
              const dow = new Date(year, month - 1, day).getDay();
              const isHoliday = holidaySet.has(dateKey);
              const isWeekend = dow === 0 || dow === 6;
              const shifts = entriesByDate.get(dateKey) ?? [];
              return (
                <TableRow
                  key={day}
                  className={cn(isHoliday && "bg-destructive/5", !isHoliday && isWeekend && "bg-muted/50")}
                >
                  <TableCell className="font-medium">
                    {pad2(day)}/{pad2(month)}
                    {isHoliday && (
                      <Badge variant="destructive" className="ml-2">
                        Lễ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{WEEKDAY_LABELS[dow]}</TableCell>
                  <TableCell>
                    {shifts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {shifts.map((s) => (
                          <Badge key={s.id} variant="secondary">
                            {s.code}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">Tổng số ngày có công trong tháng: {entriesByDate.size} ngày</p>
    </div>
  );
}
