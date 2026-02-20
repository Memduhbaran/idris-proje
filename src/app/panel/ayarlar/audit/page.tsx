import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; from?: string; to?: string; entity?: string; action?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  if (params.entity) where.entityType = params.entity;
  if (params.action) where.action = params.action;
  if (params.user) where.userId = params.user;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) (where.createdAt as Record<string, Date>).gte = new Date(params.from);
    if (params.to) (where.createdAt as Record<string, Date>).lte = new Date(params.to + "T23:59:59");
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/ayarlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Ayarlar</Link>
      <h1 className="panel-heading">Audit Log</h1>
      <div className="panel-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 bg-slate-50/50">
          <form method="get" className="flex flex-wrap gap-2 items-center">
            <input name="from" type="date" defaultValue={params.from} className="panel-input w-40 py-2 text-sm" />
            <input name="to" type="date" defaultValue={params.to} className="panel-input w-40 py-2 text-sm" />
            <select name="user" className="panel-select w-44 text-sm">
              <option value="">Tüm kullanıcılar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <select name="entity" className="panel-select w-44 text-sm">
              <option value="">Tüm tipler</option>
              <option value="Category">Category</option>
              <option value="Product">Product</option>
              <option value="InventoryMovement">InventoryMovement</option>
              <option value="Project">Project</option>
              <option value="Expense">Expense</option>
            </select>
            <select name="action" className="panel-select w-40 text-sm">
              <option value="">Tüm aksiyonlar</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="archive">archive</option>
              <option value="cancel">cancel</option>
            </select>
            <button type="submit" className="panel-btn-primary py-2">Filtrele</button>
          </form>
        </div>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kullanıcı</th>
                <th>Entity</th>
                <th>ID</th>
                <th>Aksiyon</th>
                <th>Sebep</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-slate-500">{new Date(log.createdAt).toLocaleString("tr-TR")}</td>
                  <td>{log.user.name} ({log.user.email})</td>
                  <td>{log.entityType}</td>
                  <td className="font-mono text-xs text-slate-600">{log.entityId.slice(0, 8)}</td>
                  <td>{log.action}</td>
                  <td className="text-slate-500">{log.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <p className="panel-empty">Kayıt yok.</p>}
      </div>
    </div>
  );
}
