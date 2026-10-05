"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Edit2,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  MessageSquare,
} from "lucide-react";
import { Project, Task } from "@/types";
import { getProjectById, getTasks, saveTask, deleteTask, deleteProject } from "@/lib/repository";
import {
  formatDateBR,
  isOverdue,
  calculateDaysOverdue,
  extractCleanNotes,
  PROJECT_STATUS_CONFIG,
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
} from "@/lib/utils";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { TaskModal } from "@/components/tasks/TaskModal";
import { ImportTasksModal } from "@/components/tasks/ImportTasksModal";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/context/ToastContext";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { success, error } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [proj, allTasks] = await Promise.all([
        getProjectById(projectId),
        getTasks({ projectId }),
      ]);
      setProject(proj);
      setTasks(allTasks);
    } catch (err) {
      console.error(err);
      error("Erro ao carregar detalhes do projeto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("planer_data_changed", handleUpdate);
    return () => window.removeEventListener("planer_data_changed", handleUpdate);
  }, [projectId]);

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      await deleteTask(deleteTaskId);
      success("Atividade excluída com sucesso.");
      setDeleteTaskId(null);
      loadData();
    } catch (err) {
      console.error(err);
      error("Erro ao excluir atividade.");
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      success("Projeto excluído com sucesso.");
      router.push("/projetos");
    } catch (err) {
      console.error(err);
      error("Erro ao excluir projeto.");
    }
  };

  const handleQuickComplete = async (task: Task) => {
    await saveTask({
      ...task,
      status: "concluida",
      progress_percent: 100,
    });
    success(`Atividade "${task.title}" concluída!`);
    loadData();
  };

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <h3 className="text-base font-bold text-slate-800">Projeto não encontrado</h3>
        <p className="text-xs text-slate-500 mt-1">O projeto pode ter sido excluído ou não existe.</p>
        <Link
          href="/projetos"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Projetos</span>
        </Link>
      </div>
    );
  }

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "concluida").length;
  const inProgressTasks = tasks.filter((t) => t.status === "em_andamento").length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const impededTasks = tasks.filter((t) => Boolean(t.impediment?.trim()) && t.status !== "concluida").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
  const priorityCfg = PRIORITY_CONFIG[project.priority];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/projetos"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Projetos</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Projeto</span>
          </button>
          <button
            onClick={() => setConfirmDeleteProject(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${priorityCfg.badge}`}>
                Prioridade {priorityCfg.label}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.name}</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
          </div>

          {/* Leader and Timeline Info */}
          <div className="lg:text-right space-y-1.5 text-xs text-slate-600 shrink-0">
            <div className="flex items-center lg:justify-end gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Líder Técnico: <strong className="text-slate-900">{project.manager_name}</strong></span>
            </div>
            <div className="flex items-center lg:justify-end gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Período: {formatDateBR(project.start_date)} a <strong>{formatDateBR(project.due_date)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-700">Progresso Geral do Projeto</span>
            <span className="text-[#147846] text-sm">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#147846] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Resumo em Números */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-4 border-t border-slate-100 text-center">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="block text-xl font-black text-slate-900">{totalTasks}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Atividades</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg">
            <span className="block text-xl font-black text-emerald-700">{completedTasks}</span>
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Concluídas</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <span className="block text-xl font-black text-[#0066b3]">{inProgressTasks}</span>
            <span className="text-[11px] font-bold text-[#0066b3] uppercase">Em Andamento</span>
          </div>
          <div className={`p-2.5 rounded-lg ${overdueTasks > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>
            <span className="block text-xl font-black">{overdueTasks}</span>
            <span className="text-[11px] font-bold uppercase">Atrasadas</span>
          </div>
          <div className={`p-2.5 rounded-lg ${impededTasks > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"}`}>
            <span className="block text-xl font-black">{impededTasks}</span>
            <span className="text-[11px] font-bold uppercase">Impedidas</span>
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Atividades do Projeto</h3>
            <p className="text-xs text-slate-500">Cronograma detalhado de intervenções mecânicas e elétricas</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Carga por Planilha</span>
            </button>

            <button
              onClick={() => {
                setTaskToEdit(null);
                setTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Atividade</span>
            </button>
          </div>
        </div>

        {tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Atividade</th>
                  <th className="py-3 px-4">Equipamento & Setor</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Prazo</th>
                  <th className="py-3 px-4">Progresso</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Cobrança</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const priority = PRIORITY_CONFIG[task.priority];
                  const status = TASK_STATUS_CONFIG[task.status];
                  const overdue = isOverdue(task.due_date, task.status);
                  const cleanNotes = extractCleanNotes(task.notes);
                  const daysLate = calculateDaysOverdue(task.due_date);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="font-semibold text-slate-900 leading-snug">{task.title}</div>

                        {/* Apontamento do Técnico visível no projeto */}
                        {cleanNotes && (
                          <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-lg bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="leading-snug">
                              <span className="font-bold text-blue-800 mr-1">Último Apontamento:</span>
                              <span className="text-slate-700">{cleanNotes}</span>
                            </div>
                          </div>
                        )}

                        {/* Impedimento */}
                        {task.impediment && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Impedimento: {task.impediment}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{task.equipment}</div>
                        <div className="text-xs text-slate-500">{task.sector}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{task.assignee_name}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <span className="text-[11px] text-slate-400">Prazo:</span>
                            <span className="font-semibold text-slate-800">
                              {formatDateBR(task.due_date)}
                            </span>
                          </div>

                          {overdue && task.status !== "concluida" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-600">
                              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                              Atrasada ({daysLate}d)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="font-bold text-slate-700">{task.progress_percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${task.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${priority.badge}`}>
                          {priority.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${status.badge}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <WhatsAppButton task={task} variant="icon" />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuickComplete(task)}
                            title="Marcar como concluída"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setTaskModalOpen(true);
                            }}
                            title="Editar atividade"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTaskId(task.id)}
                            title="Excluir atividade"
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
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">Nenhuma atividade vinculada a este projeto.</p>
            <p className="text-xs text-slate-400 mt-0.5">Clique no botão acima para adicionar a primeira tarefa.</p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        defaultProjectId={project.id}
        onSaved={() => loadData()}
      />

      {/* Import Tasks Modal */}
      <ImportTasksModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        defaultProjectId={project.id}
        onSuccess={() => loadData()}
      />

      {/* Project Edit Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        projectToEdit={project}
        onSaved={() => loadData()}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTaskId)}
        title="Excluir Atividade"
        message="Tem certeza que deseja excluir esta atividade deste projeto?"
        confirmLabel="Sim, Excluir"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteProject}
        title="Excluir Projeto Inteiro"
        message={`Confirma a exclusão de "${project.name}" e de todas as suas ${totalTasks} atividades?`}
        confirmLabel="Excluir Projeto e Tarefas"
        onConfirm={handleDeleteProject}
        onCancel={() => setConfirmDeleteProject(false)}
      />
    </div>
  );
}
