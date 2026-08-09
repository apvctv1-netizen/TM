import { z } from "zod";

export const GENDERS = ["Nam", "Nữ", "Khác"] as const;
export const CONTRACT_TYPES = ["CT", "TV"] as const;

// z.preprocess() types its input as `unknown`, which breaks the
// useForm<Input,_,Output> resolver typing (RHF needs a concrete Input type to
// bind register()/Controller to). Using .optional().transform() instead keeps
// Input = string | undefined while still collapsing "" to undefined on output.
const emptyToUndefined = (val: string | undefined) =>
  val && val.trim() !== "" ? val : undefined;

const optionalText = z.string().optional().transform(emptyToUndefined);
const optionalDate = z.string().optional().transform(emptyToUndefined);

export const employeeFormSchema = z
  .object({
    employee_code: z.coerce
      .number({ invalid_type_error: "Mã nhân viên phải là số" })
      .int("Mã nhân viên phải là số nguyên")
      .positive("Mã nhân viên phải lớn hơn 0"),
    full_name: z.string().min(1, "Vui lòng nhập họ tên"),
    start_date: z.string().min(1, "Vui lòng chọn ngày bắt đầu làm việc"),
    end_date: optionalDate,
    gender: z.string().optional().transform(emptyToUndefined).pipe(z.enum(GENDERS).optional()),
    dob: optionalDate,
    id_number: optionalText,
    id_issue_date: optionalDate,
    id_issue_place: optionalText,
    permanent_address: optionalText,
    phone: optionalText,
    email: z
      .string()
      .optional()
      .transform(emptyToUndefined)
      .pipe(z.string().email("Email không hợp lệ").optional()),
    education_level: optionalText,
    partner_code: optionalText,
    position_code: optionalText,
    contract_type: z.enum(CONTRACT_TYPES),
    probation_end_date: optionalDate,
    note: optionalText,
  })
  .refine((data) => !data.end_date || data.end_date >= data.start_date, {
    message: "Ngày kết thúc phải sau ngày bắt đầu làm việc",
    path: ["end_date"],
  })
  .refine((data) => !data.probation_end_date || data.probation_end_date >= data.start_date, {
    message: "Ngày kết thúc thử việc phải sau ngày bắt đầu làm việc",
    path: ["probation_end_date"],
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
// Raw shape react-hook-form binds register()/Controller to, before Zod's
// transforms run (e.g. gender is a plain string here, narrowed to the enum
// only in the validated output that reaches onSubmit).
export type EmployeeFormInput = z.input<typeof employeeFormSchema>;

// Dùng cho từng dòng khi import Excel — không refine chéo trường (việc đó xử
// lý riêng trong dsns-import.ts để gắn lỗi vào đúng dòng thay vì throw).
export const employeeImportRowSchema = z.object({
  employee_code: z.coerce
    .number({ invalid_type_error: "ID phải là số" })
    .int("ID phải là số nguyên")
    .positive("ID phải lớn hơn 0"),
  full_name: z.string().min(1, "Thiếu họ tên"),
  start_date: z.string().min(1, "Thiếu ngày bắt đầu làm việc"),
  end_date: optionalDate,
  gender: z.string().optional().transform(emptyToUndefined).pipe(z.enum(GENDERS).optional()),
  dob: optionalDate,
  id_number: optionalText,
  id_issue_date: optionalDate,
  id_issue_place: optionalText,
  permanent_address: optionalText,
  phone: optionalText,
  email: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .pipe(z.string().email("Email không hợp lệ").optional()),
  education_level: optionalText,
  partner_code: optionalText,
  position_code: optionalText,
  contract_type: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .pipe(z.enum(CONTRACT_TYPES).optional()),
  note: optionalText,
});

export type EmployeeImportRow = z.infer<typeof employeeImportRowSchema>;
