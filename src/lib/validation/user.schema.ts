import { z } from "zod";

export const APP_ROLES = ["admin", "hr", "employee"] as const;

export const inviteUserFormSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  role: z.enum(APP_ROLES),
  employee_id: z.string().optional(),
});

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;
export type InviteUserFormInput = z.input<typeof inviteUserFormSchema>;

export const editUserFormSchema = z.object({
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  role: z.enum(APP_ROLES),
  employee_id: z.string().optional(),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
export type EditUserFormInput = z.input<typeof editUserFormSchema>;
