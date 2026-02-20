import { redirect } from "next/navigation";

export default function StokHareketlerRedirect() {
  redirect("/panel/stok?tab=hareketler");
}
