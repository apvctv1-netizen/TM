"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";

export type SeedResult = { success: true; summary: string[] } | { success: false; message: string };

// Đánh dấu nhân sự do nút "Giả lập dữ liệu" tạo ra để nút "Xoá dữ liệu demo"
// biết chính xác dòng nào được phép xoá, không đụng vào nhân sự thật.
const DEMO_TAG = "[DEMO]";

const DEMO_HOLIDAYS: { holiday_date: string; name: string }[] = [
  { holiday_date: "2026-01-01", name: "Tết Dương lịch" },
  { holiday_date: "2026-02-16", name: "Nghỉ Tết Nguyên Đán (29 Tết)" },
  { holiday_date: "2026-02-17", name: "Tết Nguyên Đán (Mùng 1)" },
  { holiday_date: "2026-02-18", name: "Tết Nguyên Đán (Mùng 2)" },
  { holiday_date: "2026-02-19", name: "Tết Nguyên Đán (Mùng 3)" },
  { holiday_date: "2026-04-26", name: "Giỗ Tổ Hùng Vương" },
  { holiday_date: "2026-04-30", name: "Ngày Giải phóng miền Nam" },
  { holiday_date: "2026-05-01", name: "Ngày Quốc tế Lao động" },
  { holiday_date: "2026-09-02", name: "Quốc khánh" },
];

const SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Ngô", "Dương", "Lý"];
const MIDDLE_MALE = ["Văn", "Hữu", "Minh", "Quốc", "Đức", "Thành"];
const MIDDLE_FEMALE = ["Thị", "Ngọc", "Thu", "Kim", "Bích", "Diệu"];
const GIVEN_MALE = ["An", "Bình", "Cường", "Dũng", "Hải", "Hùng", "Khoa", "Long", "Nam", "Phong", "Quang", "Sơn", "Tài", "Thắng", "Tuấn"];
const GIVEN_FEMALE = ["Anh", "Chi", "Dung", "Hà", "Hoa", "Lan", "Linh", "Mai", "Nga", "Nhung", "Phương", "Thảo", "Trang", "Vân", "Yến"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const DEMO_EMPLOYEE_COUNT = 20;
const DEMO_CT_COUNT = 12; // còn lại là TV — xoay ca 1/2/3

function buildDemoEmployees(partnerCodes: string[], positionCodes: string[]) {
  const today = new Date();
  return Array.from({ length: DEMO_EMPLOYEE_COUNT }, (_, i) => {
    const isMale = i % 2 === 0;
    const isCT = i < DEMO_CT_COUNT;
    const surname = SURNAMES[i % SURNAMES.length];
    const middle = isMale ? MIDDLE_MALE[i % MIDDLE_MALE.length] : MIDDLE_FEMALE[i % MIDDLE_FEMALE.length];
    const given = isMale ? GIVEN_MALE[i % GIVEN_MALE.length] : GIVEN_FEMALE[i % GIVEN_FEMALE.length];
    const employee_code = 9001 + i;
    const startMonthsAgo = 3 + (i % 30);
    const start_date = isoDate(new Date(today.getFullYear(), today.getMonth() - startMonthsAgo, (i % 27) + 1));
    const dobYearsAgo = 22 + (i % 20);
    const dob = isoDate(new Date(today.getFullYear() - dobYearsAgo, i % 12, (i % 27) + 1));

    return {
      employee_code,
      full_name: `${surname} ${middle} ${given}`,
      start_date,
      end_date: null,
      gender: isMale ? "Nam" : ("Nữ" as const),
      dob,
      id_number: null,
      id_issue_date: null,
      id_issue_place: null,
      permanent_address: "TP. Hồ Chí Minh",
      phone: `09${String(10000000 + i).padStart(8, "0")}`,
      email: `demo.nv${employee_code}@example.com`,
      education_level: null,
      partner_code: partnerCodes.length > 0 ? partnerCodes[i % partnerCodes.length] : null,
      position_code: isCT && positionCodes.length > 0 ? positionCodes[i % positionCodes.length] : null,
      contract_type: isCT ? "CT" : ("TV" as const),
      note: DEMO_TAG,
    };
  });
}

export async function seedDemoData(): Promise<SeedResult> {
  await requireAdmin();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };

  const { count: existingEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true });
  if ((existingEmployees ?? 0) > 0) {
    return {
      success: false,
      message:
        "Đã có dữ liệu nhân sự trong hệ thống — không tạo dữ liệu demo để tránh lẫn với dữ liệu thật. Xoá hết nhân sự hiện tại trước nếu vẫn muốn xem thử.",
    };
  }

  const [{ data: partners }, { data: positions }, { data: shiftTypes }] = await Promise.all([
    supabase.from("partners").select("code"),
    supabase.from("positions").select("code"),
    supabase.from("shift_types").select("id, code"),
  ]);

  const shiftIdByCode = new Map((shiftTypes ?? []).map((s) => [s.code, s.id]));
  const hcShiftId = shiftIdByCode.get("HC");
  const h2ShiftId = shiftIdByCode.get("H2");
  const rotatingShiftIds = ["1", "2", "3"].map((c) => shiftIdByCode.get(c)).filter((id): id is string => !!id);
  if (!hcShiftId || rotatingShiftIds.length < 3) {
    return { success: false, message: "Thiếu danh mục ca trực (HC/1/2/3) trong hệ thống — không thể tạo dữ liệu demo." };
  }

  const partnerCodes = (partners ?? []).map((p) => p.code);
  const positionCodes = (positions ?? []).map((p) => p.code);
  const employeeRows = buildDemoEmployees(partnerCodes, positionCodes).map((e) => ({
    ...e,
    created_by: user.id,
    updated_by: user.id,
  }));

  const { data: insertedEmployees, error: empError } = await supabase
    .from("employees")
    .insert(employeeRows)
    .select("id, contract_type");
  if (empError) return { success: false, message: `Lỗi tạo nhân sự demo: ${empError.message}` };

  const { error: holidayError } = await supabase
    .from("holidays")
    .upsert(
      DEMO_HOLIDAYS.map((h) => ({ ...h, created_by: user.id })),
      { onConflict: "holiday_date", ignoreDuplicates: true }
    );
  if (holidayError) return { success: false, message: `Lỗi tạo ngày lễ: ${holidayError.message}` };

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const prevMonthFirst = new Date(curYear, curMonth - 2, 1);
  const periods = [
    {
      year: prevMonthFirst.getFullYear(),
      month: prevMonthFirst.getMonth() + 1,
      start: prevMonthFirst,
      end: new Date(curYear, curMonth - 1, 0),
    },
    { year: curYear, month: curMonth, start: new Date(curYear, curMonth - 1, 1), end: now },
  ];

  const attendanceRows: {
    employee_id: string;
    work_date: string;
    shift_type_id: string;
    created_by: string;
    updated_by: string;
  }[] = [];

  // Mỗi nhân viên nghỉ thêm 0-3 buổi (ngoài CN của CT) theo idx riêng, và cứ 5
  // người CT thì 1 người có tăng ca đều đặn — để công (và do đó lương) mỗi
  // người mỗi khác, không đồng loạt giống hệt nhau như trước (dễ gây hiểu lầm
  // là hệ thống tính random).
  (insertedEmployees ?? []).forEach((emp, idx) => {
    const isCT = emp.contract_type === "CT";
    const absenceDays = idx % 4;
    const hasOvertime = isCT && !!h2ShiftId && idx % 5 === 0;

    for (const period of periods) {
      let dayIndex = 0;
      let absencesUsed = 0;
      let workDayCount = 0;
      for (let d = new Date(period.start); d <= period.end; d.setDate(d.getDate() + 1), dayIndex++) {
        if (isCT && d.getDay() === 0) continue; // nghỉ Chủ nhật

        if (absencesUsed < absenceDays && dayIndex % 7 === idx % 7) {
          absencesUsed++;
          continue;
        }

        attendanceRows.push({
          employee_id: emp.id,
          work_date: isoDate(d),
          shift_type_id: isCT ? hcShiftId : rotatingShiftIds[(dayIndex + idx) % 3],
          created_by: user.id,
          updated_by: user.id,
        });
        workDayCount++;

        if (hasOvertime && workDayCount % 6 === 0) {
          attendanceRows.push({
            employee_id: emp.id,
            work_date: isoDate(d),
            shift_type_id: h2ShiftId!,
            created_by: user.id,
            updated_by: user.id,
          });
        }
      }
    }
  });

  for (let i = 0; i < attendanceRows.length; i += 500) {
    const { error } = await supabase.from("attendance_entries").insert(attendanceRows.slice(i, i + 500));
    if (error) return { success: false, message: `Lỗi tạo chấm công demo: ${error.message}` };
  }

  // "Xoá dữ liệu demo" cố ý KHÔNG xoá cấu hình lương (xem clearDemoData bên
  // dưới), nên effective_from ở đây có thể trùng với lần tạo demo trước đó
  // trong cùng tháng — dùng upsert thay vì insert để lần tạo demo thứ 2 trở
  // đi không bị lỗi trùng khoá và bỏ dở giữa chừng (mồ côi nhân sự đã tạo,
  // chưa có kỳ lương).
  const effectiveFrom = isoDate(periods[0].start);
  const { error: globalError } = await supabase.from("payroll_global_settings").upsert(
    {
      effective_from: effectiveFrom,
      standard_cong: 26,
      incentive_bonus_threshold_cong: 25,
      incentive_bonus_rate: 16000,
      meal_allowance_rate: 30000,
      cght_knn_rate: 50000,
      social_insurance_rate: 0.105,
      created_by: user.id,
    },
    { onConflict: "effective_from" }
  );
  if (globalError) return { success: false, message: `Lỗi tạo cấu hình lương chung: ${globalError.message}` };

  const { error: rateError } = await supabase.from("payroll_rate_settings").upsert(
    [
      {
        effective_from: effectiveFrom,
        contract_type: "CT",
        base_salary: 8000000,
        overtime_multiplier: 1.5,
        holiday_work_multiplier: 3,
        night_shift_multiplier: 0.3,
        holiday_off_pay_enabled: true,
        completion_bonus_amount: 300000,
        created_by: user.id,
      },
      {
        effective_from: effectiveFrom,
        contract_type: "TV",
        base_salary: 5500000,
        overtime_multiplier: 1.5,
        holiday_work_multiplier: 3,
        night_shift_multiplier: 0.3,
        holiday_off_pay_enabled: false,
        completion_bonus_amount: 200000,
        created_by: user.id,
      },
    ],
    { onConflict: "effective_from,contract_type" }
  );
  if (rateError) return { success: false, message: `Lỗi tạo đơn giá theo hợp đồng: ${rateError.message}` };

  for (const period of periods) {
    const { error } = await supabase.rpc("calculate_payroll_period", { p_year: period.year, p_month: period.month });
    if (error) return { success: false, message: `Lỗi tính lương kỳ ${period.month}/${period.year}: ${error.message}` };
  }

  revalidatePath("/personnel");
  revalidatePath("/attendance");
  revalidatePath("/holidays");
  revalidatePath("/payroll");
  revalidatePath("/payroll/settings");
  revalidatePath("/dashboard");
  revalidatePath("/demo-data");

  return {
    success: true,
    summary: [
      `${insertedEmployees?.length ?? 0} nhân sự demo (mã ${9001}-${9000 + DEMO_EMPLOYEE_COUNT})`,
      `${attendanceRows.length} lượt chấm công qua 2 kỳ: ${periods[0].month}/${periods[0].year} và ${periods[1].month}/${periods[1].year}`,
      `${DEMO_HOLIDAYS.length} ngày lễ`,
      "1 cấu hình lương chung + 2 đơn giá theo hợp đồng (số liệu VÍ DỤ, không phải số thật)",
      "2 kỳ lương đã tính xong",
    ],
  };
}

