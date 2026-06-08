import { redirect } from "next/navigation";

export default async function GiderlerRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ yeni?: string }>;
}) {
  const params = await searchParams;
  const q = params.yeni ? `?yeni=${params.yeni}` : "";
  redirect(`/panel/muhasebe${q}`);
}
