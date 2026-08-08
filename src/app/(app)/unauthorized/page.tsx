import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function UnauthorizedPage() {
  return (
    <Empty className="min-h-[60vh] border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert />
        </EmptyMedia>
        <EmptyTitle>Không có quyền truy cập</EmptyTitle>
        <EmptyDescription>
          Bạn không có quyền xem trang này. Liên hệ quản trị viên nếu bạn cần được cấp quyền.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/dashboard">Về trang chủ</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
