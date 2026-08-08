import { z } from "zod";

export const holidayFormSchema = z.object({
  holiday_date: z.string().min(1, "Vui lòng chọn ngày"),
  name: z.string().min(1, "Vui lòng nhập tên ngày lễ"),
});

export type HolidayFormValues = z.infer<typeof holidayFormSchema>;
export type HolidayFormInput = z.input<typeof holidayFormSchema>;
