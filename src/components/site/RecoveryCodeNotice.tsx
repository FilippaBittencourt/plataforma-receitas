import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function RecoveryCodeNotice() {
  const { pendingRecoveryCode, dismissRecoveryCode } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!pendingRecoveryCode) return null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(pendingRecoveryCode); setCopied(true); toast.success("Código copiado"); }
    catch { toast.error("Não foi possível copiar. Selecione e copie o código manualmente."); }
  };

  return <AlertDialog open>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Guarde seu código de recuperação</AlertDialogTitle>
        <AlertDialogDescription>Ele é exibido uma única vez e será necessário para trocar sua senha se perder o acesso. Depois de usar o código, você receberá outro.</AlertDialogDescription>
      </AlertDialogHeader>
      <code className="block select-all break-all rounded-xl border border-border bg-muted p-4 text-center font-mono text-lg font-bold tracking-wider">{pendingRecoveryCode}</code>
      <AlertDialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={() => void copy()}>{copied ? "Copiado" : "Copiar código"}</Button>
        <AlertDialogAction className="rounded-full" onClick={dismissRecoveryCode}>Já guardei</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
