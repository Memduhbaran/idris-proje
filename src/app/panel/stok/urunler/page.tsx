import { redirect } from "next/navigation";

export default function StokUrunlerRedirect() {
  redirect("/panel/stok?tab=urunler");
}
