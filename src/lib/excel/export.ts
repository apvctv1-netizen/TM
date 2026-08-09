import * as XLSX from "xlsx";

type EmployeeExportRow = {
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

// Nhãn cột dùng đúng các biến thể phẳng (1 dòng header) đã có sẵn trong
// HEADER_FIELD_MAP của dsns-import.ts — để file xuất ra có thể nhập lại
// (round-trip) mà không cần chỉnh sửa gì.
export function buildPersonnelWorkbook(
  employees: EmployeeExportRow[],
  partnerNames: Map<string, string>,
  positionNames: Map<string, string>
): Buffer {
  const header = [
    "ID",
    "Họ và tên",
    "Ngày bắt đầu làm việc",
    "Ngày kết thúc công việc",
    "Giới tính",
    "Ngày sinh",
    "Số CMND",
    "Ngày cấp CMND",
    "Nơi cấp CMND",
    "Địa chỉ",
    "Số điện thoại",
    "Email",
    "Bằng cấp",
    "Đối tác",
    "Mã CV",
    "Loại hợp đồng",
    "Ghi chú",
    "Tên đối tác",
    "Tên chức vụ",
    "Trạng thái",
  ];

  const today = new Date().toISOString().slice(0, 10);

  const rows = employees.map((e) => [
    e.employee_code,
    e.full_name,
    e.start_date,
    e.end_date ?? "",
    e.gender ?? "",
    e.dob ?? "",
    e.id_number ?? "",
    e.id_issue_date ?? "",
    e.id_issue_place ?? "",
    e.permanent_address ?? "",
    e.phone ?? "",
    e.email ?? "",
    e.education_level ?? "",
    e.partner_code ?? "",
    e.position_code ?? "",
    e.contract_type,
    e.note ?? "",
    (e.partner_code ? partnerNames.get(e.partner_code) : "") ?? "",
    (e.position_code ? positionNames.get(e.position_code) : "") ?? "",
    !e.end_date || e.end_date >= today ? "Đang làm việc" : "Đã nghỉ",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "DSNS");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

// File mẫu để nhập mới — chỉ có header, tái dùng buildPersonnelWorkbook với 0
// dòng để đảm bảo layout cột luôn khớp 100% với những gì dsns-import.ts chấp
// nhận (không phải duy trì 2 danh sách cột riêng biệt).
export function buildPersonnelTemplateWorkbook(): Buffer {
  return buildPersonnelWorkbook([], new Map(), new Map());
}

type PayrollExportRow = {
  employee_code: number;
  full_name: string;
  contract_type_snapshot: string;
  standard_cong: number;
  ctt: number;
  cong_chinh: number;
  tang_ca: number;
  cong_truc_le_tet: number;
  cong_ca_dem: number;
  cong_che_do: number;
  so_ngay_nghi_le_tet: number;
  cong_ht_dao_tao: number;
  ngay_nghi_phep_nam: number;
  cght_knn: number;
  luong_theo_ctt: number;
  tien_tang_ca: number;
  tien_truc_le_tet: number;
  tien_nghi_le_tet: number;
  tien_ca_dem: number;
  tien_luong_che_do: number;
  tien_phep_nam: number;
  thuong_hoan_thanh: number;
  thuong_khuyen_khich: number;
  ho_tro_an_giua_ca: number;
  tien_thuong_cght_knn: number;
  tien_trach_nhiem: number;
  tien_hoc_viec: number;
  bo_sung_luong: number;
  tru_bhxh: number;
  thu_ho: number;
  thue_tncn: number;
  truy_thu: number;
  tong_luong: number;
  tong_khau_tru: number;
  tong_luong_nhan: number;
};

export function buildPayrollWorkbook(entries: PayrollExportRow[]): Buffer {
  const header = [
    "Mã NV",
    "Họ và tên",
    "Hợp đồng",
    "Công chuẩn",
    "Tổng công (CTT)",
    "Công chính",
    "Tăng ca",
    "Công trực Lễ/Tết",
    "Công ca đêm",
    "Công chế độ",
    "Số ngày nghỉ Lễ/Tết",
    "Công HT đào tạo",
    "Ngày nghỉ phép năm",
    "Công CGHT/KNN",
    "Lương theo CTT",
    "Tiền tăng ca",
    "Tiền trực Lễ/Tết",
    "Tiền nghỉ Lễ/Tết",
    "Tiền ca đêm",
    "Tiền lương chế độ",
    "Tiền phép năm",
    "Thưởng hoàn thành",
    "Thưởng khuyến khích",
    "Hỗ trợ ăn giữa ca",
    "Tiền thưởng CGHT/KNN",
    "Tiền trách nhiệm",
    "Tiền học việc",
    "Bổ sung lương (+/-)",
    "Trừ BHXH",
    "Thu hộ",
    "Thuế TNCN",
    "Truy thu",
    "Tổng lương",
    "Tổng khấu trừ",
    "Thực lãnh",
  ];

  const rows = entries.map((e) => [
    e.employee_code,
    e.full_name,
    e.contract_type_snapshot,
    e.standard_cong,
    e.ctt,
    e.cong_chinh,
    e.tang_ca,
    e.cong_truc_le_tet,
    e.cong_ca_dem,
    e.cong_che_do,
    e.so_ngay_nghi_le_tet,
    e.cong_ht_dao_tao,
    e.ngay_nghi_phep_nam,
    e.cght_knn,
    e.luong_theo_ctt,
    e.tien_tang_ca,
    e.tien_truc_le_tet,
    e.tien_nghi_le_tet,
    e.tien_ca_dem,
    e.tien_luong_che_do,
    e.tien_phep_nam,
    e.thuong_hoan_thanh,
    e.thuong_khuyen_khich,
    e.ho_tro_an_giua_ca,
    e.tien_thuong_cght_knn,
    e.tien_trach_nhiem,
    e.tien_hoc_viec,
    e.bo_sung_luong,
    e.tru_bhxh,
    e.thu_ho,
    e.thue_tncn,
    e.truy_thu,
    e.tong_luong,
    e.tong_khau_tru,
    e.tong_luong_nhan,
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "BangLuong");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
