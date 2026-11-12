import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_EVENT, type FeedbackRequest } from "@/lib/feedback";

export function FeedbackModal() {
  const [queue, setQueue] = useState<FeedbackRequest[]>([]);
  const [input, setInput] = useState("");
  const current = queue[0];

  useEffect(() => {
    const handleFeedback = (event: Event) => {
      const request = (event as CustomEvent<FeedbackRequest>).detail;
      setQueue((requests) => [...requests, request]);
    };
    window.addEventListener(FEEDBACK_EVENT, handleFeedback);
    return () => window.removeEventListener(FEEDBACK_EVENT, handleFeedback);
  }, []);

  const finish = (value: string | null = null) => {
    if (!current) return;
    if (current.kind === "input") current.resolve(value);
    setInput("");
    setQueue((requests) => requests.slice(1));
  };

  return (
    <Dialog open={Boolean(current)} onOpenChange={(open) => !open && finish()}>
      {current && (
        <DialogContent className="max-w-md rounded-[1.75rem] border-border bg-card p-6 shadow-soft sm:p-7">
          <DialogHeader className="text-left">
            <div
              className={`mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                current.kind === "notice" && current.tone === "error"
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-border bg-warm text-caramel"
              }`}
            >
              {current.kind === "notice" && current.tone === "error" ? (
                <AlertCircle width={21} height={21} />
              ) : (
                <CheckCircle2 width={21} height={21} />
              )}
            </div>
            <DialogTitle className="font-display text-2xl text-foreground">
              {current.title}
            </DialogTitle>
            {current.kind === "notice" && current.description && (
              <DialogDescription className="pt-1 text-sm leading-relaxed">
                {current.description}
              </DialogDescription>
            )}
            {current.kind === "input" && (
              <DialogDescription className="pt-1 text-sm leading-relaxed">
                {current.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {current.kind === "input" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                finish(input.trim());
              }}
            >
              <Textarea
                autoFocus
                autoComplete="off"
                maxLength={current.maxLength}
                placeholder={current.placeholder}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-28 rounded-xl bg-background"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {input.length}/{current.maxLength}
              </p>
              <DialogFooter className="mt-5 gap-2 sm:gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => finish()}>
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-full" disabled={!input.trim()}>
                  {current.confirmLabel}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <DialogFooter className="mt-2">
              <Button className="rounded-full" onClick={() => finish()}>
                Entendi
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
