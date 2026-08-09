import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// getClaims() xác thực JWT cục bộ (không gọi mạng, nếu project dùng khoá ký
// bất đối xứng) — nhanh hơn getUser() rất nhiều lần vì getUser() luôn gọi
// tới Auth server. cache() đảm bảo trong cùng 1 request, dù layout.tsx và
// page.tsx đều gọi hàm này, DB chỉ bị query đúng 1 lần.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, employee_id")
    .eq("id", claims.sub)
    .maybeSingle();

  return profile;
});
