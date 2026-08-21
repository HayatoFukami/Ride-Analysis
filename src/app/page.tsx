import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return <DashboardClient />;
}
