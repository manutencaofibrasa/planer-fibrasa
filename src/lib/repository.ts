import { Assignee, Project, Task, DashboardStats, SystemSettings, TaskStatus } from "@/types";
import { INITIAL_ASSIGNEES, INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_SETTINGS } from "./mock-data";
import { isOverdue, isDueToday, calculateDaysOverdue, TASK_STATUS_CONFIG } from "./utils";
import { supabase, isSupabaseConfigured } from "./supabase";

const STORAGE_KEYS = {
  PROJECTS: "planer_seman_projects",
  TASKS: "planer_seman_tasks",
  ASSIGNEES: "planer_seman_assignees",
  SETTINGS: "planer_seman_settings",
};

// Helper para emitir eventos de atualização local
function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("planer_data_changed"));
  }
}

// Helper para limpar campos undefined antes de enviar ao Supabase
function cleanPayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// Inicializa dados no localStorage se vazios
function initLocalStorage() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNEES)) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNEES, JSON.stringify(INITIAL_ASSIGNEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  }
}

// ==========================================
// PROJETOS
// ==========================================

export async function getProjects(): Promise<Project[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (!error && data) return data;
  }

  if (typeof window !== "undefined") {
    initLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return raw ? JSON.parse(raw) : INITIAL_PROJECTS;
  }
  return INITIAL_PROJECTS;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id) || null;
}

export async function saveProject(project: Omit<Project, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<Project> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    if (project.id) {
      const payload = cleanPayload({ ...project, updated_at: now });
      const { data, error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id)
        .select()
        .single();
      if (error) {
        console.error("Erro ao atualizar projeto no Supabase:", error);
        throw new Error(error.message);
      }
      if (data) {
        notifyUpdate();
        return data;
      }
    } else {
      const payload = cleanPayload({ ...project, created_at: now, updated_at: now });
      delete payload.id;
      const { data, error } = await supabase
        .from("projects")
        .insert([payload])
        .select()
        .single();
      if (error) {
        console.error("Erro ao inserir projeto no Supabase:", error);
        throw new Error(error.message);
      }
      if (data) {
        notifyUpdate();
        return data;
      }
    }
  }

  const projects = await getProjects();
  if (project.id) {
    const index = projects.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      const updated: Project = { ...projects[index], ...project, updated_at: now };
      projects[index] = updated;
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      notifyUpdate();
      return updated;
    }
  }

  const newProject: Project = {
    ...project,
    id: `proj-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  projects.unshift(newProject);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  notifyUpdate();
  return newProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from("tasks").delete().eq("project_id", id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir projeto no Supabase:", error);
      throw new Error(error.message);
    }
    notifyUpdate();
    return true;
  }

  const projects = await getProjects();
  const filteredProjects = projects.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));

  // Exclui tarefas locais subordinadas ao projeto
  const tasks = await getTasks();
  const filteredTasks = tasks.filter((t) => t.project_id !== id);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filteredTasks));

  notifyUpdate();
  return true;
}

// ==========================================
// ATIVIDADES
// ==========================================

export async function getTasks(filters?: { projectId?: string; assigneeId?: string; status?: TaskStatus }): Promise<Task[]> {
  let list: Task[] = [];

  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from("tasks").select("*").order("due_date", { ascending: true });
    if (filters?.projectId) query = query.eq("project_id", filters.projectId);
    if (filters?.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
    if (filters?.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (!error && data) list = data;
  } else if (typeof window !== "undefined") {
    initLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    list = raw ? JSON.parse(raw) : INITIAL_TASKS;
  } else {
    list = INITIAL_TASKS;
  }

  if (filters?.projectId) {
    list = list.filter((t) => t.project_id === filters.projectId);
  }
  if (filters?.assigneeId) {
    list = list.filter((t) => t.assignee_id === filters.assigneeId);
  }
  if (filters?.status) {
    list = list.filter((t) => t.status === filters.status);
  }

  return list;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const tasks = await getTasks();
  return tasks.find((t) => t.id === id) || null;
}

export async function saveTask(task: Omit<Task, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<Task> {
  const now = new Date().toISOString();
  const completedAt = task.status === "concluida" ? (task.completed_at || now) : null;

  // Buscar nome do projeto e dados do responsável se não passados
  const [projects, assignees] = await Promise.all([getProjects(), getAssignees()]);
  const proj = projects.find((p) => p.id === task.project_id);
  const ass = assignees.find((a) => a.id === task.assignee_id);

  const enriched = {
    ...task,
    project_name: proj?.name || task.project_name || "Geral",
    assignee_name: ass?.name || task.assignee_name || "Não atribuído",
    assignee_phone: ass?.phone || task.assignee_phone || "",
    completed_at: completedAt,
  };

  if (isSupabaseConfigured() && supabase) {
    if (task.id) {
      const payload = cleanPayload({ ...enriched, updated_at: now });
      const { data, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", task.id)
        .select()
        .single();
      if (error) {
        console.error("Erro ao atualizar tarefa no Supabase:", error);
        throw new Error(error.message);
      }
      if (data) {
        notifyUpdate();
        return data;
      }
    } else {
      const payload = cleanPayload({ ...enriched, created_at: now, updated_at: now });
      delete payload.id;
      const { data, error } = await supabase
        .from("tasks")
        .insert([payload])
        .select()
        .single();
      if (error) {
        console.error("Erro ao inserir tarefa no Supabase:", error);
        throw new Error(error.message);
      }
      if (data) {
        notifyUpdate();
        return data;
      }
    }
  }

  const tasks = await getTasks();
  if (task.id) {
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      const updated: Task = { ...tasks[index], ...enriched, updated_at: now };
      tasks[index] = updated;
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      notifyUpdate();
      return updated;
    }
  }

  const newTask: Task = {
    ...enriched,
    id: `task-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  tasks.unshift(newTask);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  notifyUpdate();
  return newTask;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir tarefa no Supabase:", error);
      throw new Error(error.message);
    }
    notifyUpdate();
    return true;
  }

  const tasks = await getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
  notifyUpdate();
  return true;
}

