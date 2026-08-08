"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Pencil, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteEmployee } from "@/app/(app)/personnel/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type EmployeeRow = {
  id: string;
  employee_code: number;
  full_name: string;
  start_date: string;
  end_date: string | null;
  phone: string | null;
  email: string | null;
  contract_type: string;
  partner_code: string | null;
  position_code: string | null;
};

type Lookup = { code: string; name: string };

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd/MM/yyyy");
  } catch {
    return value;
  }
}

export function EmployeeTable({
  employees,
  partners,
  positions,
  canEdit,
}: {
  employees: EmployeeRow[];
  partners: Lookup[];
  positions: Lookup[];
  canEdit: boolean;
}) {
  const [search, setSearch] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  const partnerNames = useMemo(() => new Map(partners.map((p) => [p.code, p.name])), [partners]);
  const positionNames = useMemo(() => new Map(positions.map((p) => [p.code, p.name])), [positions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        String(e.employee_code).includes(q) ||
        (e.phone ?? "").includes(q) ||
        (e.email ?? "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function handleDelete(id: string, name: string) {
    startDeleteTransition(async () => {
      const result = await deleteEmployee(id);
      if (result.success) {
        toast.success(`Đã xoá nhân sự "${name}"`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <InputGroup className="max-w-sm">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Tìm theo mã NV, họ tên, SĐT, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      {filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Không có nhân sự</EmptyTitle>
            <EmptyDescription>
              {employees.length === 0
                ? "Chưa có nhân sự nào. Thêm mới hoặc nhập từ Excel để bắt đầu."
                : "Không tìm thấy nhân sự khớp với từ khoá tìm kiếm."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã NV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Loại HĐ</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Trạng thái</TableHead>
                {canEdit && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => {
                const hasEnded = !!employee.end_date && employee.end_date <= today;
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employee_code}</TableCell>
                    <TableCell>
                      <Link href={`/personnel/${employee.id}`} className="hover:underline">
                        {employee.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(employee.start_date)}</TableCell>
                    <TableCell>
                      {employee.partner_code
                        ? (partnerNames.get(employee.partner_code) ?? employee.partner_code)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {employee.position_code
                        ? (positionNames.get(employee.position_code) ?? employee.position_code)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.contract_type === "CT" ? "default" : "secondary"}>
                        {employee.contract_type === "CT" ? "Chính thức" : "Thử việc"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col text-xs">
                        <span>{employee.phone || "—"}</span>
                        <span>{employee.email || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasEnded ? (
                        <Badge variant="outline">Đã nghỉ</Badge>
                      ) : (
                        <Badge variant="secondary">Đang làm việc</Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/personnel/${employee.id}`}>
                              <Pencil />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm" disabled={isDeleting}>
                                <Trash2 />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xoá nhân sự?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn sắp xoá nhân sự &quot;{employee.full_name}&quot; (mã {employee.employee_code}).
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={() => handleDelete(employee.id, employee.full_name)}
                                >
                                  Xoá
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
