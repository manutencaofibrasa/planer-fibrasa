"use client";

import React, { useState } from "react";
import { MessageCircle, ExternalLink, AlertTriangle, Clock, HelpCircle, X } from "lucide-react";
import { Task } from "@/types";
import { getWhatsAppLink, generateWhatsAppMessage } from "@/lib/whatsapp";
import { isOverdue } from "@/lib/utils";

interface WhatsAppButtonProps {
  task: Task;
  variant?: "icon" | "full" | "outline";
  size?: "sm" | "md";
}

export function WhatsAppButton({ task, variant = "icon", size = "sm" }: WhatsAppButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const overdue = isOverdue(task.due_date, task.status);
  const defaultType = overdue ? "cobranca_atraso" : task.impediment ? "impedimento" : "lembrete";
  const [selectedType, setSelectedType] = useState<"lembrete" | "cobranca_atraso" | "impedimento">(defaultType);

  const previewMessage = generateWhatsAppMessage(task, selectedType);
  const currentLink = getWhatsAppLink(task, selectedType);

  const handleOpenWhatsApp = () => {
    window.open(currentLink, "_blank", "noopener,noreferrer");
    setModalOpen(false);
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          title={`Enviar cobrança via WhatsApp para ${task.assignee_name || "responsável"}`}
          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        {modalOpen && renderModal()}
      </>
    );
  }

  if (variant === "outline") {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 transition-colors ${
            size === "sm" ? "text-xs" : "text-sm py-2 px-3"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cobrar no WhatsApp</span>
        </button>

        {modalOpen && renderModal()}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>WhatsApp</span>
      </button>

      {modalOpen && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Enviar Cobrança no WhatsApp</h3>
                <p className="text-xs text-slate-500">
                  Destinatário: <span className="font-semibold text-slate-700">{task.assignee_name || "Sem responsável"}</span>
                  {task.assignee_phone && ` (${task.assignee_phone})`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo de Mensagem:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedType("lembrete")}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition ${
                    selectedType === "lembrete"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Lembrete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("cobranca_atraso")}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition ${
                    selectedType === "cobranca_atraso"
                      ? "border-red-500 bg-red-50 text-red-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cobrança Atraso</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("impedimento")}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition ${
                    selectedType === "impedimento"
                      ? "border-amber-500 bg-amber-50 text-amber-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Impedimento</span>
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Prévia da Mensagem Formatada:
              </label>
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-xs whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto border border-slate-800">
                {previewMessage}
              </div>
            </div>

            {!task.assignee_phone && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Este responsável não possui telefone cadastrado. O WhatsApp Web abrirá para você escolher o contato manualmente.
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
