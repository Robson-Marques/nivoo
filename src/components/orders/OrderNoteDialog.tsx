import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderNoteDialogProps {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  currentNote?: string;
}

export function OrderNoteDialog({
  orderId,
  open,
  onClose,
  currentNote = "",
}: OrderNoteDialogProps) {
  const [note, setNote] = useState(currentNote);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setNote(currentNote);
    }
  }, [open, currentNote]);

  const handleSave = async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ notes: note })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Nota atualizada com sucesso");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar nota:", error);
      toast.error("Erro ao atualizar nota");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nota ao Pedido</DialogTitle>
          <DialogDescription>
            Esta nota será exibida na página de acompanhamento do pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Digite uma nota sobre o pedido... (ex: Cliente quer tudo bem quente, sem cebola no lanche)"
            className="min-h-24 resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Máximo 500 caracteres
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
