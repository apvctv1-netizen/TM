"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database.types";
import {
  employeeFormSchema,
  type EmployeeFormValues,
  type EmployeeImportRow,
} from "@/lib/validation/employee.schema";

export type ActionResult =
  | { success: true }
  | { success: false; message: string };

function toEmployeeRow(values: EmployeeFormValues) {
  return {
    employee_code: values.employee_code,
    full_name: values.full_name,
    start_date: values.start_date,
    end_date: values.end_date ?? null,
    gender: values.gender ?? null,
    dob: values.dob ?? null,
    id_number: values.id_number ?? null,
    id_issue_date: values.id_issue_date ?? null,
    id_issue_place: values.id_issue_place ?? null,
    permanent_address: values.permanent_address ?? null,
    phone: values.phone ?? null,
    email: values.email ?? null,
    education_level: values.education_level ?? null,
    partner_code: values.partner_code ?? null,
    position_code: values.position_code ?? null,
    contract_type: values.contract_type,
    note: values.note ?? null,
  };
}

function friendlyError(error: { code?: string; message: string }, action: "thêm" | "sửa" | "xoá"): string {
  if (error.code === "23505") return "Mã nhân viên này đã tồn tại.";
  if (error.code === "42501") return `Bạn không có quyền ${action} nhân sự.`;
  return error.message;
}

export async function createEmployee(values: EmployeeFormValues): Promise<ActionResult> {
  const parsed = employeeFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };

  const { error } = await supabase.from("employees").insert({
    ...toEmployeeRow(parsed.data),
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { success: false, message: friendlyError(error, "thêm") };

  revalidatePath("/personnel");
  return { success: true };
}

export async function updateEmployee(id: string, values: EmployeeFormValues): Promise<ActionResult> {
  const parsed = employeeFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };

  const { error } = await supabase
    .from("employees")
    .update({ ...toEmployeeRow(parsed.data), updated_by: user.id })
    .eq("id", id);

  if (error) return { success: false, message: friendlyError(error, "sửa") };

  revalidatePath("/personnel");
  revalidatePath(`/personnel/${id}`);
  return { success: true };
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error) return { success: false, message: friendlyError(error, "xoá") };

  revalidatePath("/personnel");
  return { success: true };
}

export type ImportSummary = {
  inserted: number;
  updated: number;
  errors: { employee_code: number; message: string }[];
};

export type ImportResult =
  | { success: true; summary: ImportSummary }
  | { success: false; message: string };

export async function importEmployees(rows: EmployeeImportRow[]): Promise<ImportResult> {
  if (rows.length === 0) {
    return { success: false, message: "Không có dòng dữ liệu hợp lệ để nhập." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("upsert_employees_bulk", {
    p_rows: rows as unknown as Json,
  });

  if (error) {
    if (error.code === "42501" || error.message.includes("insufficient_privilege")) {
      return { success: false, message: "Bạn không có quyền nhập nhân sự." };
    }
    return { success: false, message: error.message };
  }

  const summary: ImportSummary = { inserted: 0, updated: 0, errors: [] };
  for (const row of data ?? []) {
    if (row.action === "inserted") summary.inserted += 1;
    else if (row.action === "updated") summary.updated += 1;
    else {
      summary.errors.push({
        employee_code: row.employee_code,
        message: row.error_message ?? "Lỗi không xác định",
      });
    }
  }

  revalidatePath("/personnel");
  return { success: true, summary };
}
