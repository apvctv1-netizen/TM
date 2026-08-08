import { z } from "zod";

export const CONTRACT_TYPES = ["CT", "TV"] as const;

export const globalSettingsFormSchema = z.object({
  effective_from: z.string().min(1, "Vui lòng chọn ngày hiệu lực"),
  standard_cong: z.coerce.number({ invalid_type_error: "Phải là số" }).positive("Phải lớn hơn 0"),
  incentive_bonus_threshold_cong: z.coerce
    .number({ invalid_type_error: "Phải là số" })
    .positive("Phải lớn hơn 0"),
  incentive_bonus_rate: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  meal_allowance_rate: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  cght_knn_rate: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  social_insurance_rate: z.coerce
    .number({ invalid_type_error: "Phải là số" })
    .min(0, "Không được âm")
    .max(1, "Tỉ lệ tối đa là 1 (100%)"),
});

export type GlobalSettingsFormValues = z.infer<typeof globalSettingsFormSchema>;
export type GlobalSettingsFormInput = z.input<typeof globalSettingsFormSchema>;

export const rateSettingsFormSchema = z.object({
  effective_from: z.string().min(1, "Vui lòng chọn ngày hiệu lực"),
  contract_type: z.enum(CONTRACT_TYPES),
  base_salary: z.coerce.number({ invalid_type_error: "Phải là số" }).positive("Phải lớn hơn 0"),
  overtime_multiplier: z.coerce.number({ invalid_type_error: "Phải là số" }).positive("Phải lớn hơn 0"),
  holiday_work_multiplier: z.coerce.number({ invalid_type_error: "Phải là số" }).positive("Phải lớn hơn 0"),
  night_shift_multiplier: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  holiday_off_pay_enabled: z.boolean().default(true),
  completion_bonus_amount: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
});

export type RateSettingsFormValues = z.infer<typeof rateSettingsFormSchema>;
export type RateSettingsFormInput = z.input<typeof rateSettingsFormSchema>;
