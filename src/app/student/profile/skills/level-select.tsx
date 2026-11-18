"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSkillLevel } from "@/server/student-actions";
import { SKILL_LEVEL_LABEL } from "@/lib/constants";

export function LevelSelect({ skillId, level }: { skillId: string; level: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <select
      defaultValue={level}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("skillId", skillId);
        fd.set("level", e.target.value);
        start(async () => {
          await updateSkillLevel(fd);
          toast.success("Level skill diperbarui");
          router.refresh();
        });
      }}
      className="field w-auto! py-1.5! pr-7 text-xs"
    >
      {Object.entries(SKILL_LEVEL_LABEL).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
