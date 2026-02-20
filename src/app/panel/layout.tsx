import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PanelClient from "@/components/panel/PanelClient";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginPage = pathname === "/panel/login";

  if (!session && !isLoginPage) redirect("/panel/login");
  if (isLoginPage) return <>{children}</>;
  if (!session) redirect("/panel/login");

  return <PanelClient userName={session.name}>{children}</PanelClient>;
}