// ==========================================
// RESPONSÁVEIS
// ==========================================

export async function getAssignees(): Promise<Assignee[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from("assignees").select("*").order("name");
    if (!error && data) return data;
  }

  if (typeof window !== "undefined") {
    initLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNEES);
    return raw ? JSON.parse(raw) : INITIAL_ASSIGNEES;
  }
  return INITIAL_ASSIGNEES;
}

export async function saveAssignee(assignee: Omit<Assignee, "id"> & { id?: string }): Promise<Assignee> {
  const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600", "bg-indigo-600"];
  const color = assignee.avatar_color || colors[Math.floor(Math.random() * colors.length)];

  if (isSupabaseConfigured() && supabase) {
    if (assignee.id) {
      const payload = cleanPayload({ ...assignee, avatar_color: color });
      const { data, error } = await supabase.from("assignees").update(payload).eq("id", assignee.id).select().single();
      if (error) {
        console.error("Erro ao atualizar responsável no Supabase:", error);
        throw new Error(error.message);
      }
      if (data) {
        notifyUpdate();
        return data;
      }
    } else {
      const payload = cleanPayload({ ...assignee, avatar_color: color });
      delete payload.id;
      const { data, error } = await supabase.from("assignees").insert([payload]).select().single();
      if (error) {
        console.error("Erro ao inserir responsável no Supabase:", error);
        throw new Error(error.message);
      }
      if (data) {
        notifyUpdate();
        return data;
      }
    }
  }

  const list = await getAssignees();
  if (assignee.id) {
    const idx = list.findIndex((a) => a.id === assignee.id);
    if (idx !== -1) {
      const updated = { ...list[idx], ...assignee, avatar_color: color };
      list[idx] = updated;
      localStorage.setItem(STORAGE_KEYS.ASSIGNEES, JSON.stringify(list));
      notifyUpdate();
      return updated;
    }
  }

  const created: Assignee = {
    ...assignee,
    id: `ass-${Date.now()}`,
    avatar_color: color,
    active: assignee.active ?? true,
  };
  list.push(created);
  localStorage.setItem(STORAGE_KEYS.ASSIGNEES, JSON.stringify(list));
  notifyUpdate();
  return created;
}

export async function deleteAssignee(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from("assignees").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir responsável no Supabase:", error);
      throw new Error(error.message);
    }
    notifyUpdate();
    return true;
  }

  const list = await getAssignees();
  const filtered = list.filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.ASSIGNEES, JSON.stringify(filtered));
  notifyUpdate();
  return true;
}

