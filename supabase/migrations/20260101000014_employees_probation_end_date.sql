-- Ngày kết thúc thử việc — khác với end_date (ngày kết thúc công việc/nghỉ
-- việc hẳn): dùng để HR biết khi nào cần quyết định chuyển nhân sự "TV"
-- (thử việc) sang "CT" (chính thức) hoặc dừng hợp đồng.
alter table public.employees add column probation_end_date date;
