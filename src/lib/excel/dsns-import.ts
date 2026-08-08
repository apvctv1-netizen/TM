import * as XLSX from "xlsx";
import {
  employeeImportRowSchema,
  type EmployeeImportRow,
} from "@/lib/validation/employee.schema";

export type ParsedImportRow = {
  rowNumber: number; // số dòng trong file Excel (1-based) — dùng để hiện lỗi cho HR
  data: EmployeeImportRow | null;
  errors: string[];
};

function normalizeHeader(text: unknown): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Nhãn cột khớp đúng layout sheet DSNS gốc (đã đối chiếu trực tiếp với file
// mẫu), cộng thêm 2 cột mới (Ngày kết thúc công việc, Ghi chú) và các cột
// Đối tác/Mã CV/HĐ vốn nằm ở sheet khác nhưng cho phép có mặt nếu HR chuẩn bị
// file nhập có đủ các cột này.
const HEADER_FIELD_MAP: Record<string, keyof EmployeeImportRow> = {
  ID: "employee_code",
  "HỌ & TÊN": "full_name",
  "HỌ VÀ TÊN": "full_name",
  "NGÀY BẮT ĐẦU LÀM VIỆC": "start_date",
  "NGÀY KẾT THÚC CÔNG VIỆC": "end_date",
  "GIỚI TÍNH": "gender",
  "NGÀY SINH": "dob",
  "CMND SỐ": "id_number",
  "SỐ CMND": "id_number",
  "CMND NGÀY CẤP": "id_issue_date",
  "NGÀY CẤP CMND": "id_issue_date",
  "CMND NƠI CẤP": "id_issue_place",
  "NƠI CẤP CMND": "id_issue_place",
  "ĐỊA CHỈ THƯỜNG TRÚ": "permanent_address",
  "ĐỊA CHỈ": "permanent_address",
  "SỐ ĐIỆN THOẠI": "phone",
  SĐT: "phone",
  MAIL: "email",
  EMAIL: "email",
  "BẰNG CẤP": "education_level",
  "ĐỐI TÁC": "partner_code",
  "MÃ CV": "position_code",
  HĐ: "contract_type",
  "LOẠI HỢP ĐỒNG": "contract_type",
  "GHI CHÚ": "note",
};

const DATE_FIELDS = new Set<keyof EmployeeImportRow>([
  "start_date",
  "end_date",
  "dob",
  "id_issue_date",
]);

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// File mẫu gốc lưu ngày dưới dạng serial number Excel nhưng hiển thị theo
// nhiều định dạng khác nhau tuỳ cột (dd/mm/yyyy cho Ngày bắt đầu, m/d/yy cho
// Ngày sinh/Ngày cấp CMND) — text hiển thị (w) không đáng tin, và Date object
// dựng qua { cellDates: true } bị lệch 1 ngày với file này (lỗi làm tròn giờ
// địa phương khi SheetJS build Date). Cách chính xác duy nhất là tự giải mã
// serial bằng XLSX.SSF.parse_date_code — không phụ thuộc định dạng hiển thị.
function excelSerialToIso(serial: number): string | undefined {
  const code = XLSX.SSF.parse_date_code(serial);
  if (!code) return undefined;
  return `${code.y}-${pad2(code.m)}-${pad2(code.d)}`;
}

function parseTextDate(text: string): string | undefined {
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (m) return `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`;

  // dd/mm/yyyy (năm 4 chữ số) — quy ước Việt Nam, khớp cột Ngày bắt đầu/Ngày
  // kết thúc trong file gốc.
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (m) return `${m[3]}-${pad2(Number(m[2]))}-${pad2(Number(m[1]))}`;

  // m/d/yy (năm 2 chữ số) — khớp cột Ngày sinh/Ngày cấp CMND trong file gốc.
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(text);
  if (m) {
    const year = Number(m[3]) <= 68 ? 2000 + Number(m[3]) : 1900 + Number(m[3]);
    return `${year}-${pad2(Number(m[1]))}-${pad2(Number(m[2]))}`;
  }

  return undefined;
}

function cellToIsoDate(cell: XLSX.CellObject | undefined): string | undefined {
  if (!cell || cell.v === undefined || cell.v === "") return undefined;
  if (cell.t === "n") return excelSerialToIso(Number(cell.v));
  return parseTextDate(String(cell.v).trim());
}

export async function parseDsnsFile(file: File): Promise<ParsedImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  const sheetName =
    workbook.SheetNames.find((name) => normalizeHeader(name).includes("DSNS")) ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet?.["!ref"]) {
    throw new Error(`Không đọc được dữ liệu từ sheet "${sheetName}".`);
  }

  const range = XLSX.utils.decode_range(sheet["!ref"]);

  // Dò vài dòng đầu để tìm đúng dòng tiêu đề (ô đầu tiên = "ID"), phòng
  // trường hợp có dòng tiêu đề/ghi chú chèn thêm phía trên.
  let headerRow = range.s.r;
  for (let r = range.s.r; r <= Math.min(range.s.r + 5, range.e.r); r++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: range.s.c })];
    if (normalizeHeader(cell?.v) === "ID") {
      headerRow = r;
      break;
    }
  }

  // Dòng ngay sau header là dòng tiêu đề phụ (nhóm CMND: Số/Ngày cấp/Nơi cấp)
  // nếu cột đầu tiên của nó không phải số — nếu là số thì đó đã là dòng dữ
  // liệu đầu tiên (file không có tiêu đề phụ).
  const nextCell = sheet[XLSX.utils.encode_cell({ r: headerRow + 1, c: range.s.c })];
  const hasSubHeaderRow = !(nextCell && nextCell.t === "n");

  const columnFields: (keyof EmployeeImportRow | null)[] = [];
  let currentGroup = "";
  for (let c = range.s.c; c <= range.e.c; c++) {
    const mainCell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
    const mainText = normalizeHeader(mainCell?.v);
    if (mainText) currentGroup = mainText;

    let combined = currentGroup;
    if (hasSubHeaderRow) {
      const subCell = sheet[XLSX.utils.encode_cell({ r: headerRow + 1, c })];
      const subText = normalizeHeader(subCell?.v);
      if (subText) combined = `${currentGroup} ${subText}`.trim();
    }

    columnFields.push(HEADER_FIELD_MAP[combined] ?? HEADER_FIELD_MAP[mainText] ?? null);
  }

  const dataStartRow = headerRow + (hasSubHeaderRow ? 2 : 1);
  const rows: ParsedImportRow[] = [];

  for (let r = dataStartRow; r <= range.e.r; r++) {
    const rawByField: Partial<Record<keyof EmployeeImportRow, unknown>> = {};
    let hasAnyValue = false;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const field = columnFields[c - range.s.c];
      if (!field) continue;
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell || cell.v === undefined || cell.v === "") continue;
      hasAnyValue = true;

      if (DATE_FIELDS.has(field)) {
        rawByField[field] = cellToIsoDate(cell);
      } else if (field === "employee_code") {
        rawByField[field] = typeof cell.v === "number" ? cell.v : Number(String(cell.v).trim());
      } else {
        rawByField[field] = String(cell.v).trim();
      }
    }

    if (!hasAnyValue) continue;

    const parsed = employeeImportRowSchema.safeParse(rawByField);
    if (parsed.success) {
      rows.push({ rowNumber: r + 1, data: parsed.data, errors: [] });
    } else {
      rows.push({
        rowNumber: r + 1,
        data: null,
        errors: parsed.error.issues.map((issue) => issue.message),
      });
    }
  }

  return rows;
}

// Kiểm tra chéo với danh mục Đối tác/Chức vụ hiện có — chạy sau parseDsnsFile
// vì danh mục được lấy từ DB (server), không có sẵn trong hàm parse thuần này.
export function validateAgainstLookups(
  rows: ParsedImportRow[],
  lookups: { partnerCodes: Set<string>; positionCodes: Set<string> }
): ParsedImportRow[] {
  return rows.map((row) => {
    if (!row.data) return row;
    const errors: string[] = [];
    if (row.data.partner_code && !lookups.partnerCodes.has(row.data.partner_code)) {
      errors.push(`Mã đối tác "${row.data.partner_code}" không có trong danh mục`);
    }
    if (row.data.position_code && !lookups.positionCodes.has(row.data.position_code)) {
      errors.push(`Mã chức vụ "${row.data.position_code}" không có trong danh mục`);
    }
    if (errors.length === 0) return row;
    return { ...row, data: null, errors: [...row.errors, ...errors] };
  });
}
