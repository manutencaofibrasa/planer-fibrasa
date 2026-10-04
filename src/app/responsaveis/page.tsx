"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  Mail,
  Building,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Edit2,
  Trash2,
  Search,
  Copy,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { Assignee, Task } from "@/types";
import { getAssignees, getTasks, deleteAssignee } from "@/lib/repository";
import { isOverdue } from "@/lib/utils";
import { formatPhoneNumber, getAssigneeSummaryWhatsAppLink } from "@/lib/whatsapp";
import { AssigneeModal } from "@/components/assignees/AssigneeModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/context/ToastContext";

interface AssigneeCardData extends Assignee {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export default function ResponsaveisPage() {
  const { success, error, info } = useToast();
  const [assignees, setAssignees] = useState<AssigneeCardData[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [asses, tasks] = await Promise.all([getAssignees(), getTasks()]);
      setAllTasks(tasks);

      const enriched: AssigneeCardData[] = asses.map((a) => {
        const userTasks = tasks.filter((t) => t.assignee_id === a.id);
        return {
          ...a,
          totalTasks: userTasks.length,
          completedTasks: userTasks.filter((t) => t.status === "concluida").length,
          inProgressTasks: userTasks.filter((t) => t.status === "em_andamento").length,
          overdueTasks: userTasks.filter((t) => isOverdue(t.due_date, t.status)).length,
        };
      });

      setAssignees(enriched);
    } catch (err) {
      console.error(err);
      error("Erro ao carregar lista de responsáveis.");
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

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAssignee(deletingId);
      success("Responsável excluído com sucesso.");
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      error("Falha ao excluir responsável.");
    }
  };

  const handleOpenDirectWhatsApp = (assignee: AssigneeCardData) => {
    const userTasks = allTasks.filter((t) => t.assignee_id === assignee.id);
    const url = getAssigneeSummaryWhatsAppLink(assignee.name, assignee.id, assignee.phone, userTasks);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyPortalLink = (assigneeId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/atualizar?r=${assigneeId}`;
      navigator.clipboard.writeText(url);
      info("📋 Link do portal do técnico copiado para a área de transferência!");
    }
  };

  const filteredAssignees = assignees.filter((a) => {
    return (
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.sector.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Equipe & Responsáveis</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestão dos líderes, mecânicos, eletricistas e técnicos de manutenção
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAssignee(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Responsável</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, função, setor ou telefone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid de Responsáveis */}
      {filteredAssignees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignees.map((a) => {
            const initials = a.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("");

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top info with avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-xs ${
                          a.avatar_color || "bg-blue-600"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{a.name}</h3>
                        <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" />
                          {a.role}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {a.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* Sector & Contacts */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{a.sector}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono text-slate-700">{a.phone || "Sem telefone"}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleCopyPortalLink(a.id)}
                          title="Copiar link do portal do técnico"
                          className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Link</span>
                        </button>
                        {a.phone && (
                          <button
                            onClick={() => handleOpenDirectWhatsApp(a)}
                            title="Cobrar pendências via WhatsApp com link do portal"
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cobrar Zap</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {a.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 truncate">{a.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Stats for Assignee */}
                  <div className="grid grid-cols-4 gap-1.5 mt-5 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="block text-base font-black text-slate-900">{a.totalTasks}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Total</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <span className="block text-base font-black text-emerald-700">{a.completedTasks}</span>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold">Feitas</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <span className="block text-base font-black text-blue-700">{a.inProgressTasks}</span>
                      <span className="text-[10px] text-blue-600 uppercase font-bold">Em Curso</span>
                    </div>
                    <div className={`p-2 rounded-lg ${a.overdueTasks > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>
                      <span className="block text-base font-black">{a.overdueTasks}</span>
                      <span className="text-[10px] uppercase font-bold">Atraso</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/atividades?q=${encodeURIComponent(a.name)}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Tarefas ({a.totalTasks})
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link
                      href={`/atualizar?r=${a.id}`}
                      target="_blank"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      title="Abrir o Portal do Executor como este usuário"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Ver Portal</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingAssignee(a);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(a.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">Nenhum responsável encontrado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cadastre os membros da sua equipe de mecânica, elétrica e instrumentação.
          </p>
        </div>
      )}

      {/* Assignee Modal */}
      <AssigneeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAssignee(null);
        }}
        assigneeToEdit={editingAssignee}
        onSaved={() => loadData()}
      />

      {/* Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Excluir Responsável"
        message="Tem certeza que deseja excluir este responsável? Certifique-se de reatribuir suas tarefas antes de prosseguir."
        confirmLabel="Sim, Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
