"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, User, Phone, Mail, Building, Briefcase } from "lucide-react";
import { Assignee } from "@/types";
import { saveAssignee, getSettings } from "@/lib/repository";
import { useToast } from "@/context/ToastContext";

interface AssigneeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assigneeToEdit?: Assignee | null;
  onSaved?: (savedAssignee: Assignee) => void;
}

export function AssigneeModal({ isOpen, onClose, assigneeToEdit, onSaved }: AssigneeModalProps) {
  const { success, error } = useToast();
  const [sectors, setSectors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [sector, setSector] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    async function load() {
      const settings = await getSettings();
      setSectors(settings.sectors || []);

      if (assigneeToEdit) {
        setName(assigneeToEdit.name);
        setRole(assigneeToEdit.role);
        setSector(assigneeToEdit.sector);
        setPhone(assigneeToEdit.phone);
        setEmail(assigneeToEdit.email || "");
        setActive(assigneeToEdit.active);
      } else {
        setName("");
        setRole("");
        setSector(settings.sectors?.[0] || "Manutenção Mecânica");
        setPhone("5527");
        setEmail("");
        setActive(true);
      }
    }

    if (isOpen) {
      load();
    }
  }, [isOpen, assigneeToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Informe o nome completo do responsável");
      return;
    }
    if (!role.trim()) {
      error("Informe o cargo ou função");
      return;
    }

    try {
      setSaving(true);
      const saved = await saveAssignee({
        id: assigneeToEdit?.id,
        name: name.trim(),
        role: role.trim(),
        sector,
        phone: phone.trim(),
        email: email.trim() || undefined,
        active,
      });

      success(assigneeToEdit ? "Responsável atualizado com sucesso!" : "Novo responsável adicionado com sucesso!");
      if (onSaved) onSaved(saved);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro ao salvar responsável.";
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full my-6 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {assigneeToEdit ? "Editar Responsável" : "Novo Responsável"}
              </h2>
              <p className="text-xs text-slate-500">Cadastre dados de contato e celular para WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gustavo Mendes"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Cargo / Função *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Mecânico Líder"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Setor Principal
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                >
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-emerald-700">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Telefone Celular (WhatsApp) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 5527998123456 (DDI + DDD + Número)"
                className="w-full px-3.5 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Usado para o disparo das mensagens e cobranças automáticas de prazos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                E-mail Corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: gustavo.mendes@fibrasa.com.br"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="assignee-active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="assignee-active" className="text-xs font-medium text-slate-700 select-none">
                Responsável ativo para novas atribuições
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/70 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#147846] hover:bg-[#0f6138] rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{saving ? "Salvando..." : assigneeToEdit ? "Salvar Alterações" : "Adicionar Responsável"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