export async function clearDemoData(): Promise<SeedResult> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: demoEmployees, error: findError } = await supabase
    .from("employees")
    .select("id")
    .eq("note", DEMO_TAG);
  if (findError) return { success: false, message: `Lỗi tìm nhân sự demo: ${findError.message}` };
  if (!demoEmployees || demoEmployees.length === 0) {
    return { success: false, message: "Không tìm thấy dữ liệu demo nào để xoá." };
  }

  const demoIds = demoEmployees.map((e) => e.id);

  // payroll_entries không có on delete cascade từ employees — phải xoá trước
  // để tránh lỗi khoá ngoại khi xoá nhân sự.
  const { data: affectedEntries, error: entriesError } = await supabase
    .from("payroll_entries")
    .delete()
    .in("employee_id", demoIds)
    .select("period_id");
  if (entriesError) return { success: false, message: `Lỗi xoá phiếu lương demo: ${entriesError.message}` };

  const { error: empError } = await supabase.from("employees").delete().in("id", demoIds);
  if (empError) return { success: false, message: `Lỗi xoá nhân sự demo: ${empError.message}` };

  // Xoá luôn các kỳ lương giờ không còn dòng nào (kỳ chỉ được tạo demo).
  const affectedPeriodIds = [...new Set((affectedEntries ?? []).map((e) => e.period_id))];
  let removedPeriods = 0;
  for (const periodId of affectedPeriodIds) {
    const { count } = await supabase
      .from("payroll_entries")
      .select("id", { count: "exact", head: true })
      .eq("period_id", periodId);
    if ((count ?? 0) === 0) {
      const { error } = await supabase.from("payroll_periods").delete().eq("id", periodId);
      if (!error) removedPeriods += 1;
    }
  }

  revalidatePath("/personnel");
  revalidatePath("/attendance");
  revalidatePath("/payroll");
  revalidatePath("/dashboard");
  revalidatePath("/demo-data");

  return {
    success: true,
    summary: [
      `Đã xoá ${demoIds.length} nhân sự demo và chấm công liên quan`,
      `Đã xoá ${removedPeriods} kỳ lương demo`,
      "Ngày lễ và Cấu hình lương (số ví dụ) KHÔNG bị xoá tự động — vào Ngày Lễ/Tết và Cấu hình lương để sửa/xoá thủ công trước khi dùng số liệu thật.",
    ],
  };
}
