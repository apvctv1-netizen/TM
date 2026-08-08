import { z } from "zod";

export const payrollEntryFormSchema = z.object({
  cong_che_do: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  so_ngay_nghi_le_tet: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  cong_ht_dao_tao: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  ngay_nghi_phep_nam: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  cght_knn: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  tien_trach_nhiem: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  tien_hoc_viec: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  bo_sung_luong: z.coerce.number({ invalid_type_error: "Phải là số" }),
  tru_bhxh: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  thu_ho: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  thue_tncn: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
  truy_thu: z.coerce.number({ invalid_type_error: "Phải là số" }).min(0, "Không được âm"),
});

export type PayrollEntryFormValues = z.infer<typeof payrollEntryFormSchema>;
export type PayrollEntryFormInput = z.input<typeof payrollEntryFormSchema>;
