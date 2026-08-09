import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  resolveNavItems,
  type AppRole,
  type Feature,
} from "@/components/layout/nav-items";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.is_active) {
    redirect("/login?error=account_inactive");
  }

  const role = profile.role as AppRole;
  let viewableFeatures = new Set<Feature>();

  if (role === "hr") {
    const supabase = await createClient();
    const { data: permissions } = await supabase
      .from("user_permissions")
      .select("feature")
      .eq("user_id", profile.id)
      .eq("can_view", true);
    viewableFeatures = new Set((permissions ?? []).map((p) => p.feature as Feature));
  }

  const navItems = resolveNavItems(role, viewableFeatures);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar items={navItems} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          navItems={navItems}
          fullName={profile.full_name}
          email={profile.email}
          role={role}
        />
        <main className="flex-1 bg-muted/20 p-4 md:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
