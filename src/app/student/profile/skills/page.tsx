import { BadgeCheck, Plus, Trash2, Trophy, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { addAchievement, addSkill, deleteItem, removeSkill } from "@/server/student-actions";
import { ActionButton, ActionForm, FormModal, SubmitButton, TagInput } from "@/components/forms";
import { Button, Card, CardHeader, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { SKILL_LEVEL_LABEL } from "@/lib/constants";
import { fmtMonthYear } from "@/lib/utils";
import { ProfileTabs } from "../tabs";
import { LevelSelect } from "./level-select";

export default async function SkillsPage() {
  const { student } = await requireStudent();
  const [skills, achievements, allSkills] = await Promise.all([
    db.studentSkill.findMany({ where: { studentId: student.id }, include: { skill: true }, orderBy: { skill: { name: "asc" } } }),
    db.achievement.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" } }),
    db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <ProfileTabs active="/student/profile/skills" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Keahlian" description="Skill dan level digunakan oleh Smart Talent Match untuk menghitung kecocokan." />
          <div className="border-b border-line p-5">
            <ActionForm action={addSkill} resetOnSuccess className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                <TagInput name="skills" suggestions={allSkills.map((s) => s.name)} placeholder="Ketik skill, tekan Enter (cth. React, Las SMAW)" />
              </div>
              <Select name="level" defaultValue="INTERMEDIATE" className="sm:w-36" options={Object.entries(SKILL_LEVEL_LABEL).map(([value, label]) => ({ value, label }))} />
              <SubmitButton>
                <Plus className="h-4 w-4" /> Tambah
              </SubmitButton>
            </ActionForm>
          </div>
          {skills.length === 0 ? (
            <EmptyState icon={Wrench} title="Belum ada skill" description="Tambahkan minimal 3 skill agar mudah ditemukan perusahaan." />
          ) : (
            <ul className="divide-y divide-line">
              {skills.map((s) => (
                <li key={s.skillId} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex flex-1 items-center gap-2 font-medium text-ink">
                    {s.skill.name}
                    {s.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <BadgeCheck className="h-3 w-3" /> Terverifikasi
                      </span>
                    )}
                  </span>
                  <LevelSelect skillId={s.skillId} level={s.level} />
                  <ActionButton action={removeSkill} data={{ skillId: s.skillId }} variant="ghost" size="icon" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Prestasi"
            action={
              <FormModal
                title="Tambah prestasi"
                action={addAchievement}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                }
              >
                <Field label="Judul prestasi" required>
                  <Input name="title" required placeholder="cth. Juara 1 LKS Web Technologies" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Penyelenggara">
                    <Input name="issuer" />
                  </Field>
                  <Field label="Tanggal">
                    <Input name="date" type="month" />
                  </Field>
                </div>
                <Field label="Keterangan">
                  <Textarea name="description" rows={3} />
                </Field>
              </FormModal>
            }
          />
          {achievements.length === 0 ? (
            <EmptyState icon={Trophy} title="Belum ada prestasi" />
          ) : (
            <ul className="divide-y divide-line">
              {achievements.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-4">
                  <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{a.title}</p>
                    <p className="text-sm text-muted">
                      {a.issuer} {a.date && `· ${fmtMonthYear(a.date)}`}
                    </p>
                  </div>
                  <ActionButton action={deleteItem} data={{ kind: "achievement", id: a.id }} confirm="Hapus prestasi ini?" variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
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
