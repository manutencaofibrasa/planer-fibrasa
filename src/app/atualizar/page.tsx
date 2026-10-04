"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Wrench,
  FolderKanban,
  Search,
  User,
  Save,
  Check,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Copy,
  Building,
  RefreshCw,
  Sliders,
  Send,
} from "lucide-react";
import { Task, Assignee, TaskStatus } from "@/types";
import { getTasks, getAssignees, updateTaskExecution } from "@/lib/repository";
import { formatDateBR, calculateDaysOverdue, isOverdue, isDueToday, PRIORITY_CONFIG } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

function AtualizarContent() {
  const searchParams = useSearchParams();
  const urlAssigneeId = searchParams.get("r");
  const urlTaskId = searchParams.get("t");
  const urlProjectId = searchParams.get("p");

  const { success, error, info } = useToast();

  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected technician
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(urlAssigneeId || "");

  // Card form local state: map of taskId -> { status, progress, notes, impediment, hasImpediment, isSaving, isSaved }
  const [taskForms, setTaskForms] = useState<
    Record<
      string,
      {
        status: TaskStatus;
        progress: number;
        notes: string;
        impediment: string;
        hasImpediment: boolean;
        isSaving: boolean;
        isSaved: boolean;
        showDetails: boolean;
      }
    >
  >({});

  // Filter state
  const [filterTab, setFilterTab] = useState<"todas" | "pendentes" | "em_andamento" | "atrasadas" | "concluidas">("pendentes");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchAssignee, setSearchAssignee] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [asses, tList] = await Promise.all([getAssignees(), getTasks()]);
      setAssignees(asses);
      setTasks(tList);

      // Initialize forms state for tasks
      const forms: Record<string, any> = {};
      tList.forEach((t) => {
        forms[t.id] = {
          status: t.status,
          progress: t.progress_percent || 0,
          notes: t.notes || "",
          impediment: t.impediment || "",
          hasImpediment: Boolean(t.impediment && t.impediment.trim().length > 0),
          isSaving: false,
          isSaved: false,
          showDetails: false,
        };
      });
      setTaskForms(forms);
    } catch (err) {
      console.error(err);
      error("Erro ao carregar dados do portal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (urlAssigneeId) {
      setSelectedAssigneeId(urlAssigneeId);
    }
  }, [urlAssigneeId]);

  // Current selected assignee
  const currentAssignee = useMemo(() => {
    return assignees.find((a) => a.id === selectedAssigneeId) || null;
  }, [assignees, selectedAssigneeId]);

  // Tasks for current assignee
  const assigneeTasks = useMemo(() => {
    if (!selectedAssigneeId) return [];
    return tasks.filter((t) => {
      const matchAssignee = t.assignee_id === selectedAssigneeId;
      const matchProject = urlProjectId ? t.project_id === urlProjectId : true;
      return matchAssignee && matchProject;
    });
  }, [tasks, selectedAssigneeId, urlProjectId]);

  // Filtered tasks for view
  const filteredTasks = useMemo(() => {
    return assigneeTasks.filter((t) => {
      // Tab filter
      const form = taskForms[t.id];
      const currentStatus = form ? form.status : t.status;
      const overdue = isOverdue(t.due_date, currentStatus);

      if (filterTab === "pendentes" && currentStatus === "concluida") return false;
      if (filterTab === "em_andamento" && currentStatus !== "em_andamento") return false;
      if (filterTab === "atrasadas" && (!overdue || currentStatus === "concluida")) return false;
      if (filterTab === "concluidas" && currentStatus !== "concluida") return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchEquip = t.equipment.toLowerCase().includes(q);
        const matchProj = (t.project_name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchEquip && !matchProj) return false;
      }

      return true;
    });
  }, [assigneeTasks, filterTab, searchTerm, taskForms]);

  // Quick stats for current assignee
  const stats = useMemo(() => {
    const total = assigneeTasks.length;
    const completed = assigneeTasks.filter((t) => (taskForms[t.id]?.status || t.status) === "concluida").length;
    const inProgress = assigneeTasks.filter((t) => (taskForms[t.id]?.status || t.status) === "em_andamento").length;
    const pending = assigneeTasks.filter((t) => (taskForms[t.id]?.status || t.status) === "pendente").length;
    const overdue = assigneeTasks.filter((t) => {
      const s = taskForms[t.id]?.status || t.status;
      return isOverdue(t.due_date, s) && s !== "concluida";
    }).length;
    const impeded = assigneeTasks.filter((t) => {
      const f = taskForms[t.id];
      return f?.hasImpediment && f?.status !== "concluida";
    }).length;

    return { total, completed, inProgress, pending, overdue, impeded };
  }, [assigneeTasks, taskForms]);

  // Handle Form field changes for a task
  const handleFieldChange = (taskId: string, field: string, value: any) => {
    setTaskForms((prev) => {
      const current = prev[taskId] || {
        status: "pendente",
        progress: 0,
        notes: "",
        impediment: "",
        hasImpediment: false,
        isSaving: false,
        isSaved: false,
        showDetails: false,
      };

      const updated = { ...current, [field]: value, isSaved: false };

      // Automations:
      if (field === "status") {
        if (value === "concluida") {
          updated.progress = 100;
          updated.hasImpediment = false;
        } else if (value === "em_andamento" && updated.progress === 0) {
          updated.progress = 25;
        }
      }

      if (field === "progress") {
        if (value === 100) {
          updated.status = "concluida";
          updated.hasImpediment = false;
        } else if (value > 0 && updated.status === "pendente") {
          updated.status = "em_andamento";
        }
      }

      return { ...prev, [taskId]: updated };
    });
  };

  // Save changes to a single task
  const handleSaveTask = async (task: Task) => {
    const form = taskForms[task.id];
    if (!form) return;

    try {
      setTaskForms((prev) => ({
        ...prev,
        [task.id]: { ...prev[task.id], isSaving: true },
      }));

      const impedimentValue = form.hasImpediment && form.impediment.trim() ? form.impediment.trim() : null;

      await updateTaskExecution(task.id, {
        status: form.status,
        progress_percent: Number(form.progress),
        notes: form.notes ? form.notes.trim() : null,
        impediment: impedimentValue,
      });

      // Update in local task list
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: form.status,
                progress_percent: Number(form.progress),
                notes: form.notes ? form.notes.trim() : null,
                impediment: impedimentValue,
              }
            : t
        )
      );

      setTaskForms((prev) => ({
        ...prev,
        [task.id]: { ...prev[task.id], isSaving: false, isSaved: true },
      }));

      success(`✅ Apontamento salvo para "${task.title.substring(0, 32)}..."`);

      // Reset saved badge after 4s
      setTimeout(() => {
        setTaskForms((prev) => ({
          ...prev,
          [task.id]: { ...prev[task.id], isSaved: false },
        }));
      }, 4000);
    } catch (err) {
      console.error(err);
      error("Erro ao salvar apontamento no banco de dados.");
      setTaskForms((prev) => ({
        ...prev,
        [task.id]: { ...prev[task.id], isSaving: false },
      }));
    }
  };

  // Copy technician's portal link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/atualizar?r=${selectedAssigneeId}`;
      navigator.clipboard.writeText(url);
      info("📋 Link do seu portal copiado! Salve nos seus favoritos.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <h2 className="text-base font-bold">Carregando Portal de Apontamento...</h2>
        <p className="text-xs text-slate-400 mt-1">Conectando ao sistema Fibrasa</p>
      </div>
    );
  }

  // SCREEN 1: No technician selected (Selector Screen)
  if (!selectedAssigneeId || !currentAssignee) {
    const filteredAssigneeList = assignees.filter((a) =>
      a.name.toLowerCase().includes(searchAssignee.toLowerCase()) ||
      a.sector.toLowerCase().includes(searchAssignee.toLowerCase()) ||
      a.role.toLowerCase().includes(searchAssignee.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Portal do Executor</h1>
            <p className="text-xs text-slate-400">
              Selecione seu nome para visualizar e atualizar suas atividades na Fibrasa
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchAssignee}
              onChange={(e) => setSearchAssignee(e.target.value)}
              placeholder="Buscar pelo seu nome ou setor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* List of Assignees */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredAssigneeList.map((a) => {
              const myTasksCount = tasks.filter((t) => t.assignee_id === a.id && t.status !== "concluida").length;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAssigneeId(a.id);
                    if (typeof window !== "undefined") {
                      window.history.replaceState(null, "", `/atualizar?r=${a.id}`);
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/70 hover:bg-emerald-950/40 border border-slate-700/70 hover:border-emerald-500/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-xs shadow-xs ${
                        a.avatar_color || "bg-emerald-600"
                      }`}
                    >
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                        {a.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{a.sector || a.role}</p>
                    </div>
                  </div>

                  {myTasksCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {myTasksCount} pendente(s)
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Sem pendências</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-center pt-2 border-t border-slate-700/50">
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white transition">
              ← Voltar ao Painel Geral de Manutenção
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Technician portal active
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Top Banner Fibrasa Branding */}
      <header className="bg-[#0b512c] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo container */}
            <div className="bg-white rounded-lg p-1.5 shadow-2xs flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-fibrasa.png" alt="Fibrasa" className="h-6 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-tight">Portal do Executor</h1>
              <p className="text-[10px] text-emerald-200">Apontamento de Prazos & Status</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copiar link deste portal para o WhatsApp ou Favoritos"
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs transition flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">Copiar Link</span>
            </button>

            <button
              onClick={() => setSelectedAssigneeId("")}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              Trocar Pessoa
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 space-y-4">
        {/* Welcome Card for Technician */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl text-white font-extrabold flex items-center justify-center text-sm shadow-xs ${
                  currentAssignee.avatar_color || "bg-[#147846]"
                }`}
              >
                {currentAssignee.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {currentAssignee.name}
                  </h2>
                </div>
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5" />
                  {currentAssignee.sector || "Manutenção"}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <span>Painel</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick Counter Pills */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="block text-base font-black text-slate-800">{stats.total}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Atribuídas</span>
            </div>
            <div className="bg-blue-50 p-2 rounded-xl">
              <span className="block text-base font-black text-blue-700">{stats.inProgress}</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase">Em Andamento</span>
            </div>
            <div className={`p-2 rounded-xl ${stats.overdue > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>
              <span className="block text-base font-black">{stats.overdue}</span>
              <span className="text-[10px] font-bold uppercase">Atrasadas</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl">
              <span className="block text-base font-black text-emerald-700">{stats.completed}</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Concluídas</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setFilterTab("pendentes")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                filterTab === "pendentes"
                  ? "bg-[#147846] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pendentes ({stats.pending + stats.inProgress})
            </button>
            <button
              onClick={() => setFilterTab("em_andamento")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                filterTab === "em_andamento"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Em Andamento ({stats.inProgress})
            </button>
            {stats.overdue > 0 && (
              <button
                onClick={() => setFilterTab("atrasadas")}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  filterTab === "atrasadas"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                🚨 Atrasadas ({stats.overdue})
              </button>
            )}
            <button
              onClick={() => setFilterTab("concluidas")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                filterTab === "concluidas"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Concluídas ({stats.completed})
            </button>
            <button
              onClick={() => setFilterTab("todas")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                filterTab === "todas"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas ({stats.total})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar atividade ou equipamento..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Task Cards List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const form = taskForms[task.id] || {
                status: task.status,
                progress: task.progress_percent || 0,
                notes: task.notes || "",
                impediment: task.impediment || "",
                hasImpediment: Boolean(task.impediment),
                isSaving: false,
                isSaved: false,
                showDetails: false,
              };

              const isDirectTaskTarget = urlTaskId === task.id;
              const overdue = isOverdue(task.due_date, form.status);
              const dueToday = isDueToday(task.due_date, form.status);
              const daysLate = calculateDaysOverdue(task.due_date);
              const pConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.media;

              return (
                <div
                  key={task.id}
                  id={`task-${task.id}`}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                    isDirectTaskTarget
                      ? "ring-2 ring-emerald-500 border-emerald-400 shadow-md"
                      : overdue && form.status !== "concluida"
                      ? "border-red-300"
                      : form.status === "concluida"
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-slate-200"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Top Tags & Priority */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {task.project_name || "Projeto Geral"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pConfig.badge}`}>
                          {pConfig.label}
                        </span>
                      </div>

                      {/* Prazo Indicator */}
                      {form.status === "concluida" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Finalizada
                        </span>
                      ) : overdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Atrasada ({daysLate}d) • Prazo: {formatDateBR(task.due_date)}
                        </span>
                      ) : dueToday ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Vence Hoje ({formatDateBR(task.due_date)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Prazo: {formatDateBR(task.due_date)}
                        </span>
                      )}
                    </div>

                    {/* Title & Equipment */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Wrench className="w-3.5 h-3.5 text-slate-400" />
                          {task.equipment}
                        </span>
                        <span>•</span>
                        <span>{task.sector}</span>
                      </div>
                    </div>

                    {/* Description Toggle */}
                    {task.description && (
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100 space-y-1">
                        <div className="font-semibold text-slate-700">Instruções / Escopo:</div>
                        <p className="leading-relaxed whitespace-pre-line">{task.description}</p>
                      </div>
                    )}

                    {/* FORM SECTION: Status, Progresso, Apontamentos */}
                    <div className="pt-3 border-t border-slate-100 space-y-4">
                      {/* 1. Status Selection Buttons */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          1. Status da Atividade:
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFieldChange(task.id, "status", "pendente")}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                              form.status === "pendente"
                                ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Pendente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(task.id, "status", "em_andamento")}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                              form.status === "em_andamento"
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs animate-pulse"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Em Curso
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(task.id, "status", "concluida")}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center flex items-center justify-center gap-1 ${
                              form.status === "concluida"
                                ? "bg-[#147846] text-white border-[#147846] shadow-xs"
                                : "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Concluída</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(task.id, "status", "pausada")}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                              form.status === "pausada"
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Pausada
                          </button>
                        </div>
                      </div>

                      {/* 2. Progress Slider & Chips */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            2. Progresso de Execução:
                          </label>
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            {form.progress}%
                          </span>
                        </div>

                        {/* Quick Percentage Chips */}
                        <div className="grid grid-cols-5 gap-1.5 mb-2">
                          {[0, 25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleFieldChange(task.id, "progress", pct)}
                              className={`py-1 text-xs font-bold rounded-lg border transition ${
                                form.progress === pct
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-black"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={form.progress}
                          onChange={(e) => handleFieldChange(task.id, "progress", Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                        />
                      </div>

                      {/* 3. Notes / Daily execution record */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          3. Apontamento / O que foi realizado hoje:
                        </label>
                        <textarea
                          rows={2}
                          value={form.notes}
                          onChange={(e) => handleFieldChange(task.id, "notes", e.target.value)}
                          placeholder="Ex: Trocado rolamento 6312, ajustada tensão da correia e realizado teste de 15min sem ruído."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      {/* 4. Impediment Toggle & Input */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleFieldChange(task.id, "hasImpediment", !form.hasImpediment)}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                            form.hasImpediment
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className={`w-4 h-4 ${form.hasImpediment ? "text-rose-600" : "text-slate-400"}`} />
                            <span>{form.hasImpediment ? "🚨 Atividade com Impedimento Ativo" : "Relatar Impedimento / Parada"}</span>
                          </div>
                          <span className="text-[11px] underline">
                            {form.hasImpediment ? "Desativar" : "Informar"}
                          </span>
                        </button>

                        {form.hasImpediment && (
                          <div className="mt-2 p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1 animate-in fade-in">
                            <label className="block text-[11px] font-bold text-rose-800">
                              Descreva o motivo do impedimento:
                            </label>
                            <input
                              type="text"
                              value={form.impediment}
                              onChange={(e) => handleFieldChange(task.id, "impediment", e.target.value)}
                              placeholder="Ex: Aguardando parada da linha pela Produção / Falta de peça no almoxarifado"
                              className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* 5. Save Button for this task */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        {form.isSaved ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-2 rounded-xl">
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Apontamento Salvo com Sucesso!</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Pressione salvar para gravar no sistema
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={form.isSaving}
                          onClick={() => handleSaveTask(task)}
                          className={`ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                            form.status === "concluida"
                              ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                              : "bg-[#0b512c] hover:bg-[#084224] active:scale-95"
                          } ${form.isSaving ? "opacity-75 cursor-not-allowed" : ""}`}
                        >
                          {form.isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : form.status === "concluida" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirmar Conclusão</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Salvar Apontamento</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">Nenhuma atividade nesta categoria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Todas as suas tarefas para este filtro foram resolvidas ou não correspondem à sua busca.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AtualizarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
          <span>Carregando portal...</span>
        </div>
      }
    >
      <AtualizarContent />
    </Suspense>
  );
}
