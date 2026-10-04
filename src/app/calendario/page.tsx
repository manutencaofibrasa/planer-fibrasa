"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Plus,
} from "lucide-react";
import { Task } from "@/types";
import { getTasks } from "@/lib/repository";
import { formatDateBR, isOverdue, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/utils";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { TaskModal } from "@/components/tasks/TaskModal";

export default function CalendarioPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 18)); // Mês do contexto
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const allTasks = await getTasks();
      setTasks(allTasks);

      // Default selected today
      const todayStr = "2026-09-18";
      setSelectedDateStr(todayStr);
      setSelectedDayTasks(allTasks.filter((t) => t.due_date === todayStr));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("planer_data_changed", handleUpdate);
    return () => window.removeEventListener("planer_data_changed", handleUpdate);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const handleSelectDay = (day: number) => {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${mStr}-${dStr}`;
    setSelectedDateStr(dateStr);
    const matched = tasks.filter((t) => t.due_date === dateStr);
    setSelectedDayTasks(matched);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Calendário de Prazos</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cronograma mensal de entregas, paradas e intervenções
          </p>
        </div>

        <button
          onClick={() => setTaskModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Atividade</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols on Large screens) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span>{monthNames[month]} {year}</span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-lg bg-slate-50/50" />;
              }

              const mStr = String(month + 1).padStart(2, "0");
              const dStr = String(day).padStart(2, "0");
              const dateStr = `${year}-${mStr}-${dStr}`;
              const dayTasks = tasks.filter((t) => t.due_date === dateStr);
              const isSelected = selectedDateStr === dateStr;
              const hasOverdue = dayTasks.some((t) => isOverdue(t.due_date, t.status));

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleSelectDay(day)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? "text-blue-700 font-black" : "text-slate-700"}`}>
                      {day}
                    </span>
                    {hasOverdue && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Prazo expirado" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[10px] truncate px-1 py-0.5 rounded font-medium ${
                          t.status === "concluida"
                            ? "bg-emerald-100 text-emerald-800"
                            : isOverdue(t.due_date, t.status)
                            ? "bg-red-100 text-red-800 font-bold"
                            : t.priority === "critica"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-bold text-center">
                        +{dayTasks.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Prazos em {selectedDateStr ? formatDateBR(selectedDateStr) : "Selecione um dia"}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedDayTasks.length} atividade(s) com entrega prevista
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {selectedDayTasks.length > 0 ? (
              selectedDayTasks.map((task) => {
                const priority = PRIORITY_CONFIG[task.priority];
                const status = TASK_STATUS_CONFIG[task.status];
                const overdue = isOverdue(task.due_date, task.status);

                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${priority.badge}`}>
                        {priority.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.equipment} ({task.sector})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Resp: <strong className="text-slate-800">{task.assignee_name}</strong></span>
                      </div>
                    </div>

                    {task.impediment && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{task.impediment}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badge}`}>
                        {status.label}
                      </span>
                      <WhatsAppButton task={task} variant="outline" size="sm" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Nenhum prazo registrado para este dia.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
