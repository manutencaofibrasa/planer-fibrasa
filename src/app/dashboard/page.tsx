"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Layers,
  TrendingUp,
  Users,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { DashboardStats, Task } from "@/types";
import { getDashboardStats, saveTask } from "@/lib/repository";
import { formatDateBR, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/utils";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

export default function DashboardPage() {
  const { success } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
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

  const handleQuickComplete = async (task: Task) => {
    await saveTask({
      ...task,
      status: "concluida",
      progress_percent: 100,
    });
    success(`Atividade "${task.title}" marcada como concluída!`);
    loadData();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Carregando painel executivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Executivo</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visão consolidada de prazos, responsabilidades e gargalos da manutenção
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setTaskToEdit(null);
              setTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atividade</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalTasks || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">atividades registradas</p>
        </div>

        {/* Concluídas */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats?.completedTasks || 0}</div>
          <p className="text-[11px] text-emerald-600 mt-1">{stats?.completionRate || 0}% do total</p>
        </div>

        {/* Em Andamento */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Em Andamento</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{stats?.inProgressTasks || 0}</div>
          <p className="text-[11px] text-blue-600 mt-1">em execução ativa</p>
        </div>

        {/* Atrasadas */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs bg-red-50/30">
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atrasadas</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-700">{stats?.overdueTasks || 0}</div>
          <p className="text-[11px] text-red-600 font-medium mt-1">requerem atenção</p>
        </div>

        {/* Impedidas */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Impedidas</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats?.impededTasks || 0}</div>
          <p className="text-[11px] text-amber-600 mt-1">aguardando liberação</p>
        </div>

        {/* Vencendo Hoje */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vencendo Hoje</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{stats?.dueTodayTasks || 0}</div>
          <p className="text-[11px] text-purple-600 mt-1">prazo final hoje</p>
        </div>
      </div>

      {/* Gráficos em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status das Atividades (Donut) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Status das Atividades
            </h3>
            <span className="text-xs text-slate-500">Distribuição</span>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.tasksByStatus}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {stats?.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{stats?.totalTasks}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {stats?.tasksByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 truncate">{s.label}:</span>
                <span className="font-bold text-slate-900 ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Atividades por Responsável (Barra Horizontal / Vertical) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Carga por Responsável
            </h3>
            <span className="text-xs text-slate-500">Atividades ativas</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.tasksByAssignee} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="completed" name="Concluídas" fill="#10b981" stackId="a" />
                <Bar dataKey="inProgress" name="Em Andamento" fill="#3b82f6" stackId="a" />
                <Bar dataKey="overdue" name="Atrasadas" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolução Temporal */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Evolução Temporal
            </h3>
            <span className="text-xs text-slate-500">Concluídas vs Criadas</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.evolutionTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="completed" name="Concluídas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="created" name="Total Criadas" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Atividades Críticas / Que Precisam de Atenção */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Atividades Críticas e em Atraso</h3>
              <p className="text-xs text-slate-500">Priorize a cobrança de prazos e o destravamento dos técnicos</p>
            </div>
          </div>
          <Link
            href="/atividades"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>Ver todas as atividades</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {stats?.criticalTasks && stats.criticalTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Atividade & Equipamento</th>
                  <th className="py-3 px-4">Projeto</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Prazo</th>
                  <th className="py-3 px-4">Atraso</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Cobrança WhatsApp</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.criticalTasks.map((task) => {
                  const priority = PRIORITY_CONFIG[task.priority];
                  const status = TASK_STATUS_CONFIG[task.status];

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 leading-tight">{task.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700">{task.equipment}</span>
                          <span>•</span>
                          <span>{task.sector}</span>
                        </div>
                        {task.impediment && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate max-w-xs">{task.impediment}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {task.project_name}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {task.assignee_name?.charAt(0) || "U"}
                          </div>
                          <span className="text-slate-800 font-medium">{task.assignee_name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {formatDateBR(task.due_date)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {task.daysOverdue > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            {task.daysOverdue} {task.daysOverdue === 1 ? "dia" : "dias"}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
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
                        <WhatsAppButton task={task} variant="outline" size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickComplete(task)}
                            title="Concluir atividade"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setTaskModalOpen(true);
                            }}
                            title="Editar"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <ExternalLink className="w-4 h-4" />
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
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma atividade crítica ou atrasada no momento!</p>
            <p className="text-xs text-slate-400 mt-0.5">Todas as metas e manutenções estão dentro do cronograma.</p>
          </div>
        )}
      </div>

      {/* Task Modal for creation/editing */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSaved={() => loadData()}
      />
    </div>
  );
}
