import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

// Seleção de foto com prévia local. O protótipo não envia o arquivo para lugar nenhum.
export function PhotoPicker({
  id,
  icon,
  title,
  hint,
  className,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  hint: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem (PNG ou JPG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("A foto precisa ter até 5 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    setPreview(undefined);
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

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <img
            src={preview}
            alt="Prévia da foto escolhida"
            className="max-h-80 w-full object-cover"
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full"
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
            pick(e.dataTransfer.files[0]);
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
            onClick={() => inputRef.current?.click()}
          >
            Escolher arquivo
          </Button>
        </div>
      )}
    </div>
  );
}
