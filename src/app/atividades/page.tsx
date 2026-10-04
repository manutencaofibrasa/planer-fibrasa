"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Wrench,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Edit2,
  Trash2,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import { Task, Priority, TaskStatus, Project, Assignee } from "@/types";
import { getTasks, getProjects, getAssignees, getSettings, saveTask, deleteTask } from "@/lib/repository";
import { formatDateBR, isOverdue, calculateDaysOverdue, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/utils";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { TaskModal } from "@/components/tasks/TaskModal";
import { ImportTasksModal } from "@/components/tasks/ImportTasksModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/context/ToastContext";

function AtividadesContent() {
  const searchParams = useSearchParams();
  const { success, error } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todos");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("todos");
  const [projectFilter, setProjectFilter] = useState<string>("todos");
  const [sectorFilter, setSectorFilter] = useState<string>("todos");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyImpeded, setOnlyImpeded] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Read URL query params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
    const action = searchParams.get("action");
    if (action === "new") setModalOpen(true);
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, pList, aList, settings] = await Promise.all([
        getTasks(),
        getProjects(),
        getAssignees(),
        getSettings(),
      ]);
      setTasks(tList);
      setProjects(pList);
      setAssignees(aList);
      setSectors(settings.sectors || []);
    } catch (err) {
      console.error(err);
      error("Erro ao carregar lista de atividades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("planer_data_changed", handleUpdate);
    return () => window.removeEventListener("planer_data_changed", handleUpdate);
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTask(deletingId);
      success("Atividade excluída com sucesso.");
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      error("Erro ao excluir atividade.");
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await saveTask({
        ...task,
        status: newStatus,
        progress_percent: newStatus === "concluida" ? 100 : task.progress_percent,
      });
      success(`Status atualizado para "${TASK_STATUS_CONFIG[newStatus].label}".`);
      loadData();
    } catch (err) {
      console.error(err);
      error("Erro ao atualizar status.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("todos");
    setPriorityFilter("todos");
    setAssigneeFilter("todos");
    setProjectFilter("todos");
    setSectorFilter("todos");
    setOnlyOverdue(false);
    setOnlyImpeded(false);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.equipment?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.project_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "todos" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "todos" || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === "todos" || t.assignee_id === assigneeFilter;
    const matchesProject = projectFilter === "todos" || t.project_id === projectFilter;
    const matchesSector = sectorFilter === "todos" || t.sector === sectorFilter;
    const matchesOverdue = !onlyOverdue || isOverdue(t.due_date, t.status);
    const matchesImpeded = !onlyImpeded || Boolean(t.impediment?.trim());

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesAssignee &&
      matchesProject &&
      matchesSector &&
      matchesOverdue &&
      matchesImpeded
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Atividades & Prazos</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle operacional de execução, cobrança direta e acompanhamento de impedimentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs sm:text-sm font-bold transition shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Carga por Planilha</span>
          </button>

          <button
            onClick={() => {
              setTaskToEdit(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atividade</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Bar & Primary Toggles */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, máquina, responsável, projeto..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                onlyOverdue
                  ? "bg-red-600 text-white border-red-600 shadow-xs"
                  : "bg-red-50/70 text-red-700 border-red-200 hover:bg-red-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Atrasadas</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyImpeded(!onlyImpeded)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                onlyImpeded
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50/70 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Impedidas</span>
            </button>

            {(search || statusFilter !== "todos" || priorityFilter !== "todos" || assigneeFilter !== "todos" || projectFilter !== "todos" || sectorFilter !== "todos" || onlyOverdue || onlyImpeded) && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="pausada">Pausada</option>
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Prioridade
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="todos">Todas Prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Responsável
            </label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="todos">Todos Responsáveis</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Projeto */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Projeto
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="todos">Todos Projetos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Setor
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="todos">Todos Setores</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Atividades */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-bold text-slate-700">
            Exibindo <span className="text-blue-600 font-extrabold">{filteredTasks.length}</span> atividade(s)
          </div>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Atividade & Detalhes</th>
                  <th className="py-3 px-4">Projeto & Setor</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Prazo</th>
                  <th className="py-3 px-4">Progresso</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Cobrança WhatsApp</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const priority = PRIORITY_CONFIG[task.priority];
                  const status = TASK_STATUS_CONFIG[task.status];
                  const overdue = isOverdue(task.due_date, task.status);
                  const daysOver = calculateDaysOverdue(task.due_date);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Atividade */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 leading-snug">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</div>
                        )}
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                          <Wrench className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-700">{task.equipment}</span>
                        </div>
                        {task.impediment && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="font-bold">Impedimento:</span>
                            <span className="truncate max-w-xs">{task.impediment}</span>
                          </div>
                        )}
                      </td>

                      {/* Projeto & Setor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{task.project_name}</div>
                        <div className="text-xs text-slate-500">{task.sector}</div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {task.assignee_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{task.assignee_name}</div>
                            {task.assignee_phone && (
                              <div className="text-[10px] text-slate-400">{task.assignee_phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Prazo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{formatDateBR(task.due_date)}</div>
                        {overdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {daysOver} dia(s) atrasado
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Início: {formatDateBR(task.start_date)}</span>
                        )}
                      </td>

                      {/* Progresso */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
                            <span className="text-slate-700">{task.progress_percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${task.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Prioridade */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${priority.badge}`}>
                          {priority.label}
                        </span>
                      </td>

                      {/* Status interativo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                          className={`text-xs font-bold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${status.badge}`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="concluida">Concluída</option>
                          <option value="pausada">Pausada</option>
                        </select>
                      </td>

                      {/* Cobrança WhatsApp */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <WhatsAppButton task={task} variant="outline" size="sm" />
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setModalOpen(true);
                            }}
                            title="Editar"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(task.id)}
                            title="Excluir"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">Nenhuma atividade encontrada</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhuma tarefa corresponde aos filtros selecionados. Tente ajustar os termos de pesquisa ou adicione uma nova atividade.
            </p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSaved={() => loadData()}
      />

      {/* Import Tasks Modal */}
      <ImportTasksModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => loadData()}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Excluir Atividade"
        message="Tem certeza que deseja excluir esta atividade permanentemente?"
        confirmLabel="Sim, Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

export default function AtividadesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando atividades...</div>}>
      <AtividadesContent />
    </Suspense>
  );
}
