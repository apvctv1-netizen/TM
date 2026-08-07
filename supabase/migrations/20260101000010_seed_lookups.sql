-- Seed dữ liệu khởi tạo cho đối tác/chức vụ, trích từ dữ liệu thực tế trong
-- file Excel gốc (cột "Đối tác" và "Mã CV" của sheet CHẤM CÔNG, và đối tác
-- "KC" xuất hiện ở sheet tháng cũ hơn). Admin có thể sửa/thêm qua màn Danh mục.

insert into public.partners (code, name) values
  ('TM', 'Công ty CP DVTM Trường Minh'),
  ('KC', 'Đối tác KC')
on conflict (code) do nothing;

insert into public.positions (code, name) values
  ('KT', 'Kế toán'),
  ('KTKD', 'Kế toán kinh doanh')
on conflict (code) do nothing;
