import { useState, type MouseEvent } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DeleteRecipeButtonProps = {
  recipeTitle: string;
  buttonLabel?: string;
  iconOnly?: boolean;
  onDelete: () => Promise<void>;
};

export function DeleteRecipeButton({
  recipeTitle,
  buttonLabel = "Excluir",
  iconOnly = false,
  onDelete,
}: DeleteRecipeButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await onDelete();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a receita.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !deleting && setOpen(nextOpen)}>
      <AlertDialogTrigger asChild>
        <Button
          size={iconOnly ? "icon" : "sm"}
          variant={iconOnly ? "outline" : "destructive"}
          className={
            iconOnly
              ? "h-10 w-10 rounded-full border-border bg-card text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "rounded-full"
          }
          aria-label={buttonLabel}
          title={buttonLabel}
        >
          <Trash2 width={16} height={16} />
          {!iconOnly && buttonLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md rounded-[1.75rem] border-border bg-card p-6 shadow-soft sm:p-7">
          <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-warm text-caramel">
              <Trash2 width={21} height={21} />
            </div>
            <AlertDialogTitle className="font-display text-2xl text-foreground">
              Excluir esta receita?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-1 text-sm leading-relaxed">
              <span className="font-medium text-foreground">{recipeTitle}</span> será removida da
              plataforma. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting} className="h-10 rounded-full px-5">
              Manter receita
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => void confirmDelete(event)}
              className="h-10 rounded-full bg-caramel px-5 text-cream hover:bg-caramel/90"
            >
              {deleting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Trash2 width={15} height={15} />
              )}
              {deleting ? "Excluindo…" : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
