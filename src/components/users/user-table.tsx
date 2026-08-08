"use client";

import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, UserCog } from "lucide-react";

import { inviteUser, toggleUserActive, updateUserProfile } from "@/app/(app)/users/actions";
import {
  APP_ROLES,
  editUserFormSchema,
  inviteUserFormSchema,
  type EditUserFormInput,
  type EditUserFormValues,
  type InviteUserFormInput,
  type InviteUserFormValues,
} from "@/lib/validation/user.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

const NONE = "__none__";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  hr: "HR",
  employee: "Nhân viên",
};

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  employee_id: string | null;
  is_active: boolean;
};

type Employee = { id: string; employee_code: number; full_name: string };

function InviteUserDialog({
  open,
  onOpenChange,
  employees,
  assignedEmployeeIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  assignedEmployeeIds: Set<string>;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormInput, unknown, InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: { email: "", full_name: "", role: "hr" },
  });

  const availableEmployees = useMemo(
    () => employees.filter((e) => !assignedEmployeeIds.has(e.id)),
    [employees, assignedEmployeeIds]
  );

  async function onSubmit(values: InviteUserFormValues) {
    const result = await inviteUser(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(`Đã gửi lời mời tới ${values.email}`);
    onOpenChange(false);
    reset({ email: "", full_name: "", role: "hr" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset({ email: "", full_name: "", role: "hr" });
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Mời người dùng</DialogTitle>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" {...register("email")} />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>

            <Field data-invalid={!!errors.full_name}>
              <FieldLabel htmlFor="full_name">Họ tên</FieldLabel>
              <Input id="full_name" {...register("full_name")} />
              <FieldError errors={errors.full_name ? [errors.full_name] : undefined} />
            </Field>

            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="role">Vai trò</FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.role ? [errors.role] : undefined} />
            </Field>

            <Field data-invalid={!!errors.employee_id}>
              <FieldLabel htmlFor="employee_id">Gắn với nhân viên (tuỳ chọn)</FieldLabel>
              <Controller
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                  >
                    <SelectTrigger id="employee_id" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {availableEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.employee_code} — {e.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.employee_id ? [errors.employee_id] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              Gửi lời mời
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  profile,
  open,
  onOpenChange,
  employees,
  assignedEmployeeIds,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  assignedEmployeeIds: Set<string>;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormInput, unknown, EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      full_name: profile.full_name,
      role: profile.role as EditUserFormInput["role"],
      employee_id: profile.employee_id ?? undefined,
    },
  });

  const availableEmployees = useMemo(
    () => employees.filter((e) => !assignedEmployeeIds.has(e.id) || e.id === profile.employee_id),
    [employees, assignedEmployeeIds, profile.employee_id]
  );

  async function onSubmit(values: EditUserFormValues) {
    const result = await updateUserProfile(profile.id, values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success("Đã lưu thay đổi");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next)
          reset({
            full_name: profile.full_name,
            role: profile.role as EditUserFormInput["role"],
            employee_id: profile.employee_id ?? undefined,
          });
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Sửa người dùng</DialogTitle>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={profile.email} disabled />
            </Field>

            <Field data-invalid={!!errors.full_name}>
              <FieldLabel htmlFor="edit_full_name">Họ tên</FieldLabel>
              <Input id="edit_full_name" {...register("full_name")} />
              <FieldError errors={errors.full_name ? [errors.full_name] : undefined} />
            </Field>

            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="edit_role">Vai trò</FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit_role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.role ? [errors.role] : undefined} />
            </Field>

            <Field data-invalid={!!errors.employee_id}>
              <FieldLabel htmlFor="edit_employee_id">Gắn với nhân viên (tuỳ chọn)</FieldLabel>
              <Controller
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                  >
                    <SelectTrigger id="edit_employee_id" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {availableEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.employee_code} — {e.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.employee_id ? [errors.employee_id] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserTable({ profiles, employees }: { profiles: Profile[]; employees: Employee[] }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [isPending, startTransition] = useTransition();

  const employeeById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const assignedEmployeeIds = useMemo(
    () => new Set(profiles.map((p) => p.employee_id).filter((id): id is string => !!id)),
    [profiles]
  );

  function handleToggleActive(profile: Profile) {
    startTransition(async () => {
      const result = await toggleUserActive(profile.id, !profile.is_active);
      if (!result.success) toast.error(result.message);
      else toast.success(profile.is_active ? "Đã ngưng hoạt động tài khoản" : "Đã kích hoạt tài khoản");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus data-icon="inline-start" />
          Mời người dùng
        </Button>
        <InviteUserDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          employees={employees}
          assignedEmployeeIds={assignedEmployeeIds}
        />
      </div>

      {profiles.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserCog />
            </EmptyMedia>
            <EmptyTitle>Chưa có người dùng nào</EmptyTitle>
            <EmptyDescription>Mời tài khoản đầu tiên để bắt đầu.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Nhân viên gắn kèm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const employee = profile.employee_id ? employeeById.get(profile.employee_id) : undefined;
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[profile.role] ?? profile.role}</Badge>
                    </TableCell>
                    <TableCell>{employee ? `${employee.employee_code} — ${employee.full_name}` : "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={profile.is_active ? "secondary" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(profile)}
                      >
                        {profile.is_active ? "Hoạt động" : "Ngưng hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled={isPending} onClick={() => setEditing(profile)}>
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <EditUserDialog
          profile={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          employees={employees}
          assignedEmployeeIds={assignedEmployeeIds}
        />
      )}
    </div>
  );
}
