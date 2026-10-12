import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "react-toastify";

export const PHOTO_MAX_COUNT = 10;
const PHOTO_MAX_MO = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface PhotoPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
}

/** Sélection de photos à joindre à la création : miniatures, retrait, la première est la photo principale. */
export function PhotoPicker({ files, onChange, label = "Photos" }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function handleSelect(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (!PHOTO_TYPES.includes(f.type)) toast.error(`${f.name} : format non accepté (JPEG, PNG ou WebP).`);
      else if (f.size > PHOTO_MAX_MO * 1024 * 1024) toast.error(`${f.name} : dépasse ${PHOTO_MAX_MO} Mo.`);
      else accepted.push(f);
    }
    const merged = [...files, ...accepted];
    if (merged.length > PHOTO_MAX_COUNT) toast.error(`Maximum ${PHOTO_MAX_COUNT} photos.`);
    onChange(merged.slice(0, PHOTO_MAX_COUNT));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_TYPES.join(",")}
        multiple
        className="sr-only"
        id="photo-picker-input"
        onChange={(e) => handleSelect(e.target.files)}
      />
      <div className="flex flex-wrap gap-2">
        {previews.map((url, i) => (
          <div key={url} className="relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute inset-x-0 bottom-0 bg-primary-700/80 text-center text-[10px] font-medium text-white">Principale</span>
            )}
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              aria-label={`Retirer la photo ${i + 1}`}
              className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/60 p-0.5 text-white hover:bg-slate-900"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {files.length < PHOTO_MAX_COUNT && (
          <label
            htmlFor="photo-picker-input"
            className="flex h-16 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-primary-300 text-xs text-primary-600 hover:bg-primary-50"
          >
            <ImagePlus size={18} aria-hidden="true" />
            Ajouter
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">JPEG, PNG ou WebP, {PHOTO_MAX_MO} Mo max chacune, {PHOTO_MAX_COUNT} photos maximum.</p>
    </div>
  );
}
