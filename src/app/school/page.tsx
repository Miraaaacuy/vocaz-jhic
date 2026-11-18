import Link from "@/components/link";
import { Briefcase, CheckCircle2, GraduationCap, PartyPopper, Search, Trophy, UserCheck, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { verifyStudent } from "@/server/school-actions";
import { BarChartCard, DonutChart } from "@/components/charts";
import { ActionButton } from "@/components/forms";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, WelcomeBanner, StatCard } from "@/components/ui";
import { APP_STATUS_LABEL, APP_STATUS_TONE } from "@/lib/constants";
import { pct, strArr, timeAgo } from "@/lib/utils";

export default async function SchoolDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { school } = await requireSchool();
  const [students, apps, pending] = await Promise.all([
    db.studentProfile.findMany({ where: { schoolId: school.id }, select: { id: true, major: true, seekingStatus: true, schoolVerified: true } }),
    db.application.findMany({
      where: { student: { schoolId: school.id } },
      include: { job: { include: { company: { select: { name: true } } } }, student: { include: { user: { select: { name: true, avatarUrl: true } } } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.studentProfile.findMany({ where: { schoolId: school.id, schoolVerified: false }, include: { user: true }, take: 5 }),
  ]);
  const hired = apps.filter((a) => a.status === "HIRED");
  const hiredStudents = new Set(hired.map((h) => h.studentId));
  const seeking = students.filter((s) => s.seekingStatus !== "NOT_LOOKING").length;
  const activeApplicants = new Set(apps.filter((a) => !["REJECTED", "WITHDRAWN", "HIRED"].includes(a.status)).map((a) => a.studentId)).size;
  const programs = strArr(school.programs);
  const byMajor = programs.map((p) => ({ name: p.replace("Teknik ", "T. ").replace("Rekayasa Perangkat Lunak", "RPL").replace("Komputer dan Jaringan", "Komp. & Jaringan"), value: students.filter((s) => s.major === p).length }));
  const funnel = [
    { name: "Mencari peluang", value: seeking },
    { name: "Sedang melamar", value: activeApplicants },
    { name: "Diterima kerja", value: hiredStudents.size },
  ];

  return (
    <>
      {welcome && (
        <Card className="mb-6 flex items-center gap-4 border-emerald-200 bg-emerald-50 p-5">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-900">Akun BKK siap! Siswa yang memilih {school.name} saat mendaftar akan muncul di menu Siswa untuk diverifikasi.</p>
        </Card>
      )}
      <WelcomeBanner tone="teal" title={`Dashboard BKK · ${school.name}`} description="Monitor Students → Validate → Connect to Industry → Monitor Placement" action={<ButtonLink variant="white" href="/school/career/recommended">Lihat rekomendasi peluang</ButtonLink>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total siswa" value={students.length} icon={Users} />
        <StatCard label="Terverifikasi" value={students.filter((s) => s.schoolVerified).length} icon={UserCheck} tone="teal" hint={`${pct(students.filter((s) => s.schoolVerified).length, students.length)}% dari total`} />
        <StatCard label="Mencari peluang" value={seeking} icon={Search} tone="sky" />
        <StatCard label="Aktivitas rekrutmen" value={apps.length} icon={Briefcase} tone="amber" hint={`${activeApplicants} siswa sedang melamar`} />
        <StatCard label="Penempatan" value={hiredStudents.size} icon={Trophy} tone="dark" hint={`${pct(hiredStudents.size, students.length)}% placement rate`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Siswa per program keahlian" />
          <div className="p-4">
            <BarChartCard data={byMajor} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Career funnel" />
          <div className="p-5">
            <DonutChart data={funnel} height={170} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Aktivitas rekrutmen terbaru"
            action={
              <Link href="/school/career/recruitment" className="text-sm font-semibold text-brand-600 hover:underline">
                Semua
              </Link>
            }
          />
          {apps.length === 0 ? (
            <EmptyState icon={Briefcase} title="Belum ada aktivitas rekrutmen" />
          ) : (
            <ul className="divide-y divide-line">
              {apps.slice(0, 7).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar src={a.student.user.avatarUrl} name={a.student.user.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/school/students/${a.studentId}`} className="block truncate text-sm font-semibold text-ink hover:text-brand-600">
                      {a.student.user.name}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {a.job.title} · {a.job.company.name}
                    </p>
                  </div>
                  <Badge tone={APP_STATUS_TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                  <span className="hidden text-xs text-muted sm:block">{timeAgo(a.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Menunggu verifikasi"
            description={`${pending.length} siswa`}
            action={
              <Link href="/school/students?status=pending" className="text-sm font-semibold text-brand-600 hover:underline">
                Semua
              </Link>
            }
          />
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Semua siswa terverifikasi" />
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar src={s.user.avatarUrl} name={s.user.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.user.name}</p>
                    <p className="truncate text-xs text-muted">
                      {s.major} · {s.graduationYear}
                    </p>
                  </div>
                  <ActionButton action={verifyStudent} data={{ id: s.id }} size="sm" variant="teal">
                    <GraduationCap className="h-3.5 w-3.5" /> Verifikasi
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
