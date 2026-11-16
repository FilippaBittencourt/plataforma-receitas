import { useEffect, useState } from "react";
import { CheckCircle2, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { Toaster, toast as sonnerToast } from "sonner";
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
import { cn } from "@/lib/utils";

type NoticeRequest = Extract<FeedbackRequest, { kind: "notice" }>;
type InputRequest = Extract<FeedbackRequest, { kind: "input" }>;

const noticeStyles = {
  success: {
    icon: CheckCircle2,
    label: "Sucesso",
    className: "bg-verified/10 text-verified",
  },
  error: {
    icon: CircleX,
    label: "Erro",
    className: "bg-destructive/10 text-destructive",
  },
  warning: {
    icon: TriangleAlert,
    label: "Atenção",
    className: "bg-caramel/10 text-caramel",
  },
  info: {
    icon: Info,
    label: "Informação",
    className: "bg-primary/10 text-primary",
  },
} as const;

function NoticeToast({ request, id }: { request: NoticeRequest; id: string | number }) {
  const style = noticeStyles[request.tone];
  const Icon = style.icon;
  return (
    <div
      className={cn(
        "flex w-[min(calc(100vw-2rem),21rem)] border border-border bg-card px-3 py-2.5 shadow-soft",
        "animate-in fade-in-0 slide-in-from-right-3 duration-200",
        request.description ? "items-start rounded-2xl" : "items-center rounded-xl",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl",
          request.description && "mt-0.5",
          style.className,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="ml-2.5 min-w-0 flex-1 text-foreground">
        <p className="text-[13px] font-semibold leading-5">{request.title || style.label}</p>
        {request.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {request.description}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Fechar mensagem"
        onClick={() => sonnerToast.dismiss(id)}
        className="ml-3 shrink-0 rounded-full p-1 text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X width={15} height={15} />
      </button>
    </div>
  );
}

function showNotice(request: NoticeRequest) {
  sonnerToast.custom((id) => <NoticeToast request={request} id={id} />, {
    duration: request.tone === "error" ? 7000 : 4500,
    unstyled: true,
  });
}

export function FeedbackModal() {
  const [queue, setQueue] = useState<InputRequest[]>([]);
  const [input, setInput] = useState("");
  const current = queue[0];

  useEffect(() => {
    const handleFeedback = (event: Event) => {
      const request = (event as CustomEvent<FeedbackRequest>).detail;
      if (request.kind === "notice") {
        showNotice(request);
        return;
      }
      setQueue((requests) => [...requests, request]);
    };
    window.addEventListener(FEEDBACK_EVENT, handleFeedback);
    return () => window.removeEventListener(FEEDBACK_EVENT, handleFeedback);
  }, []);

  const finish = (value: string | null = null) => {
    if (!current) return;
    current.resolve(value);
    setInput("");
    setQueue((requests) => requests.slice(1));
  };

  return (
    <>
      <Toaster
        position="top-right"
        offset={{ top: 80, right: 20 }}
        mobileOffset={{ top: 76, right: 12, left: 12 }}
        gap={12}
        visibleToasts={4}
        expand
      />
      <Dialog open={Boolean(current)} onOpenChange={(open) => !open && finish()}>
        {current && (
          <DialogContent className="max-w-md rounded-[1.75rem] border-border bg-card p-6 shadow-soft sm:p-7">
            <DialogHeader className="text-left">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-warm text-caramel">
                <Info width={21} height={21} />
              </div>
              <DialogTitle className="font-display text-2xl text-foreground">
                {current.title}
              </DialogTitle>
              <DialogDescription className="pt-1 text-sm leading-relaxed">
                {current.description}
              </DialogDescription>
            </DialogHeader>

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
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => finish()}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-full" disabled={!input.trim()}>
                  {current.confirmLabel}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
