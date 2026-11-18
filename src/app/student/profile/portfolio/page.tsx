import { ExternalLink, FolderOpen, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { addPortfolio, deleteItem } from "@/server/student-actions";
import { ActionButton, FileInput, FormModal, TagInput } from "@/components/forms";
import { Badge, Button, Card, Chip, EmptyState, Field, Input, Textarea } from "@/components/ui";
import { strArr } from "@/lib/utils";
import { ProfileTabs } from "../tabs";

export default async function PortfolioPage() {
  const { student } = await requireStudent();
  const items = await db.portfolioItem.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" } });
  const addBtn = (
    <FormModal
      title="Tambah portfolio"
      action={addPortfolio}
      wide
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> Tambah Portfolio
        </Button>
      }
    >
      <Field label="Judul proyek" required>
        <Input name="title" required placeholder="cth. Aplikasi Kasir UMKM" />
      </Field>
      <Field label="Deskripsi">
        <Textarea name="description" rows={3} placeholder="Apa yang kamu kerjakan, tools yang dipakai, dan hasilnya." />
      </Field>
      <Field label="Link proyek (GitHub, Behance, Drive, dsb.)">
        <Input name="url" type="url" placeholder="https://…" />
      </Field>
      <Field label="Tag / skill">
        <TagInput name="tags" placeholder="cth. Laravel" />
      </Field>
      <Field label="Gambar / screenshot">
        <FileInput name="image" accept="image/*" preview="image" hint="JPG/PNG, maks. 5 MB" />
      </Field>
    </FormModal>
  );
  return (
    <>
      <ProfileTabs active="/student/profile/portfolio" />
      <div className="mb-4 flex justify-end">{addBtn}</div>
      {items.length === 0 ? (
        <Card>
          <EmptyState icon={FolderOpen} title="Belum ada portfolio" description="Tunjukkan hasil karya terbaikmu — proyek sekolah, PKL, atau lomba." />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-subtle text-muted">
                  <FolderOpen className="h-10 w-10" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{p.title}</p>
                  {p.status === "HIDDEN" && <Badge tone="danger">Disembunyikan admin</Badge>}
                </div>
                {p.description && <p className="mt-1 line-clamp-3 text-sm text-muted">{p.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {strArr(p.tags).map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                      Buka <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span />
                  )}
                  <ActionButton action={deleteItem} data={{ kind: "portfolio", id: p.id }} confirm="Hapus portfolio ini?" variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" /> Hapus
                  </ActionButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
