import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { toast } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;

export function PhotoPicker({
  id,
  icon,
  title,
  hint,
  className,
  variant = "default",
  currentImage,
  onUploaded,
  onUploadingChange,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  hint: string;
  className?: string;
  variant?: "default" | "avatar";
  currentImage?: string | null;
  onUploaded?: (url: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [preview, setPreview] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const image = preview ?? currentImage ?? undefined;

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pick = async (file: File | undefined) => {
    if (!file || uploadingRef.current) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem (PNG ou JPG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("A foto precisa ter até 5 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    if (onUploaded) {
      uploadingRef.current = true;
      setUploading(true);
      onUploadingChange?.(true);
      try {
        const form = new FormData();
        form.append("arquivo", file);
        const uploaded = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
        onUploaded(uploaded.url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao enviar a foto.");
        clear();
      } finally {
        uploadingRef.current = false;
        setUploading(false);
        onUploadingChange?.(false);
      }
    }
  };

  const clear = () => {
    setPreview(undefined);
    onUploaded?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div id={id} className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {variant === "avatar" ? (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-card bg-cream shadow-soft ring-1 ring-border">
            {image ? (
              <img
                src={image}
                alt="Prévia da foto de perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-caramel">
                {icon}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {image ? "Prévia da foto de perfil" : title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {image ? "Assim sua foto vai aparecer no círculo do perfil." : hint}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {image ? "Trocar foto" : "Escolher foto"}
              </Button>
              {image && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  disabled={uploading}
                  onClick={clear}
                >
                  <X width={14} height={14} /> Remover
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : image ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <img
            src={image}
            alt="Prévia da foto escolhida"
            className="max-h-80 w-full object-cover"
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Trocar
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full"
              aria-label="Remover foto"
              disabled={uploading}
              onClick={clear}
            >
              <X width={16} height={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background p-8 text-center transition-colors",
            dragging && "border-caramel bg-warm",
          )}
        >
          {icon}
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 rounded-full"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Enviando foto…" : "Escolher arquivo"}
          </Button>
        </div>
      )}
    </div>
  );
}
