type InputProps = {
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = {
  label: string;
  required?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type SelectProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

const base =
  "w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]";
const label =
  "block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-1.5";

export function Field({ label: l, required, ...props }: InputProps) {
  return (
    <div>
      <label className={label}>
        {l} {required && <span className="text-red-400">*</span>}
      </label>
      <input required={required} className={base} {...props} />
    </div>
  );
}

export function TextareaField({ label: l, required, ...props }: TextareaProps) {
  return (
    <div>
      <label className={label}>
        {l} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea required={required} className={base} rows={3} {...props} />
    </div>
  );
}

export function SelectField({
  label: l,
  required,
  children,
  ...props
}: SelectProps) {
  return (
    <div>
      <label className={label}>
        {l} {required && <span className="text-red-400">*</span>}
      </label>
      <select required={required} className={base} {...props}>
        {children}
      </select>
    </div>
  );
}

export function SubmitRow({
  onCancel,
  label = "Kaydet",
  loading = false,
}: {
  onCancel: () => void;
  label?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors disabled:opacity-50"
      >
        {loading ? "Kaydediliyor..." : label}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-5 border border-[#d4c5ba] text-[#5c4033] text-xs hover:bg-[#f5f0eb] transition-colors"
      >
        İptal
      </button>
    </div>
  );
}
