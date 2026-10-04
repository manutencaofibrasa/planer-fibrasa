"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Building,
  Calendar,
  User,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Project, Assignee, Priority, TaskStatus } from "@/types";
import { getProjects, getAssignees, saveTasksBatch } from "@/lib/repository";
import { useToast } from "@/context/ToastContext";
import { formatDateBR } from "@/lib/utils";

interface ImportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: () => void;
}

interface ParsedRow {
  id: string;
  title: string;
  equipment: string;
  sector: string;
  assigneeName: string;
  assigneeId?: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  description: string;
  impediment: string;
  valid: boolean;
  warnings: string[];
}

export function ImportTasksModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: ImportTasksModalProps) {
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "");

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [projs, asses] = await Promise.all([getProjects(), getAssignees()]);
        setProjects(projs);
        setAssignees(asses);
        if (!selectedProjectId && projs.length > 0) {
          setSelectedProjectId(defaultProjectId || projs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (isOpen) {
      loadMetadata();
      if (defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
      }
    } else {
      // Reset state on close
      setFileName(null);
      setParsedRows([]);
      setIsProcessingFile(false);
      setIsSaving(false);
    }
  }, [isOpen, defaultProjectId]);

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Helper para normalizar cabeçalho
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  // Helper para formatar datas da planilha
  const parseSpreadsheetDate = (val: unknown, fallback: string): string => {
    if (!val) return fallback;
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split("T")[0];
    }
    if (typeof val === "number") {
      // Data serial do Excel
      const date = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (brMatch) {
        const day = brMatch[1].padStart(2, "0");
        const month = brMatch[2].padStart(2, "0");
        const year = brMatch[3];
        return `${year}-${month}-${day}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    }
    return fallback;
  };

  // 1. Download do modelo XLSX oficial
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          "Atividade *": "Inspeção termográfica e reaperto dos bornes no painel geral",
          "Equipamento *": "Painel QGBT 01",
          "Setor": "Manutenção Elétrica",
          "Responsavel": "Carlos Eduardo",
          "DataInicio": "2026-10-06",
          "Prazo *": "2026-10-08",
          "Prioridade": "alta",
          "Descricao": "Verificação de aquecimento em barramentos, disjuntores e terminais de potência.",
          "Impedimento": "",
        },
        {
          "Atividade *": "Troca de rolamentos e alinhamento do redutor principal",
          "Equipamento *": "Extrusora 03",
          "Setor": "Manutenção Mecânica",
          "Responsavel": "Gustavo Marchiori",
          "DataInicio": "2026-10-07",
          "Prazo *": "2026-10-12",
          "Prioridade": "critica",
          "Descricao": "Desmontagem da tampa, troca dos rolamentos 6312-2RS e lubrificação com Mobilith SHC 220.",
          "Impedimento": "Aguardando parada programada da linha",
        },
        {
          "Atividade *": "Calibração dos sensores de temperatura e pressão",
          "Equipamento *": "Termoformadora Illig 02",
          "Setor": "PCM",
          "Responsavel": "Frank Silva",
          "DataInicio": "2026-10-08",
          "Prazo *": "2026-10-15",
          "Prioridade": "media",
          "Descricao": "Aferição com termopar padrão e laudo de conformidade.",
          "Impedimento": "",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);

      // Ajuste de largura das colunas
      ws["!cols"] = [
        { wch: 45 }, // Atividade
        { wch: 25 }, // Equipamento
        { wch: 22 }, // Setor
        { wch: 22 }, // Responsável
        { wch: 14 }, // DataInicio
        { wch: 14 }, // Prazo
        { wch: 14 }, // Prioridade
        { wch: 45 }, // Descricao
        { wch: 30 }, // Impedimento
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Atividades_Fibrasa");
      XLSX.writeFile(wb, "modelo_carga_atividades_fibrasa.xlsx");
      success("Modelo baixado com sucesso!");
    } catch (err) {
      console.error(err);
      error("Erro ao gerar modelo Excel.");
    }
  };

  // 2. Leitura e parsing da planilha
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          error("A planilha selecionada está vazia.");
          setIsProcessingFile(false);
          return;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const projectDueStr = currentProject?.due_date || todayStr;

        const rows: ParsedRow[] = data.map((item, index) => {
          // Identificar colunas pelas chaves flexíveis
          let rawTitle = "";
          let rawEquip = "";
          let rawSector = "";
          let rawAssignee = "";
          let rawStartDate = "";
          let rawDueDate = "";
          let rawPriority = "";
          let rawDesc = "";
          let rawImpediment = "";

          for (const [key, value] of Object.entries(item)) {
            const k = normalize(key);
            const strVal = value !== null && value !== undefined ? String(value).trim() : "";

            if (k.includes("ativid") || k.includes("taref") || k.includes("titul") || k.includes("nome")) {
              rawTitle = strVal;
            } else if (k.includes("equip") || k.includes("maquin") || k.includes("ativo") || k.includes("linha")) {
              rawEquip = strVal;
            } else if (k.includes("setor") || k.includes("area") || k.includes("oficina") || k.includes("disciplina")) {
              rawSector = strVal;
            } else if (k.includes("responsa") || k.includes("execut") || k.includes("tecnic") || k.includes("lider")) {
              rawAssignee = strVal;
            } else if (k.includes("inic") || k.includes("comec") || k.includes("start")) {
              rawStartDate = parseSpreadsheetDate(value, todayStr);
            } else if (k.includes("prazo") || k.includes("fim") || k.includes("termin") || k.includes("venc") || k.includes("due")) {
              rawDueDate = parseSpreadsheetDate(value, projectDueStr);
            } else if (k.includes("prior") || k.includes("critic")) {
              rawPriority = strVal.toLowerCase();
            } else if (k.includes("desc") || k.includes("detalh") || k.includes("escop")) {
              rawDesc = strVal;
            } else if (k.includes("imped") || k.includes("bloq") || k.includes("obs")) {
              rawImpediment = strVal;
            }
          }

          const warnings: string[] = [];
          if (!rawTitle) warnings.push("Título ausente");
          if (!rawEquip) rawEquip = "Equipamento Geral";
          if (!rawSector) rawSector = "Manutenção Mecânica";

          // Validar prioridade
          let priority: Priority = "media";
          if (["baixa", "media", "alta", "critica"].includes(rawPriority)) {
            priority = rawPriority as Priority;
          } else if (rawPriority.includes("crit")) {
            priority = "critica";
          } else if (rawPriority.includes("alt")) {
            priority = "alta";
          } else if (rawPriority.includes("baix")) {
            priority = "baixa";
          }

          // Casar responsável
          let matchedAssignee = assignees.find(
            (a) => rawAssignee && a.name.toLowerCase().includes(rawAssignee.toLowerCase())
          );
          if (!matchedAssignee && rawAssignee) {
            matchedAssignee = assignees.find(
              (a) => rawAssignee.toLowerCase().includes(a.name.toLowerCase())
            );
          }
          if (!matchedAssignee && assignees.length > 0) {
            matchedAssignee = assignees[0];
            warnings.push(`Responsável atribuído automaticamente a: ${matchedAssignee.name}`);
          }

          return {
            id: `row-${index}-${Date.now()}`,
            title: rawTitle,
            equipment: rawEquip,
            sector: rawSector,
            assigneeName: matchedAssignee?.name || rawAssignee || "Não atribuído",
            assigneeId: matchedAssignee?.id,
            startDate: rawStartDate || todayStr,
            dueDate: rawDueDate || projectDueStr,
            priority,
            description: rawDesc,
            impediment: rawImpediment,
            valid: Boolean(rawTitle),
            warnings,
          };
        });

        setParsedRows(rows);
        info(`${rows.length} atividades processadas da planilha.`);
      } catch (err) {
        console.error(err);
        error("Falha ao ler o arquivo Excel. Verifique o formato.");
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Remover uma linha individual da pré-visualização
  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // 3. Confirmar e importar atividades para o projeto
  const handleConfirmImport = async () => {
    if (!selectedProjectId) {
      error("Selecione o projeto de destino.");
      return;
    }

    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      error("Nenhuma atividade válida para importar.");
      return;
    }

    try {
      setIsSaving(true);

      const tasksToInsert = validRows.map((row) => ({
        title: row.title,
        description: row.description || "",
        project_id: selectedProjectId,
        assignee_id: row.assigneeId || assignees[0]?.id || "ass-1",
        sector: row.sector,
        equipment: row.equipment,
        start_date: row.startDate,
        due_date: row.dueDate,
        priority: row.priority,
        status: "pendente" as TaskStatus,
        progress_percent: 0,
        impediment: row.impediment || null,
      }));

      await saveTasksBatch(tasksToInsert);

      success(`🎉 ${tasksToInsert.length} atividades importadas com sucesso para "${currentProject?.name}"!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro ao importar atividades.";
      error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.valid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Carga de Atividades em Lote por Planilha</h2>
              <p className="text-xs text-slate-500">
                Suba dezenas de tarefas técnicas no projeto com 1 clique (.xlsx, .xls ou .csv)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. Seleção de Projeto */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Projeto de Destino
              </label>
              <p className="text-xs text-slate-500">As atividades importadas serão vinculadas a este projeto:</p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Download Template + Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Baixar Modelo */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Não tem a planilha pronta?</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Baixe nossa planilha modelo Excel oficial da Fibrasa com as colunas já formatadas e exemplos preenchidos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Baixar Planilha Modelo (.xlsx)</span>
              </button>
            </div>

            {/* Box Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 transition cursor-pointer flex flex-col items-center justify-center text-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-emerald-100 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 transition mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {fileName ? fileName : "Clique para selecionar sua planilha"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Formatos aceitos: .xlsx, .xls ou .csv</p>
            </div>
          </div>

          {/* 3. Indicador de Processamento */}
          {isProcessingFile && (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-600 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Processando linhas da planilha...</span>
            </div>
          )}

          {/* 4. Pré-visualização da Carga */}
          {parsedRows.length > 0 && !isProcessingFile && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Pré-visualização da Carga:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {validCount} de {parsedRows.length} prontas
                  </span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Substituir Arquivo
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Atividade</th>
                      <th className="py-2.5 px-3">Equipamento</th>
                      <th className="py-2.5 px-3">Setor</th>
                      <th className="py-2.5 px-3">Responsável</th>
                      <th className="py-2.5 px-3">Prazo</th>
                      <th className="py-2.5 px-3">Prioridade</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.valid ? "bg-rose-50/50" : ""
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 max-w-xs truncate">{row.title || "(Vazio)"}</div>
                          {row.warnings.length > 0 && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{row.warnings[0]}</span>
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-700">{row.equipment}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-600">{row.sector}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">{row.assigneeName}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-700">{formatDateBR(row.dueDate)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                              row.priority === "critica"
                                ? "bg-red-100 text-red-700"
                                : row.priority === "alta"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Remover linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/70 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={validCount === 0 || isSaving || !selectedProjectId}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#147846] hover:bg-[#0f6138] rounded-lg shadow-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importando {validCount} Atividades...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Importar ({validCount} Atividades)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
