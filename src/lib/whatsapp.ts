import { Task } from "@/types";
import { formatDateBR, calculateDaysOverdue, TASK_STATUS_CONFIG } from "./utils";

export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  // Se não tiver DDI (ex: 10 ou 11 dígitos no Brasil), adiciona 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function getBaseAppUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "https://planer-fibrasa.vercel.app";
}

export function generateWhatsAppMessage(
  task: Task, 
  type: "lembrete" | "cobranca_atraso" | "impedimento" = "lembrete"
): string {
  const statusLabel = TASK_STATUS_CONFIG[task.status]?.label || task.status;
  const daysOverdue = calculateDaysOverdue(task.due_date);
  const formattedDate = formatDateBR(task.due_date);
  const baseUrl = getBaseAppUrl();
  const directLink = `${baseUrl}/atualizar?r=${encodeURIComponent(task.assignee_id)}&t=${encodeURIComponent(task.id)}`;

  if (type === "cobranca_atraso" || (daysOverdue > 0 && task.status !== "concluida")) {
    return `⚠️ *AVISO DE ATIVIDADE EM ATRASO*

Olá *${task.assignee_name || "Colega"}*,
Identificamos que a seguinte atividade está com o prazo expirado há *${daysOverdue} dia(s)*:

📌 *Atividade:* ${task.title}
📂 *Projeto:* ${task.project_name || "Geral"}
⚙️ *Equipamento:* ${task.equipment || "N/A"} (${task.sector || "Manutenção"})
📅 *Prazo Previsto:* ${formattedDate}
📊 *Progresso Atual:* ${task.progress_percent || 0}%
${task.impediment ? `🚧 *Impedimento:* ${task.impediment}\n` : ""}
👉 *Clique no link para atualizar o status e apontar o progresso:*
🔗 ${directLink}`;
  }

  if (type === "impedimento" && task.impediment) {
    return `🚨 *ATENÇÃO - ATIVIDADE IMPEDIDA*

Olá *${task.assignee_name || "Colega"}*,
Sobre o impedimento registrado na atividade:

📌 *Atividade:* ${task.title}
📂 *Projeto:* ${task.project_name || "Geral"}
🚧 *Impedimento Relatado:* ${task.impediment}
📅 *Prazo:* ${formattedDate}

Qual o suporte necessário da coordenação de manutenção para destravar essa atividade?

👉 *Atualizar atividade:*
🔗 ${directLink}`;
  }

  return `📋 *LEMBRETE DE PRAZO E ATIVIDADE*

Olá *${task.assignee_name || "Colega"}*,
Segue o alinhamento da atividade sob sua responsabilidade:

📌 *Atividade:* ${task.title}
📂 *Projeto:* ${task.project_name || "Geral"}
⚙️ *Equipamento:* ${task.equipment || "N/A"} (${task.sector || "Manutenção"})
📅 *Prazo de Conclusão:* ${formattedDate}
🔄 *Status:* ${statusLabel}
📊 *Progresso Atual:* ${task.progress_percent || 0}%
${task.impediment ? `🚧 *Impedimento:* ${task.impediment}\n` : ""}
👉 *Clique no link para atualizar o status e apontar o progresso:*
🔗 ${directLink}`;
}

export function getWhatsAppLink(task: Task, type?: "lembrete" | "cobranca_atraso" | "impedimento"): string {
  const phone = formatPhoneNumber(task.assignee_phone);
  const message = generateWhatsAppMessage(task, type);
  const encodedText = encodeURIComponent(message);
  
  if (phone) {
    return `https://wa.me/${phone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function generateAssigneeSummaryMessage(assigneeName: string, assigneeId: string, tasks: Task[]): string {
  const baseUrl = getBaseAppUrl();
  const directLink = `${baseUrl}/atualizar?r=${encodeURIComponent(assigneeId)}`;
  const pendingTasks = tasks.filter((t) => t.status !== "concluida");
  
  const tasksLines = pendingTasks.slice(0, 5).map((t, idx) => {
    return `${idx + 1}️⃣ *${t.title}*\n   ⚙️ ${t.equipment} | 📅 Prazo: ${formatDateBR(t.due_date)}`;
  }).join("\n\n");

  const moreCount = pendingTasks.length > 5 ? `\n\n_(+ ${pendingTasks.length - 5} outras atividades na sua lista)_` : "";

  return `📋 *FIBRASA • ATIVIDADES DE MANUTENÇÃO*

Olá *${assigneeName}*,
Você possui *${pendingTasks.length} atividade(s)* pendente(s) ou em andamento:

${tasksLines}${moreCount}

👉 *Acesse seu portal mobile para apontar o progresso:*
🔗 ${directLink}`;
}

export function getAssigneeSummaryWhatsAppLink(assigneeName: string, assigneeId: string, phone: string | undefined, tasks: Task[]): string {
  const formattedPhone = formatPhoneNumber(phone);
  const message = generateAssigneeSummaryMessage(assigneeName, assigneeId, tasks);
  const encodedText = encodeURIComponent(message);

  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
