"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Plus, MessageCircle, Database } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenNewTaskModal?: () => void;
}

export function Header({ onToggleMobileMenu, onOpenNewTaskModal }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const supabaseActive = isSupabaseConfigured();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/atividades?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile menu button & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#147846]/10 text-[#147846] border border-[#147846]/20">
              FIBRASA S.A.
            </span>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">
              Gestão de Prazos e Atividades
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Coordenação de Manutenção Industrial</p>
        </div>
      </div>

      {/* Middle: Global Search */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por atividade, projeto, responsável ou equipamento..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#147846]/20 focus:border-[#147846] transition-all"
          />
        </div>
      </form>

      {/* Right: Status badge and Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* Supabase / Local Storage indicator */}
        <div
          title={supabaseActive ? "Conectado ao Supabase PostgreSQL" : "Operando em armazenamento local seguro"}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            supabaseActive
              ? "bg-[#147846]/10 text-[#147846] border-[#147846]/30 font-semibold"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{supabaseActive ? "Supabase Cloud" : "Modo Local"}</span>
        </div>

        {/* WhatsApp Ready Indicator */}
        <div
          title="Cobrança via WhatsApp integrada"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-300"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
          <span className="font-semibold">WhatsApp Ready</span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (onOpenNewTaskModal) {
              onOpenNewTaskModal();
            } else {
              router.push("/atividades?action=new");
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#147846] hover:bg-[#0f6138] rounded-lg active:scale-[0.98] transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Nova Atividade</span>
        </button>
      </div>
    </header>
  );
}
