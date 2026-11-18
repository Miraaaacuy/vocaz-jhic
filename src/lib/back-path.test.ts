import { describe, expect, it } from "vitest";
import { parentPath } from "./back-path";

describe("parentPath (back button fallback)", () => {
  it("has no back button on root pages", () => {
    for (const p of ["/", "/student", "/company", "/school", "/institution", "/admin"]) expect(parentPath(p)).toBeNull();
  });

  it("sends public pages up to their list, lists up to the homepage", () => {
    expect(parentPath("/lowongan")).toBe("/");
    expect(parentPath("/login")).toBe("/");
    expect(parentPath("/lowongan/abc123")).toBe("/lowongan");
    expect(parentPath("/talenta/muhammad-ilham")).toBe("/talenta");
  });

  it("sends dashboard pages up to their section, sections up to the dashboard", () => {
    expect(parentPath("/student/settings")).toBe("/student");
    expect(parentPath("/student/career/jobs/9")).toBe("/student/career");
    expect(parentPath("/company/recruitment/abc/edit")).toBe("/company/recruitment");
    expect(parentPath("/admin/users/42")).toBe("/admin/users");
  });
});
