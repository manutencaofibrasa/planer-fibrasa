"use client";

import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Database,
  Building,
  Wrench,
  MessageCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { SystemSettings } from "@/types";
import { getSettings, saveSettings, resetToFactoryMockData } from "@/lib/repository";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

export default function ConfiguracoesPage() {
  const { success, error, info } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // New Sector & Equipment input state
  const [newSector, setNewSector] = useState("");
  const [newEquipment, setNewEquipment] = useState("");

  const isSupabase = isSupabaseConfigured();

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await getSettings();
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTemplates = async () => {
    if (!settings) return;
    try {
      await saveSettings(settings);
      success("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      error("Erro ao salvar configurações.");
    }
  };

  const handleAddSector = async () => {
    if (!newSector.trim() || !settings) return;
    if (settings.sectors.includes(newSector.trim())) {
      error("Este setor já está cadastrado.");
      return;
    }

    const updated = {
      ...settings,
      sectors: [...settings.sectors, newSector.trim()],
    };
    setSettings(updated);
    await saveSettings(updated);
    setNewSector("");
    success(`Setor "${newSector.trim()}" adicionado com sucesso.`);
  };

  const handleRemoveSector = async (sec: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      sectors: settings.sectors.filter((s) => s !== sec),
    };
    setSettings(updated);
    await saveSettings(updated);
    info(`Setor "${sec}" removido.`);
  };

  const handleAddEquipment = async () => {
    if (!newEquipment.trim() || !settings) return;
    if (settings.equipments.includes(newEquipment.trim())) {
      error("Este equipamento já está cadastrado.");
      return;
    }

    const updated = {
      ...settings,
      equipments: [...settings.equipments, newEquipment.trim()],
    };
    setSettings(updated);
    await saveSettings(updated);
    setNewEquipment("");
    success(`Equipamento "${newEquipment.trim()}" cadastrado.`);
  };

  const handleRemoveEquipment = async (eq: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      equipments: settings.equipments.filter((e) => e !== eq),
    };
    setSettings(updated);
    await saveSettings(updated);
    info(`Equipamento "${eq}" removido.`);
  };

  const handleResetData = () => {
    if (window.confirm("Deseja redefinir os dados para o padrão industrial de demonstração? Todas as alterações manuais serão resetadas.")) {
      resetToFactoryMockData();
      loadData();
      success("Dados de demonstração restaurados com sucesso!");
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configurações do Sistema</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Parâmetros operacionais, equipamentos industriais, WhatsApp e conexão de banco
        </p>
      </div>

      {/* Supabase Status Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSupabase ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isSupabase ? "Conectado ao Supabase PostgreSQL" : "Modo de Armazenamento Local Ativo"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isSupabase ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isSupabase ? "Em Nuvem" : "Offline / Demonstração"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isSupabase
                  ? "O sistema está gravando e consultando diretamente seu cluster PostgreSQL gerenciado no Supabase."
                  : "O aplicativo está gravando todas as ações no armazenamento local do navegador com alta persistência. Para conectar à nuvem, crie seu projeto no Supabase, execute o script 'supabase/schema.sql' e informe as credenciais no arquivo .env.local."}
              </p>
            </div>
          </div>
        </div>

        {!isSupabase && (
          <div className="mt-4 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono">
            <code>
              NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
            </code>
          </div>
        )}
      </div>

      {/* Sectors and Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Setores Cadastrados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Building className="w-4 h-4 text-blue-600" />
              Setores Fabris
            </h3>
            <span className="text-xs font-semibold text-slate-500">{settings.sectors.length} cadastrados</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              placeholder="Novo setor (ex: Injeção 02)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onKeyDown={(e) => e.key === "Enter" && handleAddSector()}
            />
            <button
              onClick={handleAddSector}
              className="px-3 py-1.5 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {settings.sectors.map((sec) => (
              <div
                key={sec}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-800 border border-slate-100"
              >
                <span className="font-medium">{sec}</span>
                <button
                  onClick={() => handleRemoveSector(sec)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                  title="Remover setor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Equipamentos Cadastrados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-[#147846]" />
              Ativos & Equipamentos
            </h3>
            <span className="text-xs font-semibold text-slate-500">{settings.equipments.length} cadastrados</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="Novo equipamento (ex: Termoformadora 03)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147846]/20"
              onKeyDown={(e) => e.key === "Enter" && handleAddEquipment()}
            />
            <button
              onClick={handleAddEquipment}
              className="px-3 py-1.5 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {settings.equipments.map((eq) => (
              <div
                key={eq}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-800 border border-slate-100"
              >
                <span className="font-medium">{eq}</span>
                <button
                  onClick={() => handleRemoveEquipment(eq)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                  title="Remover equipamento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp Message Templates */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Modelos de Mensagem WhatsApp
          </h3>
          <span className="text-xs text-slate-500">Parâmetros das mensagens disparadas com 1 clique</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Template de Lembrete de Prazo
            </label>
            <textarea
              rows={2}
              value={settings.whatsapp_template_reminder}
              onChange={(e) => setSettings({ ...settings, whatsapp_template_reminder: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Template de Cobrança de Impedimento
            </label>
            <textarea
              rows={2}
              value={settings.whatsapp_template_impediment}
              onChange={(e) => setSettings({ ...settings, whatsapp_template_impediment: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveTemplates}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#147846] hover:bg-[#0f6138] text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Modelos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Factory Reset Action */}
      <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-900">Restaurar Dados de Fábrica</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Recarrega o banco com os projetos, atividades e técnicos industriais padrão da Fibrasa.
          </p>
        </div>
        <button
          onClick={handleResetData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-xs shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restaurar Demonstração</span>
        </button>
      </div>
    </div>
  );
}
