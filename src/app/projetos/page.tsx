"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { Project, Task, ProjectStatus, Priority } from "@/types";
import { getProjects, getTasks, deleteProject } from "@/lib/repository";
import { formatDateBR, isOverdue, PROJECT_STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { ImportTasksModal } from "@/components/tasks/ImportTasksModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/context/ToastContext";

interface ProjectCardData extends Project {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  impededTasks: number;
  progressPercent: number;
}

export default function ProjectsPage() {
  const { success, error } = useToast();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [targetImportProjectId, setTargetImportProjectId] = useState<string | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const loadData = async () => {
    try {
      setLoading(true);
      const [projs, tasks] = await Promise.all([getProjects(), getTasks()]);

      const enriched: ProjectCardData[] = projs.map((p) => {
        const pTasks = tasks.filter((t) => t.project_id === p.id);
        const total = pTasks.length;
        const completed = pTasks.filter((t) => t.status === "concluida").length;
        const inProgress = pTasks.filter((t) => t.status === "em_andamento").length;
        const overdue = pTasks.filter((t) => isOverdue(t.due_date, t.status)).length;
        const impeded = pTasks.filter((t) => Boolean(t.impediment?.trim()) && t.status !== "concluida").length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...p,
          totalTasks: total,
          completedTasks: completed,
          inProgressTasks: inProgress,
          overdueTasks: overdue,
          impededTasks: impeded,
          progressPercent: progress,
        };
      });

      setProjects(enriched);
    } catch (err) {
      console.error(err);
      error("Erro ao carregar lista de projetos.");
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
      await deleteProject(deletingId);
      success("Projeto excluído com sucesso.");
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      error("Falha ao excluir projeto.");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.manager_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Projetos Industriais</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestão de ordens de serviço complexas, reformas e planos semestrais
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetImportProjectId(undefined);
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs sm:text-sm font-bold transition shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Carga por Planilha</span>
          </button>

          <button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar projetos por nome, descrição ou responsável..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="planejamento">Planejamento</option>
            <option value="em_andamento">Em andamento</option>
            <option value="pausado">Pausado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Grid de Projetos */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const statusCfg = PROJECT_STATUS_CONFIG[p.status];
            const priorityCfg = PRIORITY_CONFIG[p.priority];

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Card Info */}
                <div className="p-5">
                  {/* Status & Priority Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.badge}`}>
                      {statusCfg.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityCfg.badge}`}>
                      {priorityCfg.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <Link href={`/projetos/${p.id}`} className="block group-hover:text-blue-600 transition-colors">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{p.name}</h3>
                  </Link>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">{p.description}</p>

                  {/* Manager & Timeline */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{p.manager_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Início: {formatDateBR(p.start_date)}
                      </span>
                      <span className="font-medium text-slate-700">Término: {formatDateBR(p.due_date)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Progresso</span>
                      <span className="font-bold text-blue-600">{p.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Badges de Atividades */}
                  <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="block font-bold text-slate-800">{p.totalTasks}</span>
                      <span className="text-[10px] text-slate-500 uppercase">Total</span>
                    </div>
                    <div className="p-1.5 bg-emerald-50 rounded">
                      <span className="block font-bold text-emerald-700">{p.completedTasks}</span>
                      <span className="text-[10px] text-emerald-600 uppercase">Feitas</span>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded">
                      <span className="block font-bold text-blue-700">{p.inProgressTasks}</span>
                      <span className="text-[10px] text-blue-600 uppercase">Andam.</span>
                    </div>
                    <div className={`p-1.5 rounded ${p.overdueTasks > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>
                      <span className="block font-bold">{p.overdueTasks}</span>
                      <span className="text-[10px] uppercase">Atraso</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/projetos/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>Ver Atividades</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setTargetImportProjectId(p.id);
                        setImportModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                      title="Importar planilha de atividades"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition"
                      title="Editar projeto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">Nenhum projeto encontrado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não foram localizados projetos com os filtros aplicados. Crie um novo projeto para começar.
          </p>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        projectToEdit={editingProject}
        onSaved={(savedProj) => {
          loadData();
          if (!editingProject) {
            setTargetImportProjectId(savedProj.id);
            setImportModalOpen(true);
          }
        }}
      />

      {/* Modal de Carga por Planilha */}
      <ImportTasksModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        defaultProjectId={targetImportProjectId}
        onSuccess={() => loadData()}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Excluir Projeto"
        message="Tem certeza que deseja excluir este projeto? Todas as atividades vinculadas a ele também serão excluídas."
        confirmLabel="Sim, Excluir Projeto"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
