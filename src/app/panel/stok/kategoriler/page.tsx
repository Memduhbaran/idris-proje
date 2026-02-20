import { redirect } from "next/navigation";

export default function StokKategorilerRedirect() {
  redirect("/panel/stok?tab=kategoriler");
}
