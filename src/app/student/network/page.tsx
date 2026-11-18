import Link from "@/components/link";
import { Check, UserPlus, Users, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { listTalents } from "@/server/queries";
import { talentInclude, toTalentCard } from "@/lib/match-data";
import { acceptConnection } from "@/server/student-actions";
import { CITIES, MAJORS } from "@/lib/constants";
import { FilterBar, qs } from "@/components/filters";
import { TalentCard } from "@/components/cards";
import { ActionButton } from "@/components/forms";
import { Avatar, Card, EmptyState, PageHeader, Pagination, Tabs } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

type SP = { q?: string; major?: string; city?: string; tab?: string; page?: string };

export default async function Network({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { user, student } = await requireStudent();
  const page = Math.max(1, Number(sp.page) || 1);
  const [requests, connections] = await Promise.all([
    db.connection.findMany({ where: { addresseeId: user.id, status: "PENDING" }, include: { requester: { include: { student: true } } }, orderBy: { createdAt: "desc" } }),
    db.connection.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { addresseeId: user.id }] } }),
  ]);
  const tabs = [
    { href: "/student/network", label: "Explore Talent" },
    { href: "/student/network?tab=connections", label: "Koneksi", count: connections.length },
    { href: "/student/network?tab=requests", label: "Permintaan", count: requests.length },
  ];
  const active = sp.tab === "connections" ? tabs[1].href : sp.tab === "requests" ? tabs[2].href : tabs[0].href;

  let body: React.ReactNode;
  if (sp.tab === "requests") {
    body = requests.length ? (
      <Card>
        <ul className="divide-y divide-line">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-4">
              <Avatar src={r.requester.avatarUrl} name={r.requester.name} size={44} />
              <div className="min-w-0 flex-1">
                <Link href={`/student/network/${r.requester.student?.slug}`} className="font-semibold text-ink hover:text-brand-600">
                  {r.requester.name}
                </Link>
                <p className="text-sm text-muted">
                  {r.requester.student?.headline ?? r.requester.student?.major} · {timeAgo(r.createdAt)}
                </p>
              </div>
              <ActionButton action={acceptConnection} data={{ id: r.id }} size="sm">
                <Check className="h-4 w-4" /> Terima
              </ActionButton>
              <ActionButton action={acceptConnection} data={{ id: r.id, decline: "1" }} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </ActionButton>
            </li>
          ))}
        </ul>
      </Card>
    ) : (
      <Card>
        <EmptyState icon={UserPlus} title="Tidak ada permintaan koneksi" />
      </Card>
    );
  } else if (sp.tab === "connections") {
    const ids = connections.map((c) => (c.requesterId === user.id ? c.addresseeId : c.requesterId));
    const rows = await db.studentProfile.findMany({ where: { userId: { in: ids } }, include: talentInclude });
    body = rows.length ? (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((t) => (
          <TalentCard key={t.id} t={toTalentCard(t)} href={`/student/network/${t.slug}`} />
        ))}
      </div>
    ) : (
      <Card>
        <EmptyState icon={Users} title="Belum ada koneksi" description="Temukan teman satu jurusan atau talenta lain untuk saling berbagi pengalaman." />
      </Card>
    );
  } else {
    const { rows, totalPages } = await listTalents(sp, page);
    const list = rows.filter((r) => r.id !== student.id);
    body = (
      <>
        <FilterBar
          action="/student/network"
          q={sp.q}
          qPlaceholder="Cari nama atau skill…"
          values={sp}
          fields={[
            { type: "select", name: "major", placeholder: "Semua jurusan", options: MAJORS },
            { type: "select", name: "city", placeholder: "Semua kota", options: Object.keys(CITIES).sort() },
          ]}
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <TalentCard key={t.id} t={toTalentCard(t)} href={`/student/network/${t.slug}`} />
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} makeHref={(p) => `/student/network${qs(sp, { page: p })}`} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Talent Network" description="Temukan dan terhubung dengan talenta vokasi lainnya — belajar bersama, berbagi pengalaman." />
      <Tabs tabs={tabs} active={active} />
      {body}
    </>
  );
}
