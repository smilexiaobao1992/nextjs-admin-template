import { redirect } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 重定向到 dashboard
  redirect("/dashboard");
}
