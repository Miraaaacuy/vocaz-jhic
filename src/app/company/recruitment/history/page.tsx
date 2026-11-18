import { JobsTablePage } from "../jobs-table";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <JobsTablePage status="CLOSED" q={q} />;
}
