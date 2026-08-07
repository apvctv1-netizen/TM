import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trang chủ</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan nhân sự, chấm công và bảng lương.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Đang xây dựng</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Số liệu tổng quan sẽ được bổ sung ở giai đoạn sau.
        </CardContent>
      </Card>
    </div>
  );
}
