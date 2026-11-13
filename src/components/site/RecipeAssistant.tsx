import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, ChefHat, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/use-auth";
import { api } from "@/lib/api";
import {
  formatRecipeIngredientForAssistant,
  formatRecipeStepForAssistant,
} from "@/lib/recipe-steps";
import type { Recipe } from "@/lib/mock-data";

type ChatMessage = { role: "user" | "assistant"; text: string };

function inlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.+?\*\*|__.+?__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, index) => {
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-background/70 px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function AssistantMarkdown({ text }: { text: string }) {
  const lines = text
    .replace(/\\([*_#])/g, "$1")
    .replace(/\\\./g, ".")
    .split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (!list) return;
    const List = list.ordered ? "ol" : "ul";
    blocks.push(
      <List
        key={`list-${blocks.length}`}
        className={`space-y-1.5 pl-5 ${list.ordered ? "list-decimal" : "list-disc"}`}
      >
        {list.items.map((item, index) => (
          <li key={index} className="pl-0.5">
            {inlineMarkdown(item)}
          </li>
        ))}
      </List>,
    );
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3
          key={`h-${blocks.length}`}
          className="text-[1.05em] font-semibold leading-snug text-foreground"
        >
          {inlineMarkdown(heading[2] ?? "")}
        </h3>,
      );
      continue;
    }

    const unorderedItem = line.match(/^[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      flushParagraph();
      const ordered = Boolean(orderedItem);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((orderedItem ?? unorderedItem)?.[1] ?? "");
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return <div className="space-y-2.5 break-words">{blocks}</div>;
}

export function RecipeAssistant({ recipe }: { recipe?: Recipe }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setError("");
  }, [recipe?.id]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  const sendQuestion = async (text: string) => {
    const pergunta = text.trim();
    if (!pergunta || sending || !user) return;
    const historico = messages.slice(-6);
    setMessages((current) => [...current, { role: "user", text: pergunta }]);
    setQuestion("");
    setError("");
    setSending(true);
    try {
      const result = await api<{ resposta: string }>("/api/assistente/receitas", {
        method: "POST",
        body: JSON.stringify({
          pergunta,
          historico: historico.map(({ role, text: messageText }) => ({
            role,
            texto: messageText.slice(0, 6000),
          })),
          receita: recipe
            ? {
                titulo: recipe.title,
                resumo: recipe.summary,
                ingredientes: recipe.ingredients.map(formatRecipeIngredientForAssistant),
                passos: recipe.steps.map(formatRecipeStepForAssistant),
                tempoPreparo: recipe.timeMinutes,
                rendimento: recipe.yield,
                dificuldade: recipe.difficulty,
                custo: recipe.cost ?? null,
              }
            : null,
        }),
      });
      setMessages((current) => [...current, { role: "assistant", text: result.resposta }]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Não foi possível responder agora.",
      );
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(question);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Assistente de receitas"
          className="flex h-[min(620px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-lifted"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warm text-caramel">
              <ChefHat width={20} height={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Assistente de cozinha
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {recipe ? `Sobre: ${recipe.title}` : "Sugestões e dúvidas culinárias"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar assistente"
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full text-muted-foreground"
            >
              <X width={17} height={17} />
            </Button>
          </header>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <Bot width={30} height={30} className="text-caramel" />
              <p className="mt-3 font-semibold text-foreground">
                Entre para conversar com o assistente
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ele pode sugerir receitas e ajudar com esta receita aberta.
              </p>
              <Button asChild className="mt-4 rounded-full">
                <Link to="/entrar">Entrar na conta</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <div className="rounded-2xl bg-secondary/70 p-3.5 text-sm leading-relaxed text-foreground">
                    {recipe
                      ? `Olá, sou a Mums AI! Estou acompanhando a receita “${recipe.title}”. Posso explicar o preparo, tirar dúvidas e ajudar a substituir ingredientes com as quantidades ajustadas. O que você gostaria de saber?`
                      : "Olá, sou a Mums AI! Posso sugerir receitas, ajudar você a escolher o que cozinhar e adaptar pratos aos ingredientes que tem em casa. O que gostaria de preparar?"}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "ml-auto whitespace-pre-wrap rounded-br-md bg-primary text-primary-foreground"
                        : "mr-auto rounded-bl-md bg-secondary/70 text-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <AssistantMarkdown text={message.text} />
                    ) : (
                      message.text
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-md bg-secondary/70 px-3.5 py-2.5 text-sm text-muted-foreground">
                    <LoaderCircle width={15} height={15} className="animate-spin" />
                    Preparando uma resposta…
                  </div>
                )}
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive"
                  >
                    {error}
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    recipe ? "Pergunte sobre esta receita…" : "O que você quer cozinhar?"
                  }
                  aria-label="Sua pergunta para o assistente"
                  maxLength={1000}
                  rows={1}
                  disabled={sending}
                  className="max-h-28 min-h-10 resize-none rounded-2xl bg-background py-2.5"
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Enviar pergunta"
                  disabled={!question.trim() || sending}
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  {sending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Send width={16} height={16} />
                  )}
                </Button>
              </form>
              <p className="px-4 pb-2.5 text-center text-[10px] text-muted-foreground">
                Sugestões culinárias geradas por IA. Confira medidas e preparo conforme seus
                ingredientes.
              </p>
            </>
          )}
        </section>
      )}

      <Button
        type="button"
        size="icon"
        aria-label={open ? "Fechar assistente de receitas" : "Abrir assistente de receitas"}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="h-14 w-14 rounded-full shadow-lifted transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X width={21} height={21} /> : <Sparkles width={22} height={22} />}
      </Button>
    </div>
  );
}
