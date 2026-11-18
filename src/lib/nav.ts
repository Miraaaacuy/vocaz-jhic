import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: string; children?: { href: string; label: string }[] };
export type NavGroup = { title?: string; items: NavItem[] };

// icon names map to lucide icons in components/layout/sidebar.tsx
export const NAV: Record<Role, NavGroup[]> = {
  STUDENT: [
    {
      items: [
        { href: "/student", label: "Dashboard", icon: "home" },
        {
          href: "/student/profile",
          label: "My Profile",
          icon: "user",
          children: [
            { href: "/student/profile", label: "Informasi Pribadi" },
            { href: "/student/profile/education", label: "Pendidikan & Pengalaman" },
            { href: "/student/profile/skills", label: "Skill & Prestasi" },
            { href: "/student/profile/portfolio", label: "Portfolio" },
            { href: "/student/profile/certifications", label: "Sertifikasi" },
            { href: "/student/profile/preview", label: "Preview Profil" },
          ],
        },
      ],
    },
    {
      title: "Karier",
      items: [
        {
          href: "/student/career",
          label: "Career Hub",
          icon: "briefcase",
          children: [
            { href: "/student/career", label: "Explore Jobs" },
            { href: "/student/career/saved", label: "Tersimpan" },
            { href: "/student/career/applications", label: "Lamaran Saya" },
          ],
        },
        {
          href: "/student/showcase",
          label: "Video Showcase",
          icon: "video",
          children: [
            { href: "/student/showcase", label: "Explore Videos" },
            { href: "/student/showcase/mine", label: "My Showcase" },
            { href: "/student/showcase/upload", label: "Upload Video" },
          ],
        },
        { href: "/student/network", label: "Talent Network", icon: "users" },
      ],
    },
    {
      title: "Akun",
      items: [
        { href: "/student/messages", label: "Messages", icon: "message" },
        { href: "/student/notifications", label: "Notifikasi", icon: "bell" },
        { href: "/student/settings", label: "Pengaturan", icon: "settings" },
      ],
    },
  ],
  COMPANY: [
    {
      items: [
        { href: "/company", label: "Dashboard", icon: "home" },
        {
          href: "/company/recruitment",
          label: "Rekrutmen",
          icon: "briefcase",
          children: [
            { href: "/company/recruitment", label: "Lowongan Aktif" },
            { href: "/company/recruitment/drafts", label: "Draft" },
            { href: "/company/recruitment/history", label: "Riwayat Lowongan" },
            { href: "/company/recruitment/new", label: "Buat Lowongan" },
          ],
        },
        {
          href: "/company/talent-match",
          label: "Smart Talent Match",
          icon: "sparkles",
          children: [
            { href: "/company/talent-match", label: "Talent Search" },
            { href: "/company/talent-match/saved", label: "Talent Tersimpan" },
          ],
        },
        { href: "/company/showcase", label: "Video Showcase", icon: "video" },
        { href: "/company/messages", label: "Messages", icon: "message" },
      ],
    },
    {
      title: "Perusahaan",
      items: [
        { href: "/company/profile", label: "Company Profile", icon: "building" },
        { href: "/company/verification", label: "Verifikasi", icon: "shield" },
        { href: "/company/team", label: "Tim Rekruter", icon: "users" },
        { href: "/company/preferences", label: "Talent Preferences", icon: "sliders" },
        { href: "/company/notifications", label: "Notifikasi", icon: "bell" },
        { href: "/company/settings", label: "Pengaturan", icon: "settings" },
      ],
    },
  ],
  SCHOOL: [
    {
      items: [
        { href: "/school", label: "Dashboard", icon: "home" },
        { href: "/school/students", label: "Siswa", icon: "users" },
        {
          href: "/school/career",
          label: "Career Monitoring",
          icon: "chart",
          children: [
            { href: "/school/career", label: "Job Opportunities" },
            { href: "/school/career/recommended", label: "Rekomendasi" },
            { href: "/school/career/recruitment", label: "Status Rekrutmen" },
            { href: "/school/career/placement", label: "Penempatan" },
          ],
        },
      ],
    },
    {
      title: "Sekolah",
      items: [
        { href: "/school/profile", label: "Profil Sekolah", icon: "school" },
        { href: "/school/partners", label: "Mitra Industri", icon: "handshake" },
        { href: "/school/notifications", label: "Notifikasi", icon: "bell" },
        { href: "/school/settings", label: "Pengaturan", icon: "settings" },
      ],
    },
  ],
  INSTITUTION: [
    {
      items: [
        { href: "/institution", label: "Dashboard", icon: "home" },
        { href: "/institution/verification", label: "Verifikasi", icon: "shield" },
        { href: "/institution/records", label: "Certificate Records", icon: "award" },
      ],
    },
    {
      title: "Lembaga",
      items: [
        { href: "/institution/profile", label: "Profil Lembaga", icon: "building" },
        { href: "/institution/notifications", label: "Notifikasi", icon: "bell" },
        { href: "/institution/settings", label: "Pengaturan", icon: "settings" },
      ],
    },
  ],
  ADMIN: [
    {
      items: [
        { href: "/admin", label: "Dashboard", icon: "home" },
        { href: "/admin/users", label: "User Management", icon: "users" },
        { href: "/admin/company-verification", label: "Verifikasi Perusahaan", icon: "shield" },
        { href: "/admin/moderation", label: "Moderasi Konten", icon: "flag" },
        { href: "/admin/monitoring", label: "Platform Monitoring", icon: "chart" },
      ],
    },
    {
      title: "Sistem",
      items: [
        { href: "/admin/settings", label: "System Settings", icon: "settings" },
        { href: "/admin/profile", label: "Admin Profile", icon: "user" },
      ],
    },
  ],
};
