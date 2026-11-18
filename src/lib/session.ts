import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./auth";
import { db } from "./db";

export const getSession = cache(async () => auth());

export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== role) redirect("/forbidden");
  return session.user;
}

export const requireStudent = cache(async () => {
  const user = await requireRole("STUDENT");
  const student = await db.studentProfile.findUnique({ where: { userId: user.id } });
  if (!student) redirect("/login");
  return { user, student };
});

export const requireCompany = cache(async () => {
  const user = await requireRole("COMPANY");
  const member = await db.companyMember.findUnique({ where: { userId: user.id }, include: { company: true } });
  if (!member) redirect("/login");
  return { user, member, company: member.company };
});

export const requireSchool = cache(async () => {
  const user = await requireRole("SCHOOL");
  const school = await db.school.findUnique({ where: { userId: user.id } });
  if (!school) redirect("/login");
  return { user, school };
});

export const requireInstitution = cache(async () => {
  const user = await requireRole("INSTITUTION");
  const institution = await db.institution.findUnique({ where: { userId: user.id } });
  if (!institution) redirect("/login");
  return { user, institution };
});

export const requireAdmin = cache(async () => ({ user: await requireRole("ADMIN") }));
