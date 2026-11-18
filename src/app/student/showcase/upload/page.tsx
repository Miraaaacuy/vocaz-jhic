import { Lightbulb } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { uploadVideo } from "@/server/student-actions";
import { ActionForm, FileInput, SubmitButton, TagInput } from "@/components/forms";
import { Card, CardHeader, Field, Input, PageHeader, Tabs, Textarea } from "@/components/ui";
import { SHOWCASE_TABS } from "../tabs";

export default async function UploadVideo() {
  const { student } = await requireStudent();
  const skills = await db.studentSkill.findMany({ where: { studentId: student.id }, include: { skill: true } });
  return (
    <>
      <PageHeader title="Video Talent Showcase" description="Unggah video yang menunjukkan kemampuanmu secara nyata." />
      <Tabs tabs={SHOWCASE_TABS} active="/student/showcase/upload" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Upload video baru" />
          <ActionForm action={uploadVideo} className="space-y-5 p-5">
            <Field label="Judul video" required>
              <Input name="title" required placeholder="cth. Live coding: membuat REST API dengan Express" maxLength={120} />
            </Field>
            <Field label="Deskripsi">
              <Textarea name="description" rows={3} placeholder="Apa yang kamu tunjukkan di video ini?" />
            </Field>
            <Field label="Skill yang ditampilkan">
              <TagInput name="skills" suggestions={skills.map((s) => s.skill.name)} placeholder="cth. Node.js" />
            </Field>
            <Field label="File video" hint="MP4 / WEBM / MOV, maks. 100 MB. Disarankan durasi 30 detik – 3 menit.">
              <FileInput name="video" accept="video/mp4,video/webm,video/quicktime" preview="video" hint="Klik untuk memilih video" />
            </Field>
            <div className="flex items-center gap-3 text-xs font-semibold text-muted uppercase">
              <span className="h-px flex-1 bg-line" /> atau <span className="h-px flex-1 bg-line" />
            </div>
            <Field label="URL video (.mp4)" hint="Jika video sudah di-hosting di tempat lain.">
              <Input name="videoUrl" type="url" placeholder="https://…/video.mp4" />
            </Field>
            <Field label="Thumbnail (opsional)">
              <FileInput name="thumbnail" accept="image/*" preview="image" hint="JPG/PNG, maks. 5 MB" />
            </Field>
            <SubmitButton size="lg" className="w-full" pendingText="Mengunggah video…">
              Publikasikan Video
            </SubmitButton>
          </ActionForm>
        </Card>
        <Card className="h-fit p-5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Lightbulb className="h-5 w-5 text-amber-500" /> Tips video yang menarik
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-body">
            <li>🎯 Fokus pada satu skill utama per video.</li>
            <li>🗣️ Perkenalkan diri singkat di 5 detik pertama.</li>
            <li>💡 Pastikan pencahayaan cukup dan suara jelas.</li>
            <li>🛠️ Tunjukkan proses, bukan hanya hasil akhir.</li>
            <li>⏱️ Durasi ideal 30 detik – 3 menit.</li>
            <li>🦺 Untuk praktik bengkel, gunakan APD sesuai K3.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
