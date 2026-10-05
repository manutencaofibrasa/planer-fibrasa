export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'pausada';

export type ProjectStatus = 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';

export interface Assignee {
  id: string;
  name: string;
  role: string;
  sector: string;
  phone: string; // Ex: "5527999998888" para WhatsApp direto
  email?: string;
  active: boolean;
  avatar_color?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  manager_id?: string;
  manager_name: string;
  start_date: string; // YYYY-MM-DD
  due_date: string;   // YYYY-MM-DD
  status: ProjectStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string;
  project_name?: string;
  assignee_id: string;
  assignee_name?: string;
  assignee_phone?: string;
  sector: string;
  equipment: string;
  start_date: string; // YYYY-MM-DD
  due_date: string;   // YYYY-MM-DD
  priority: Priority;
  status: TaskStatus;
  progress_percent: number; // 0 to 100
  impediment?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  changed_by: string;
  field: string;
  old_value: string;
  new_value: string;
  comment?: string;
  created_at: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  impededTasks: number;
  dueTodayTasks: number;
  completionRate: number;
  tasksByStatus: {
    status: TaskStatus;
    label: string;
    count: number;
    color: string;
  }[];
  tasksByAssignee: {
    name: string;
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  }[];
  evolutionTimeline: {
    date: string;
    completed: number;
    created: number;
  }[];
  criticalTasks: (Task & { daysOverdue: number })[];
}

export interface SystemSettings {
  company_name: string;
  sectors: string[];
  equipments: string[];
  whatsapp_template_reminder: string;
  whatsapp_template_impediment: string;
}
