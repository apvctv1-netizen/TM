"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical, Trash2 } from "lucide-react";

import { seedDemoData, clearDemoData } from "@/app/(app)/demo-data/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DemoDataPanel({
  employeeCount,
  demoEmployeeCount,
}: {
  employeeCount: number;
  demoEmployeeCount: number;
}) {
  const router = useRouter();
  const [isSeeding, startSeedTransition] = useTransition();
  const [isClearing, startClearTransition] = useTransition();
  const [lastSummary, setLastSummary] = useState<string[] | null>(null);

  const canSeed = employeeCount === 0;
  const canClear = demoEmployeeCount > 0;

  function handleSeed() {
    startSeedTransition(async () => {
      const result = await seedDemoData();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setLastSummary(result.summary);
      toast.success("Đã tạo xong dữ liệu demo");
      router.refresh();
    });
  }

  function handleClear() {
    startClearTransition(async () => {
      const result = await clearDemoData();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setLastSummary(result.summary);
      toast.success("Đã xoá dữ liệu demo");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Tạo dữ liệu demo</CardTitle>
          <CardDescription>
            Sinh 20 nhân sự giả, chấm công 2 tháng gần nhất, ngày lễ 2026, cấu hình lương ví dụ và
            tính sẵn bảng lương — để xem toàn bộ app trước khi nhập dữ liệu thật.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!canSeed && (
            <Alert>
              <AlertTitle>Đã có dữ liệu nhân sự</AlertTitle>
              <AlertDescription>
                Hệ thống đang có {employeeCount} nhân sự — không thể tạo thêm dữ liệu demo để
                tránh lẫn với dữ liệu thật.
              </AlertDescription>
            </Alert>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!canSeed || isSeeding} className="w-fit">
                {isSeeding ? <Spinner className="mr-2 size-4" /> : <FlaskConical data-icon="inline-start" />}
                Tạo dữ liệu demo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tạo dữ liệu demo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Thao tác này sẽ tạo 20 nhân sự, chấm công, ngày lễ, cấu hình lương và tính bảng
                  lương giả trong hệ thống. Đây là dữ liệu VÍ DỤ, không phải số liệu thật của công
                  ty — nhớ xoá trước khi đưa vào dùng thật.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeed}>Tạo dữ liệu demo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xoá dữ liệu demo</CardTitle>
          <CardDescription>
            Xoá nhân sự demo, chấm công và bảng lương liên quan. Ngày lễ và Cấu hình lương (số ví
            dụ) không tự xoá — cần vào từng trang để sửa/xoá thủ công trước khi dùng số liệu thật.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!canClear || isClearing} className="w-fit">
                {isClearing ? <Spinner className="mr-2 size-4" /> : <Trash2 data-icon="inline-start" />}
                Xoá dữ liệu demo ({demoEmployeeCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá dữ liệu demo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Sẽ xoá {demoEmployeeCount} nhân sự demo cùng chấm công và bảng lương liên quan.
                  Không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleClear}>
                  Xoá dữ liệu demo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {lastSummary && (
        <Alert>
          <AlertTitle>Kết quả</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {lastSummary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
