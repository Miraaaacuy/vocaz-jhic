import "server-only";
import { db } from "@/lib/db";
import { computeMatch } from "@/lib/match";
import { getWeights, jobRequirement, talentInclude, toMatchTalent } from "@/lib/match-data";

export async function myMatchTalent(studentId: string) {
  const t = await db.studentProfile.findUniqueOrThrow({ where: { id: studentId }, include: talentInclude });
  return toMatchTalent(t);
}

/** Score a list of jobs for a student */
export async function scoreJobsFor<T extends Parameters<typeof jobRequirement>[0]>(studentId: string, jobs: T[]) {
  const [mt, w] = await Promise.all([myMatchTalent(studentId), getWeights()]);
  return jobs.map((j) => ({ job: j, match: computeMatch(mt, jobRequirement(j), w) }));
}
