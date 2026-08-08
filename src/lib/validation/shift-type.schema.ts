import { z } from "zod";

export const PARENT_GROUPS = ["HC", "CA1", "CA2", "CA3"] as const;

export const shiftTypeFormSchema = z.object({
  code: z
    .string()
    .min(1, "Vui lòng nhập mã ca")
    .max(20, "Mã ca tối đa 20 ký tự")
    .regex(/^[A-Za-z0-9]+$/, "Mã ca chỉ gồm chữ và số, không dấu cách"),
  label: z.string().min(1, "Vui lòng nhập tên ca trực"),
  time_range: z.string().optional(),
  parent_group: z.enum(PARENT_GROUPS),
  work_unit_fraction: z.coerce
    .number({ invalid_type_error: "Hệ số quy đổi phải là số" })
    .positive("Hệ số quy đổi phải lớn hơn 0")
    .max(2, "Hệ số quy đổi không hợp lý (tối đa 2)"),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type ShiftTypeFormValues = z.infer<typeof shiftTypeFormSchema>;
export type ShiftTypeFormInput = z.input<typeof shiftTypeFormSchema>;
