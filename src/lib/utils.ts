import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Priority, TaskStatus, ProjectStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    const parts = dateString.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return dateString;
  }
}

export function extractPromisedDate(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/\[Previsão:\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\]/i);
  if (!match) return null;
  const raw = match[1];
  if (raw.includes("/")) {
    const parts = raw.split("/");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return raw;
}

export function extractCleanNotes(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(/\[Previsão:\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\]\s*/gi, "").trim();
}

export function formatNotesWithPromisedDate(notesText?: string | null, promisedDate?: string | null): string {
  const clean = extractCleanNotes(notesText);
  if (promisedDate && promisedDate.trim()) {
    return `[Previsão: ${promisedDate.trim()}] ${clean}`.trim();
  }
  return clean;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdue(dueDateString?: string | null, status?: TaskStatus): boolean {
  if (!dueDateString || status === "concluida") return false;
  const today = getTodayDateString();
  return dueDateString.split("T")[0] < today;
}

export function isDueToday(dueDateString?: string | null, status?: TaskStatus): boolean {
  if (!dueDateString || status === "concluida") return false;
  const today = getTodayDateString();
  return dueDateString.split("T")[0] === today;
}

export function calculateDaysOverdue(dueDateString?: string | null): number {
  if (!dueDateString) return 0;
  const todayStr = getTodayDateString();
  const dueStr = dueDateString.split("T")[0];
  
  const todayDate = new Date(todayStr + "T00:00:00Z");
  const dueDate = new Date(dueStr + "T00:00:00Z");
  
  const diffTime = todayDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; badge: string; border: string; text: string; bg: string }> = {
  critica: {
    label: "Crítica",
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    border: "border-l-red-500",
    text: "text-red-600",
    bg: "bg-red-500"
  },
  alta: {
    label: "Alta",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    border: "border-l-orange-500",
    text: "text-orange-600",
    bg: "bg-orange-500"
  },
  media: {
    label: "Média",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    border: "border-l-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-500"
  },
  baixa: {
    label: "Baixa",
    badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    border: "border-l-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-400"
  },
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; badge: string; dot: string }> = {
  pendente: {
    label: "Pendente",
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400"
  },
  em_andamento: {
    label: "Em andamento",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    dot: "bg-blue-500 animate-pulse"
  },
  concluida: {
    label: "Concluída",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    dot: "bg-emerald-500"
  },
  pausada: {
    label: "Pausada",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500"
  },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; badge: string }> = {
  planejamento: {
    label: "Planejamento",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
  },
  em_andamento: {
    label: "Em andamento",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
  },
  pausado: {
    label: "Pausado",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
  },
  concluido: {
    label: "Concluído",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
  },
  cancelado: {
    label: "Cancelado",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
  },
};
