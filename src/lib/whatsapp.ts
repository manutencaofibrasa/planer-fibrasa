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

export function generateWhatsAppMessage(
  task: Task, 
  type: "lembrete" | "cobranca_atraso" | "impedimento" = "lembrete"
): string {
  const statusLabel = TASK_STATUS_CONFIG[task.status]?.label || task.status;
  const daysOverdue = calculateDaysOverdue(task.due_date);
  const formattedDate = formatDateBR(task.due_date);

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
Por favor, acesse o sistema para atualizar o andamento ou informe quando será finalizada.`;
  }

  if (type === "impedimento" && task.impediment) {
    return `🚨 *ATENÇÃO - ATIVIDADE IMPEDIDA*

Olá *${task.assignee_name || "Colega"}*,
Sobre o impedimento registrado na atividade:

📌 *Atividade:* ${task.title}
📂 *Projeto:* ${task.project_name || "Geral"}
🚧 *Impedimento Relatado:* ${task.impediment}
📅 *Prazo:* ${formattedDate}

Qual o suporte necessário da coordenação de manutenção para desbloquear essa atividade?`;
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
Contamos com a sua execução no prazo acordado. Bom trabalho!`;
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
