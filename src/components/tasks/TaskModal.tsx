"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Wrench, Calendar, User, FolderKanban, ShieldAlert } from "lucide-react";
import { Task, Priority, TaskStatus, Project, Assignee } from "@/types";
import { getProjects, getAssignees, getSettings, getTasks, saveTask } from "@/lib/repository";
import { useToast } from "@/context/ToastContext";
import { getTodayDateString, extractCleanNotes } from "@/lib/utils";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultProjectId?: string;
  onSaved?: (savedTask: Task) => void;
}

export function TaskModal({ isOpen, onClose, taskToEdit, defaultProjectId, onSaved }: TaskModalProps) {
  const { success, error } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<string[]>([]);
  const [isCustomEquipment, setIsCustomEquipment] = useState(false);
  const [isCustomSector, setIsCustomSector] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sector, setSector] = useState("");
  const [equipment, setEquipment] = useState("");
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [priority, setPriority] = useState<Priority>("media");
  const [status, setStatus] = useState<TaskStatus>("pendente");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [impediment, setImpediment] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadMeta() {
      setIsCustomEquipment(false);
      setIsCustomSector(false);

      const [projs, asses, settings, allTasks] = await Promise.all([
        getProjects(),
        getAssignees(),
        getSettings(),
        getTasks(),
      ]);
      setProjects(projs);
      setAssignees(asses);

      // Agrupa todos os equipamentos (configurações + existentes nas tarefas + tarefa em edição)
      const taskEquipments = allTasks.map((t) => t.equipment).filter(Boolean);
      const currentEquip = taskToEdit?.equipment ? [taskToEdit.equipment] : [];
      const mergedEquipments = Array.from(
        new Set([
          ...currentEquip,
          ...(settings.equipments || []),
          ...taskEquipments,
        ])
      ).filter(Boolean).sort((a, b) => a.localeCompare("pt-BR"));
      setEquipments(mergedEquipments);

      // Agrupa todos os setores (configurações + existentes nas tarefas + tarefa em edição)
      const taskSectors = allTasks.map((t) => t.sector).filter(Boolean);
      const currentSector = taskToEdit?.sector ? [taskToEdit.sector] : [];
      const mergedSectors = Array.from(
        new Set([
          ...currentSector,
          ...(settings.sectors || []),
          ...taskSectors,
        ])
      ).filter(Boolean).sort((a, b) => a.localeCompare("pt-BR"));
      setSectors(mergedSectors);

      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setProjectId(taskToEdit.project_id);
        setAssigneeId(taskToEdit.assignee_id);
        setSector(taskToEdit.sector);
        setEquipment(taskToEdit.equipment);
        setStartDate(taskToEdit.start_date);
        setDueDate(taskToEdit.due_date);
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
        setProgressPercent(taskToEdit.progress_percent || 0);
        setImpediment(taskToEdit.impediment || "");
        setNotes(extractCleanNotes(taskToEdit.notes) || "");
      } else {
        // Defaults for new task
        setTitle("");
        setDescription("");
        setProjectId(defaultProjectId || (projs.length > 0 ? projs[0].id : ""));
        setAssigneeId(asses.length > 0 ? asses[0].id : "");
        setSector(mergedSectors[0] || "Utilidades");
        setEquipment(mergedEquipments[0] || "Chiller Sabroe 01");
        setStartDate(getTodayDateString());
        setDueDate(getTodayDateString());
        setPriority("media");
        setStatus("pendente");
        setProgressPercent(0);
        setImpediment("");
        setNotes("");
      }
    }

    if (isOpen) {
      loadMeta();
    }
  }, [isOpen, taskToEdit, defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      error("Informe o título da atividade");
      return;
    }
    if (!projectId) {
      error("Selecione um projeto");
      return;
    }
    if (!assigneeId) {
      error("Selecione um responsável");
      return;
    }

    try {
      setSaving(true);
      const saved = await saveTask({
        id: taskToEdit?.id,
        title: title.trim(),
        description: description.trim(),
        project_id: projectId,
        assignee_id: assigneeId,
        sector,
        equipment,
        start_date: startDate,
        due_date: dueDate,
        priority,
        status,
        progress_percent: status === "concluida" ? 100 : Number(progressPercent),
        impediment: impediment.trim() ? impediment.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      success(taskToEdit ? "Atividade atualizada com sucesso!" : "Nova atividade cadastrada com sucesso!");
      if (onSaved) onSaved(saved);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha ao salvar a atividade.";
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {taskToEdit ? "Editar Atividade" : "Cadastrar Nova Atividade"}
              </h2>
              <p className="text-xs text-slate-500">Defina responsável, prazos e especificações industriais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Título */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título da Atividade *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Realizar limpeza do trocador de calor..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Descrição Detalhada do Procedimento
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre o escopo, ferramentas especiais ou normas..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 resize-none"
              />
            </div>

            {/* Projeto e Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                  Projeto *
                </label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                >
                  <option value="">Selecione um projeto...</option>
                  {projectId && !projects.some((p) => p.id === projectId) && taskToEdit?.project_name && (
                    <option value={projectId}>{taskToEdit.project_name}</option>
                  )}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Responsável *
                </label>
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                >
                  <option value="">Selecione um responsável...</option>
                  {assigneeId && !assignees.some((a) => a.id === assigneeId) && taskToEdit?.assignee_name && (
                    <option value={assigneeId}>{taskToEdit.assignee_name}</option>
                  )}
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Setor e Equipamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Setor *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSector(!isCustomSector)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    {isCustomSector ? "Selecionar da lista" : "+ Digitar outro"}
                  </button>
                </div>
                {isCustomSector ? (
                  <input
                    type="text"
                    required
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Digite o setor..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                ) : (
                  <select
                    required
                    value={sector}
                    onChange={(e) => {
                      if (e.target.value === "__novo__") {
                        setIsCustomSector(true);
                        setSector("");
                      } else {
                        setSector(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  >
                    {sector && !sectors.includes(sector) && (
                      <option value={sector}>{sector}</option>
                    )}
                    {sectors.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__novo__">+ Outro setor (digitar)...</option>
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    Equipamento *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomEquipment(!isCustomEquipment)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    {isCustomEquipment ? "Selecionar da lista" : "+ Digitar outro"}
                  </button>
                </div>
                {isCustomEquipment ? (
                  <input
                    type="text"
                    required
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="Ex: Chiller Hitachi, Extrusora 150..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                  />
                ) : (
                  <select
                    required
                    value={equipment}
                    onChange={(e) => {
                      if (e.target.value === "__novo__") {
                        setIsCustomEquipment(true);
                        setEquipment("");
                      } else {
                        setEquipment(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                  >
                    {/* Garante que se o equipamento for Chiller Hitachi ou outro não listado originalmente, ele renderiza e fica selecionado! */}
                    {equipment && !equipments.includes(equipment) && (
                      <option value={equipment}>{equipment}</option>
                    )}
                    {equipments.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                    <option value="__novo__">+ Outro equipamento (digitar)...</option>
                  </select>
                )}
              </div>
            </div>

            {/* Datas de Início e Prazo de Entrega */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Data de Início
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-red-600">
                  <Calendar className="w-3.5 h-3.5 text-red-600" />
                  Prazo de Entrega *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Prioridade e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">🚨 Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status da Atividade
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TaskStatus;
                    setStatus(newStatus);
                    if (newStatus === "concluida") setProgressPercent(100);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="pausada">Pausada</option>
                  <option value="concluida">✅ Concluída</option>
                </select>
              </div>
            </div>

            {/* Percentual de Conclusão */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Percentual de Conclusão: <span className="text-blue-600 font-extrabold">{progressPercent}%</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPercent}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgressPercent(val);
                  if (val === 100) setStatus("concluida");
                  else if (val > 0 && status === "pendente") setStatus("em_andamento");
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Impedimento (Destaque visual) */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Registro de Impedimento (Se houver)
              </label>
              <input
                type="text"
                value={impediment}
                onChange={(e) => setImpediment(e.target.value)}
                placeholder="Ex: Aguardando liberação da produção, falta de peça..."
                className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 placeholder-amber-400/80"
              />
              <p className="text-[11px] text-amber-700 mt-1">
                Atividades com impedimento serão destacadas no Dashboard e habilitarão alerta específico de WhatsApp.
              </p>
            </div>

            {/* Observações / Apontamento Técnico */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Observações / Último Apontamento Técnico
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações de campo, histórico de medições, apontamento técnico de execução..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/70 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#147846] hover:bg-[#0f6138] rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{saving ? "Salvando..." : taskToEdit ? "Salvar Alterações" : "Criar Atividade"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
