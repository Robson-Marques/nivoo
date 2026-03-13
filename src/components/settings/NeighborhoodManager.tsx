import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Upload, Download, Trash2, Edit2, AlertCircle, CheckSquare, Square } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNeighborhoods, useAddNeighborhood, useImportNeighborhoods, useCities } from "@/hooks/useNeighborhoods";
import { parseExcelToNeighborhoods, validateNeighborhoodData, generateJsonTemplate, generateCsvTemplate } from "@/utils/neighborhood-search";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function NeighborhoodManager() {
  const queryClient = useQueryClient();
  const { neighborhoods, isLoading: neighborhoodsLoading } = useNeighborhoods();
  const { cities } = useCities();
  const { addNeighborhood } = useAddNeighborhood();
  const { importNeighborhoods } = useImportNeighborhoods();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [neighborhoodName, setNeighborhoodName] = useState("");
  const [fee, setFee] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importValidationErrors, setImportValidationErrors] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<Array<{ city: string; neighborhoods: string[] }> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para seleção de múltiplos registros
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const handleAddNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCity || !neighborhoodName || !fee) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSubmitting(true);
    try {
      await addNeighborhood(selectedCity, neighborhoodName.trim(), parseFloat(fee));
      toast.success("Bairro adicionado com sucesso!");
      setSelectedCity("");
      setNeighborhoodName("");
      setFee("0");
      setIsAddDialogOpen(false);
    } catch (error) {
      const err = error as Error;
      toast.error(`Erro ao adicionar bairro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelToNeighborhoods(file);
      const validation = validateNeighborhoodData(data);

      if (!validation.valid) {
        setImportValidationErrors(validation.errors);
        setImportPreview(null);
        return;
      }

      setImportValidationErrors([]);
      setImportPreview(data);
      toast.success("Arquivo validado com sucesso!");
    } catch (error) {
      const err = error as Error;
      toast.error(`Erro ao processar arquivo: ${err.message}`);
      setImportPreview(null);
    }
  };

  const handleImport = async () => {
    if (!importPreview) {
      toast.error("Nenhum arquivo carregado");
      return;
    }

    setIsSubmitting(true);
    try {
      await importNeighborhoods(importPreview);
      toast.success(`${importPreview.reduce((acc, c) => acc + c.neighborhoods.length, 0)} bairros importados com sucesso!`);
      setImportPreview(null);
      setIsImportDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      const err = error as Error;
      toast.error(`Erro ao importar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNeighborhood = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este bairro?")) return;

    try {
      // Primeiro, limpar referências em pedidos (Foreign Key constraint)
      const { error: updateError } = await supabase
        .from("orders")
        .update({ delivery_region_id: null })
        .eq("delivery_region_id", id);
      
      if (updateError && updateError.code !== 'PGRST116') {
        console.warn(`Aviso ao atualizar pedidos:`, updateError);
      }

      // Depois deletar o bairro
      const { error } = await supabase.from("delivery_regions").delete().eq("id", id);
      if (error) throw error;

      toast.success("Bairro excluído com sucesso!");
      await queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
    } catch (error) {
      const err = error as Error;
      toast.error(`Erro ao excluir: ${err.message}`);
    }
  };

  // Novo: Gerenciar seleção de checkbox
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Novo: Selecionar todos
  const toggleSelectAll = () => {
    if (selectedIds.size === neighborhoods.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(neighborhoods.map(n => n.id)));
    }
  };

  // Novo: Deletar selecionados
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione ao menos um bairro");
      return;
    }

    setIsDeleteSubmitting(true);
    try {
      const idsArray = Array.from(selectedIds);
      
      // Deletar cada um
      for (const id of idsArray) {
        // Primeiro, limpar referências em pedidos (Foreign Key constraint)
        const { error: updateError } = await supabase
          .from("orders")
          .update({ delivery_region_id: null })
          .eq("delivery_region_id", id);
        
        if (updateError && updateError.code !== 'PGRST116') {
          console.warn(`Aviso ao atualizar pedidos para região ${id}:`, updateError);
        }

        // Depois deletar a região
        const { error } = await supabase
          .from("delivery_regions")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
      }

      toast.success(`${idsArray.length} bairro(s) excluído(s) com sucesso!`);
      setSelectedIds(new Set());
      setIsDeleteConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
    } catch (error) {
      const err = error as Error;
      toast.error(`Erro ao excluir: ${err.message}`);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const downloadJsonTemplate = () => {
    const template = generateJsonTemplate();
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(template)}`);
    element.setAttribute("download", "neighborhoods_template.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Template JSON baixado!");
  };

  const downloadCsvTemplate = () => {
    const template = generateCsvTemplate();
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(template)}`);
    element.setAttribute("download", "neighborhoods_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Template CSV baixado!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Bairros</CardTitle>
          <CardDescription>
            Configure bairros por cidade com suas respectivas taxas de entrega.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Bairro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Bairro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddNeighborhood} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Nome do Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Ex: Centro, Vila Mariana"
                      value={neighborhoodName}
                      onChange={(e) => setNeighborhoodName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fee">Taxa de Entrega (R$)</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Lista
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importar Bairros</DialogTitle>
                  <DialogDescription>
                    Carregue um arquivo JSON ou CSV com lista de bairros por cidade.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Download Templates */}
                  <div className="space-y-2">
                    <Label>Baixar Modelo</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={downloadJsonTemplate}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        JSON
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={downloadCsvTemplate}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>
                    </div>
                  </div>

                  {/* File Input */}
                  <div className="space-y-2">
                    <Label htmlFor="file">Selecionar arquivo</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                    />
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: JSON ou CSV (Cidade, Bairro)
                    </p>
                  </div>

                  {/* Validation Errors */}
                  {importValidationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {importValidationErrors.map((error, idx) => (
                            <div key={idx}>- {error}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Preview */}
                  {importPreview && importPreview.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Pronto para importar: {importPreview.reduce((acc, c) => acc + c.neighborhoods.length, 0)} bairros de{" "}
                        {importPreview.length} cidade(s)
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setImportPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!importPreview || isSubmitting || importValidationErrors.length > 0}
                    >
                      {isSubmitting ? "Importando..." : "Importar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {selectedIds.size > 0 && (
              <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar Selecionados ({selectedIds.size})
                </Button>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir {selectedIds.size} bairro(s)? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    disabled={isDeleteSubmitting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleteSubmitting ? "Deletando..." : "Deletar"}
                  </AlertDialogAction>
                  <AlertDialogCancel disabled={isDeleteSubmitting}>
                    Cancelar
                  </AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Neighborhoods Table */}
          <div className="border rounded-lg overflow-hidden">
            {neighborhoodsLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando bairros...
              </div>
            ) : neighborhoods.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum bairro configurado. Adicione um novo bairro ou importe uma lista.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={selectedIds.size === neighborhoods.length ? "Desselecionar tudo" : "Selecionar tudo"}
                      >
                        {selectedIds.size === neighborhoods.length ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-right">Taxa (R$)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neighborhoods.map((item) => (
                    <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-blue-50" : ""}>
                      <TableCell>
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {selectedIds.has(item.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{item.city}</TableCell>
                      <TableCell>{item.neighborhood}</TableCell>
                      <TableCell className="text-right">
                        {item.fee.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNeighborhood(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Help Section */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">💡 Como usar:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Adicione bairros manualmente ou importe uma lista</li>
                  <li>Cada bairro tem uma cidade e uma taxa de entrega</li>
                  <li>No checkout, o sistema detecta automaticamente o bairro</li>
                  <li>A taxa será aplicada com base no bairro selecionado</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
