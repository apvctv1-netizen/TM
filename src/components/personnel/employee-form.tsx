"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createEmployee, updateEmployee } from "@/app/(app)/personnel/actions";
import {
  CONTRACT_TYPES,
  GENDERS,
  employeeFormSchema,
  type EmployeeFormInput,
  type EmployeeFormValues,
} from "@/lib/validation/employee.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

type Lookup = { code: string; name: string };

const NONE = "__none__";

export type EmployeeFormEmployee = {
  id: string;
  employee_code: number;
  full_name: string;
  start_date: string;
  end_date: string | null;
  gender: string | null;
  dob: string | null;
  id_number: string | null;
  id_issue_date: string | null;
  id_issue_place: string | null;
  permanent_address: string | null;
  phone: string | null;
  email: string | null;
  education_level: string | null;
  partner_code: string | null;
  position_code: string | null;
  contract_type: string;
  note: string | null;
};

function toDefaultValues(employee?: EmployeeFormEmployee): Partial<EmployeeFormInput> {
  if (!employee) {
    return { contract_type: "TV" };
  }
  return {
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    start_date: employee.start_date,
    end_date: employee.end_date ?? "",
    gender: employee.gender ?? undefined,
    dob: employee.dob ?? "",
    id_number: employee.id_number ?? "",
    id_issue_date: employee.id_issue_date ?? "",
    id_issue_place: employee.id_issue_place ?? "",
    permanent_address: employee.permanent_address ?? "",
    phone: employee.phone ?? "",
    email: employee.email ?? "",
    education_level: employee.education_level ?? "",
    partner_code: employee.partner_code ?? undefined,
    position_code: employee.position_code ?? undefined,
    contract_type: employee.contract_type as EmployeeFormInput["contract_type"],
    note: employee.note ?? "",
  };
}

export function EmployeeForm({
  employee,
  partners,
  positions,
  readOnly = false,
}: {
  employee?: EmployeeFormEmployee;
  partners: Lookup[];
  positions: Lookup[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const isEdit = !!employee;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormInput, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: toDefaultValues(employee),
  });

  async function onSubmit(values: EmployeeFormValues) {
    const result = isEdit
      ? await updateEmployee(employee.id, values)
      : await createEmployee(values);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(isEdit ? "Đã lưu thay đổi nhân sự" : "Đã thêm nhân sự mới");
    router.push("/personnel");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <fieldset disabled={readOnly} className="contents">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.employee_code}>
              <FieldLabel htmlFor="employee_code">Mã nhân viên</FieldLabel>
              <Input
                id="employee_code"
                type="number"
                inputMode="numeric"
                disabled={isEdit}
                aria-invalid={!!errors.employee_code}
                {...register("employee_code")}
              />
              <FieldError errors={errors.employee_code ? [errors.employee_code] : undefined} />
            </Field>

            <Field data-invalid={!!errors.full_name}>
              <FieldLabel htmlFor="full_name">Họ và tên</FieldLabel>
              <Input
                id="full_name"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
              <FieldError errors={errors.full_name ? [errors.full_name] : undefined} />
            </Field>

            <Field data-invalid={!!errors.gender}>
              <FieldLabel htmlFor="gender">Giới tính</FieldLabel>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}>
                    <SelectTrigger id="gender" className="w-full" aria-invalid={!!errors.gender}>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.gender ? [errors.gender] : undefined} />
            </Field>

            <Field data-invalid={!!errors.dob}>
              <FieldLabel htmlFor="dob">Ngày sinh</FieldLabel>
              <Input id="dob" type="date" aria-invalid={!!errors.dob} {...register("dob")} />
              <FieldError errors={errors.dob ? [errors.dob] : undefined} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.start_date}>
              <FieldLabel htmlFor="start_date">Ngày bắt đầu làm việc</FieldLabel>
              <Input
                id="start_date"
                type="date"
                aria-invalid={!!errors.start_date}
                {...register("start_date")}
              />
              <FieldError errors={errors.start_date ? [errors.start_date] : undefined} />
            </Field>

            <Field data-invalid={!!errors.end_date}>
              <FieldLabel htmlFor="end_date">Ngày kết thúc công việc</FieldLabel>
              <Input
                id="end_date"
                type="date"
                aria-invalid={!!errors.end_date}
                {...register("end_date")}
              />
              <FieldError errors={errors.end_date ? [errors.end_date] : undefined} />
            </Field>

            <Field data-invalid={!!errors.partner_code}>
              <FieldLabel htmlFor="partner_code">Đối tác</FieldLabel>
              <Controller
                control={control}
                name="partner_code"
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}>
                    <SelectTrigger id="partner_code" className="w-full">
                      <SelectValue placeholder="Chọn đối tác" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {partners.map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.partner_code ? [errors.partner_code] : undefined} />
            </Field>

            <Field data-invalid={!!errors.position_code}>
              <FieldLabel htmlFor="position_code">Chức vụ</FieldLabel>
              <Controller
                control={control}
                name="position_code"
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}>
                    <SelectTrigger id="position_code" className="w-full">
                      <SelectValue placeholder="Chọn chức vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {positions.map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.position_code ? [errors.position_code] : undefined} />
            </Field>

            <Field data-invalid={!!errors.contract_type}>
              <FieldLabel htmlFor="contract_type">Loại hợp đồng</FieldLabel>
              <Controller
                control={control}
                name="contract_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="contract_type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c === "CT" ? "Chính thức (CT)" : "Thử việc (TV)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.contract_type ? [errors.contract_type] : undefined} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giấy tờ tuỳ thân</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field data-invalid={!!errors.id_number}>
              <FieldLabel htmlFor="id_number">Số CMND/CCCD</FieldLabel>
              <Input id="id_number" {...register("id_number")} />
              <FieldError errors={errors.id_number ? [errors.id_number] : undefined} />
            </Field>
            <Field data-invalid={!!errors.id_issue_date}>
              <FieldLabel htmlFor="id_issue_date">Ngày cấp</FieldLabel>
              <Input id="id_issue_date" type="date" {...register("id_issue_date")} />
              <FieldError errors={errors.id_issue_date ? [errors.id_issue_date] : undefined} />
            </Field>
            <Field data-invalid={!!errors.id_issue_place}>
              <FieldLabel htmlFor="id_issue_place">Nơi cấp</FieldLabel>
              <Input id="id_issue_place" {...register("id_issue_place")} />
              <FieldError errors={errors.id_issue_place ? [errors.id_issue_place] : undefined} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liên hệ &amp; khác</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2" data-invalid={!!errors.permanent_address}>
              <FieldLabel htmlFor="permanent_address">Địa chỉ thường trú</FieldLabel>
              <Input id="permanent_address" {...register("permanent_address")} />
              <FieldError errors={errors.permanent_address ? [errors.permanent_address] : undefined} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
              <Input id="phone" {...register("phone")} />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" {...register("email")} />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>
            <Field data-invalid={!!errors.education_level}>
              <FieldLabel htmlFor="education_level">Bằng cấp</FieldLabel>
              <Input id="education_level" {...register("education_level")} />
              <FieldError errors={errors.education_level ? [errors.education_level] : undefined} />
            </Field>
            <Field className="md:col-span-2" data-invalid={!!errors.note}>
              <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
              <Textarea id="note" rows={3} {...register("note")} />
              <FieldError errors={errors.note ? [errors.note] : undefined} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      </fieldset>

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/personnel")}>
            Huỷ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {isEdit ? "Lưu thay đổi" : "Thêm nhân sự"}
          </Button>
        </div>
      )}
    </form>
  );
}
