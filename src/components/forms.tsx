"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Upload, X } from "lucide-react";
import type { ActionResult } from "@/lib/action";
import { Button, buttonVariants } from "./ui";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type Action = (prev: ActionResult, form: FormData) => Promise<ActionResult>;

/** Form bound to a server action; shows toast feedback + inline error. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
  showError = true,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  showError?: boolean;
}) {
  // toast straight from the action so feedback survives the form unmounting after a refresh
  const [state, formAction] = useActionState(async (prev: ActionResult, fd: FormData) => {
    const res = await action(prev, fd);
    if (res?.ok && res.message) toast.success(res.message);
    else if (res && !res.ok && res.error) toast.error(res.error);
    return res;
  }, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state?.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    onSuccess?.();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {showError && state && !state.ok && state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <ul className="mt-3 space-y-0.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>• {v}</li>
          ))}
        </ul>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  className,
  variant,
  size,
  pendingText,
  name,
  value,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || rest.disabled}
      variant={variant}
      size={size}
      className={className}
      {...rest}
      onClick={(e) => {
        // Submitter name/value is dropped once the button disables itself, so mirror it into a hidden field
        if (name) {
          const form = e.currentTarget.form;
          if (form) {
            let input = form.querySelector<HTMLInputElement>(`input[data-submitter="${name}"]`);
            if (!input) {
              input = document.createElement("input");
              input.type = "hidden";
              input.name = name;
              input.dataset.submitter = name;
              form.appendChild(input);
            }
            input.value = String(value ?? "");
          }
        }
        rest.onClick?.(e);
      }}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

/** One-click button that runs a server action with fixed data (optionally confirm first). */
export function ActionButton({
  action,
  data,
  children,
  confirm,
  variant,
  size,
  className,
  title,
}: {
  action: (form: FormData) => Promise<ActionResult | void>;
  data?: Record<string, string>;
  children: React.ReactNode;
  confirm?: string;
  className?: string;
  title?: string;
} & VariantProps<typeof buttonVariants>) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      title={title}
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData();
        Object.entries(data ?? {}).forEach(([k, v]) => fd.append(k, v));
        start(async () => {
          const res = await action(fd);
          if (res && !res.ok && res.error) toast.error(res.error);
          else if (res && res.ok && res.message) toast.success(res.message);
          router.refresh();
        });
      }}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function PasswordInput({ id, name, placeholder, showStrength, required, minLength }: { id?: string; name: string; placeholder?: string; showStrength?: boolean; required?: boolean; minLength?: number }) {
  const [show, setShow] = useState(false);
  const [val, setVal] = useState("");
  const strength = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(val)).length;
  const labels = ["Terlalu lemah", "Lemah", "Sedang", "Kuat", "Sangat kuat"];
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="field pr-11"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink" aria-label="Tampilkan kata sandi">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {showStrength && val && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < strength ? (strength <= 1 ? "bg-red-500" : strength === 2 ? "bg-amber-500" : "bg-emerald-600") : "bg-line")} />
            ))}
          </div>
          <span className="text-xs font-medium text-muted">{labels[strength]}</span>
        </div>
      )}
    </div>
  );
}

/** Chip input stored as comma separated hidden value */
export function TagInput({
  name,
  defaultValue = [],
  suggestions = [],
  placeholder = "Ketik lalu Enter",
  max = 20,
}: {
  name: string;
  defaultValue?: string[];
  suggestions?: string[];
  placeholder?: string;
  max?: number;
}) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [text, setText] = useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (!v || tags.length >= max || tags.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setTags([...tags, v]);
    setText("");
  };
  const filtered = text
    ? suggestions.filter((s) => s.toLowerCase().includes(text.toLowerCase()) && !tags.includes(s)).slice(0, 6)
    : [];
  return (
    <div className="relative">
      <input type="hidden" name={name} value={tags.join(",")} />
      <div className="field flex min-h-[44px] flex-wrap items-center gap-1.5 py-1.5!">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Hapus ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && tags.length) setTags(tags.slice(0, -1));
          }}
          onBlur={() => text && add(text)}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm outline-none"
        />
      </div>
      {filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-pop)]">
          {filtered.map((s) => (
            <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)} className="block w-full px-3 py-2 text-left text-sm hover:bg-subtle">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FileInput({
  name,
  accept,
  hint,
  preview,
  required,
}: {
  name: string;
  accept?: string;
  hint?: string;
  preview?: "image" | "video" | "none";
  required?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return (
    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-line-strong bg-canvas p-5 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          setUrl(f && preview && preview !== "none" ? URL.createObjectURL(f) : null);
        }}
      />
      {url && preview === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="preview" className="mx-auto mb-3 max-h-40 rounded-lg object-contain" />
      )}
      {url && preview === "video" && <video src={url} className="mx-auto mb-3 max-h-56 rounded-lg" controls muted />}
      <Upload className="mx-auto h-6 w-6 text-brand-600" />
      <p className="mt-2 text-sm font-semibold text-ink">{file ? file.name : "Klik untuk memilih file"}</p>
      <p className="mt-0.5 text-xs text-muted">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : hint}</p>
    </label>
  );
}

/** Lightweight modal built on <dialog> */
export function Modal({
  trigger,
  title,
  description,
  children,
  wide,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    ref.current?.close();
    setOpen(false);
  };
  return (
    <>
      <span
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => ref.current?.showModal());
        }}
        className="contents"
      >
        {trigger}
      </span>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && close()}
        className={cn(
          "m-auto w-[calc(100%-2rem)] rounded-2xl bg-surface p-0 shadow-[var(--shadow-pop)] backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
      >
        {open && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-ink">{title}</h3>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
              </div>
              <button onClick={close} className="rounded-lg p-1 text-muted hover:bg-subtle" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children(close)}</div>
          </div>
        )}
      </dialog>
    </>
  );
}

/** Modal containing an ActionForm — usable from server components */
export function FormModal({
  trigger,
  title,
  description,
  action,
  children,
  submitLabel = "Simpan",
  wide,
  submitVariant,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  wide?: boolean;
  submitVariant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  return (
    <Modal trigger={trigger} title={title} description={description} wide={wide}>
      {(close) => (
        <ActionForm action={action} onSuccess={close} className="space-y-4">
          {children}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Batal
            </Button>
            <SubmitButton variant={submitVariant} pendingText="Memproses…">
              {submitLabel}
            </SubmitButton>
          </div>
        </ActionForm>
      )}
    </Modal>
  );
}

/** Auto-submitting select for filter bars (GET forms) */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { options, ...rest } = props;
  return (
    <select
      {...rest}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={cn("field w-auto! py-2! pr-8", rest.className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function CopyLinkButton({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        const url = window.location.origin + path;
        try {
          if (navigator.share) await navigator.share({ url });
          else {
            await navigator.clipboard.writeText(url);
            toast.success("Link disalin");
          }
        } catch {
          /* user cancelled */
        }
      }}
    >
      {children}
    </Button>
  );
}
