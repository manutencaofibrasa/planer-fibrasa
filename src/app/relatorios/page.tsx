"use client";

import React, { useEffect, useState } from "react";
import {
  FileBarChart,
  Printer,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building,
  User,
  Wrench,
} from "lucide-react";
import { Task, Project, Assignee } from "@/types";
import { getTasks, getProjects, getAssignees, getSettings } from "@/lib/repository";
import {
  formatDateBR,
  isOverdue,
  calculateDaysOverdue,
  extractCleanNotes,
  extractPromisedDate,
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
} from "@/lib/utils";

export default function RelatoriosPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");
  const [selectedSector, setSelectedSector] = useState("todos");
  const [selectedAssignee, setSelectedAssignee] = useState("todos");
  const [selectedProject, setSelectedProject] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const inDateRange = (!startDate || t.due_date >= startDate) && (!endDate || t.due_date <= endDate);
    const matchesSector = selectedSector === "todos" || t.sector === selectedSector;
    const matchesAssignee = selectedAssignee === "todos" || t.assignee_id === selectedAssignee;
    const matchesProject = selectedProject === "todos" || t.project_id === selectedProject;
    const matchesStatus = selectedStatus === "todos" || t.status === selectedStatus;

    return inDateRange && matchesSector && matchesAssignee && matchesProject && matchesStatus;
  });

  // KPI Calculations
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === "concluida").length;
  const overdue = filteredTasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const impeded = filteredTasks.filter((t) => Boolean(t.impediment?.trim())).length;
  const onTimeRate = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

  // CSV Export Function
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Título",
      "Projeto",
      "Responsável",
      "Setor",
      "Equipamento",
      "Data Início",
      "Prazo Original",
      "Nova Previsão (Técnico)",
      "Status",
      "Prioridade",
      "% Conclusão",
      "Impedimento",
      "Último Apontamento",
    ];

    const rows = filteredTasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.project_name || "").replace(/"/g, '""')}"`,
      `"${(t.assignee_name || "").replace(/"/g, '""')}"`,
      `"${t.sector}"`,
      `"${t.equipment}"`,
      t.start_date,
      t.due_date,
      t.promised_date || extractPromisedDate(t.notes) || "",
      t.status,
      t.priority,
      t.progress_percent,
      `"${(t.impediment || "").replace(/"/g, '""')}"`,
      `"${(extractCleanNotes(t.notes) || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-atividades-manutencao-${startDate}-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Relatórios Executivos</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Análise consolidada de aderência aos prazos, impedimentos e eficiência operacional
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#147846] hover:bg-[#0f6138] rounded-lg transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Box (Hidden on print) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros do Relatório</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">De (Prazo)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Até (Prazo)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Setor</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="todos">Todos os Setores</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsável</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="todos">Todos</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Projeto</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="todos">Todos os Projetos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="pausada">Pausada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relatório Visual / Impressão */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        {/* Print Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Fibrasa S.A. • Coordenação de Manutenção</span>
              <h1 className="text-xl font-black text-slate-900 mt-0.5">Relatório de Desempenho e Prazos de Atividades</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Período analisado: {formatDateBR(startDate)} a {formatDateBR(endDate)}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Summary Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="block text-2xl font-black text-slate-900">{total}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Atividades</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="block text-2xl font-black text-emerald-700">{completed}</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Concluídas</span>
          </div>
          <div className="p-3 bg-red-50 rounded-xl border border-red-200">
            <span className="block text-2xl font-black text-red-700">{overdue}</span>
            <span className="text-[10px] font-bold text-red-600 uppercase">Em Atraso</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="block text-2xl font-black text-amber-700">{impeded}</span>
            <span className="text-[10px] font-bold text-amber-600 uppercase">Com Impedimento</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="block text-2xl font-black text-blue-700">{onTimeRate}%</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase">Aderência aos Prazos</span>
          </div>
        </div>

        {/* Report Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Atividade</th>
                <th className="py-2.5 px-3">Projeto</th>
                <th className="py-2.5 px-3">Equipamento</th>
                <th className="py-2.5 px-3">Setor</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3">Prazo</th>
                <th className="py-2.5 px-3">Prioridade</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Impedimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const priority = PRIORITY_CONFIG[t.priority];
                const status = TASK_STATUS_CONFIG[t.status];
                const overdue = isOverdue(t.due_date, t.status);
                const cleanNotes = extractCleanNotes(t.notes);
                const promisedDate = t.promised_date || extractPromisedDate(t.notes);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <div className="font-semibold text-slate-900">{t.title}</div>
                      {cleanNotes && (
                        <div className="text-[10px] text-blue-800 bg-blue-50/70 px-1.5 py-0.5 rounded border border-blue-200 mt-1 max-w-sm truncate">
                          💬 {cleanNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{t.project_name}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{t.equipment}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.sector}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{t.assignee_name}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={overdue ? "text-red-700 font-bold" : "text-slate-800"}>
                          {formatDateBR(t.due_date)}
                        </span>
                        {promisedDate && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 inline-block mt-0.5">
                            Nova: {formatDateBR(promisedDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priority.badge}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.badge}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {t.impediment || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