// ==========================================
// CONFIGURAÇÕES
// ==========================================

export async function getSettings(): Promise<SystemSettings> {
  if (typeof window !== "undefined") {
    initLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed: SystemSettings = JSON.parse(raw);
      let changed = false;
      parsed.sectors = (parsed.sectors || []).map((s) => {
        if (s === "Oficina Mecânica") {
          changed = true;
          return "Manutenção Mecânica";
        }
        if (s === "Oficina Elétrica") {
          changed = true;
          return "Manutenção Elétrica";
        }
        return s;
      });

      if (!parsed.sectors.includes("PCM")) {
        const idx = parsed.sectors.indexOf("Manutenção Elétrica");
        if (idx !== -1) {
          parsed.sectors.splice(idx + 1, 0, "PCM");
        } else {
          parsed.sectors.push("PCM");
        }
        changed = true;
      }

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      return parsed;
    }
    return INITIAL_SETTINGS;
  }
  return INITIAL_SETTINGS;
}

export async function saveSettings(settings: SystemSettings): Promise<SystemSettings> {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifyUpdate();
  }
  return settings;
}

// ==========================================
// ESTATÍSTICAS E DASHBOARD
// ==========================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const [tasks, assignees] = await Promise.all([getTasks(), getAssignees()]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "concluida").length;
  const inProgressTasks = tasks.filter((t) => t.status === "em_andamento").length;
  const pendingTasks = tasks.filter((t) => t.status === "pendente").length;
  const pausedTasks = tasks.filter((t) => t.status === "pausada").length;

  const overdueTasks = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const impededTasks = tasks.filter((t) => Boolean(t.impediment?.trim()) && t.status !== "concluida").length;
  const dueTodayTasks = tasks.filter((t) => isDueToday(t.due_date, t.status)).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Gráfico de Status
  const tasksByStatus = [
    { status: "concluida" as TaskStatus, label: "Concluídas", count: completedTasks, color: "#10b981" },
    { status: "em_andamento" as TaskStatus, label: "Em andamento", count: inProgressTasks, color: "#3b82f6" },
    { status: "pendente" as TaskStatus, label: "Pendentes", count: pendingTasks, color: "#64748b" },
    { status: "pausada" as TaskStatus, label: "Pausadas", count: pausedTasks, color: "#f59e0b" },
  ];

  // Gráfico por Responsável
  const tasksByAssignee = assignees.map((ass) => {
    const userTasks = tasks.filter((t) => t.assignee_id === ass.id);
    return {
      name: ass.name.split(" ")[0],
      fullName: ass.name,
      total: userTasks.length,
      completed: userTasks.filter((t) => t.status === "concluida").length,
      inProgress: userTasks.filter((t) => t.status === "em_andamento").length,
      overdue: userTasks.filter((t) => isOverdue(t.due_date, t.status)).length,
    };
  }).filter((item) => item.total > 0);

  // Evolução temporal (Últimos dias)
  const evolutionTimeline = [
    { date: "08/09", completed: 1, created: 2 },
    { date: "10/09", completed: 2, created: 3 },
    { date: "12/09", completed: 2, created: 5 },
    { date: "14/09", completed: 2, created: 7 },
    { date: "16/09", completed: 2, created: 8 },
    { date: "18/09", completed: completedTasks, created: totalTasks },
  ];

  // Atividades críticas (Atrasadas, Críticas, ou com Impedimento)
  const criticalTasks = tasks
    .filter((t) => t.status !== "concluida" && (isOverdue(t.due_date, t.status) || t.priority === "critica" || Boolean(t.impediment)))
    .map((t) => ({
      ...t,
      daysOverdue: calculateDaysOverdue(t.due_date),
    }))
    .sort((a, b) => {
      // Prioriza quem tem mais dias de atraso e prioridade crítica
      if (b.daysOverdue !== a.daysOverdue) return b.daysOverdue - a.daysOverdue;
      if (a.priority === "critica") return -1;
      return 1;
    });

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    impededTasks,
    dueTodayTasks,
    completionRate,
    tasksByStatus,
    tasksByAssignee,
    evolutionTimeline,
    criticalTasks,
  };
}

// Reset para dados originais de fábrica
export function resetToFactoryMockData() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.ASSIGNEES, JSON.stringify(INITIAL_ASSIGNEES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    notifyUpdate();
  }
}
