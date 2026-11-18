import { Search, SlidersHorizontal } from "lucide-react";
import { Button, ButtonLink } from "./ui";

type Opt = string | { value: string; label: string };
export type FilterField =
  | { type: "select"; name: string; placeholder: string; options: Opt[] }
  | { type: "checkbox"; name: string; label: string; value?: string };

/** GET filter bar — works without JS */
export function FilterBar({
  action,
  q,
  qPlaceholder = "Cari…",
  fields,
  values,
  floating,
}: {
  floating?: boolean;
  action: string;
  q?: string;
  qPlaceholder?: string;
  fields: FilterField[];
  values: Record<string, string | undefined>;
}) {
  const active = fields.some((f) => values[f.name]) || !!q;
  // with many filters the search box gets its own row instead of being squeezed beside them
  const inline = fields.length <= 3;
  return (
    <form
      action={action}
      className={`card mb-6 flex flex-col gap-3 p-3 ${inline ? "lg:flex-row lg:items-center" : ""} ${floating ? "relative z-10 -mt-12 shadow-[var(--shadow-pop)]" : ""}`}
    >
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
        <input name="q" aria-label={qPlaceholder} defaultValue={q} placeholder={qPlaceholder} className="field h-11 rounded-full! border-transparent bg-subtle pl-11 focus:bg-surface" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="hidden h-4 w-4 text-muted lg:block" />
        {fields.map((f) =>
          f.type === "select" ? (
            <select key={f.name} name={f.name} aria-label={f.placeholder} defaultValue={values[f.name] ?? ""} className="field h-11 w-auto! max-w-full rounded-full! py-2! pr-8 text-sm">
              <option value="">{f.placeholder}</option>
              {f.options.map((o) => {
                const v = typeof o === "string" ? o : o.value;
                const l = typeof o === "string" ? o : o.label;
                return (
                  <option key={v} value={v}>
                    {l}
                  </option>
                );
              })}
            </select>
          ) : (
            <label key={f.name} className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-body transition hover:border-brand-300 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800">
              <input type="checkbox" name={f.name} value={f.value ?? "1"} defaultChecked={!!values[f.name]} className="h-4 w-4" />
              {f.label}
            </label>
          ),
        )}
        <Button type="submit" className="h-11 rounded-full px-5">
          Terapkan
        </Button>
        {active && (
          <ButtonLink href={action} variant="ghost" className="h-11 rounded-full">
            Reset
          </ButtonLink>
        )}
      </div>
    </form>
  );
}

export function qs(base: Record<string, string | undefined>, patch: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
