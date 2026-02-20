import { prisma } from "./prisma";

/** Ürünün güncel stok miktarını hareketlerden hesaplar. */
export async function getProductCurrentStock(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { movements: true },
  });
  if (!product) return 0;
  let qty = product.initialQty;
  for (const m of product.movements) {
    if (m.type === "in") qty += m.qty;
    else if (m.type === "out") qty -= m.qty;
    else if (m.type === "adjustment") qty += m.qty;
    else if (m.type === "cancel" && m.refId) {
      const ref = product.movements.find((x) => x.id === m.refId);
      if (ref) {
        if (ref.type === "out") qty += ref.qty;
        else if (ref.type === "in") qty -= ref.qty;
        else if (ref.type === "adjustment") qty -= ref.qty;
      }
    }
  }
  return qty;
}

const PREFIXES: Record<string, string> = {
  in: "GIR",
  out: "CIK",
  adjustment: "DZN",
  cancel: "IPT",
};

/** Yıllık sıra ile tekil fiş numarası üretir. */
export async function generateDocNo(type: "in" | "out" | "adjustment" | "cancel"): Promise<string> {
  const prefix = PREFIXES[type];
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;
  const last = await prisma.inventoryMovement.findFirst({
    where: { docNo: { startsWith: pattern } },
    orderBy: { docNo: "desc" },
    select: { docNo: true },
  });
  const nextNum = last
    ? parseInt(last.docNo.slice(pattern.length), 10) + 1
    : 1;
  return `${pattern}${String(nextNum).padStart(5, "0")}`;
}
