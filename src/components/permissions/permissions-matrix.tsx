"use client";

import { Fragment, useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { setUserPermission } from "@/app/(app)/permissions/actions";
import type { Feature } from "@/components/layout/nav-items";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

type HrUser = { id: string; full_name: string; email: string; is_active: boolean };
type Permission = { user_id: string; feature: string; can_view: boolean; can_edit: boolean };

const FEATURES: { key: Feature; label: string }[] = [
  { key: "personnel", label: "Nhân sự" },
  { key: "attendance", label: "Chấm công" },
  { key: "payroll", label: "Bảng lương" },
  { key: "payroll_settings", label: "Cấu hình lương" },
  { key: "reports", label: "Báo cáo" },
  { key: "user_management", label: "Người dùng" },
];

export function PermissionsMatrix({ hrUsers, permissions }: { hrUsers: HrUser[]; permissions: Permission[] }) {
  const [map, setMap] = useState(() => {
    const m = new Map<string, { can_view: boolean; can_edit: boolean }>();
    for (const p of permissions) {
      m.set(`${p.user_id}_${p.feature}`, { can_view: p.can_view, can_edit: p.can_edit });
    }
    return m;
  });
  const [, startTransition] = useTransition();

  function handleToggle(userId: string, feature: Feature, level: "view" | "edit", value: boolean) {
    const key = `${userId}_${feature}`;
    const prev = map.get(key) ?? { can_view: false, can_edit: false };
    let next = { ...prev };
    if (level === "view") {
      next.can_view = value;
      if (!value) next.can_edit = false;
    } else {
      next.can_edit = value;
      if (value) next.can_view = true;
    }
    setMap((m) => new Map(m).set(key, next));

    startTransition(async () => {
      const result = await setUserPermission(userId, feature, level, value);
      if (!result.success) {
        toast.error(result.message);
        setMap((m) => new Map(m).set(key, prev));
      }
    });
  }

  if (hrUsers.length === 0) {
    return (
      <Empty className="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheck />
          </EmptyMedia>
          <EmptyTitle>Chưa có tài khoản HR nào</EmptyTitle>
          <EmptyDescription>
            Tạo tài khoản với vai trò HR ở trang Người dùng trước khi cấp quyền.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="sticky left-0 z-10 min-w-48 bg-background align-bottom">
              Nhân viên HR
            </TableHead>
            {FEATURES.map((f) => (
              <TableHead key={f.key} colSpan={2} className="text-center">
                {f.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {FEATURES.map((f) => (
              <Fragment key={f.key}>
                <TableHead className="text-center text-xs font-normal">Xem</TableHead>
                <TableHead className="text-center text-xs font-normal">Sửa</TableHead>
              </Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {hrUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="sticky left-0 z-10 bg-background">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {!user.is_active && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Ngưng
                    </Badge>
                  )}
                </div>
              </TableCell>
              {FEATURES.map((f) => {
                const perm = map.get(`${user.id}_${f.key}`) ?? { can_view: false, can_edit: false };
                return (
                  <Fragment key={f.key}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_view}
                        onCheckedChange={(v) => handleToggle(user.id, f.key, "view", v === true)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_edit}
                        onCheckedChange={(v) => handleToggle(user.id, f.key, "edit", v === true)}
                      />
                    </TableCell>
                  </Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
