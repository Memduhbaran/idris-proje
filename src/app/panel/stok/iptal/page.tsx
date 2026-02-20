import { redirect } from "next/navigation";

export default function StokIptalRedirect() {
  redirect("/panel/stok?tab=iptal");
}
