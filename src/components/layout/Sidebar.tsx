"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  FileBarChart,
  Settings,
  AlertCircle,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { getDashboardStats } from "@/lib/repository";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [overdueCount, setOverdueCount] = useState<number>(0);

  const loadBadges = async () => {
    try {
      const stats = await getDashboardStats();
      setOverdueCount(stats.overdueTasks);
    } catch {
      // Ignora erro inicial
    }
  };

  useEffect(() => {
    loadBadges();
    const handleUpdate = () => loadBadges();
    window.addEventListener("planer_data_changed", handleUpdate);
    return () => window.removeEventListener("planer_data_changed", handleUpdate);
  }, []);

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projetos", href: "/projetos", icon: FolderKanban },
    { name: "Atividades", href: "/atividades", icon: CheckSquare, badge: overdueCount > 0 ? overdueCount : undefined },
    { name: "Responsáveis", href: "/responsaveis", icon: Users },
    { name: "Calendário", href: "/calendario", icon: Calendar },
    { name: "Relatórios", href: "/relatorios", icon: FileBarChart },
    { name: "Configurações", href: "/configuracoes", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header Fibrasa */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="bg-white rounded-xl p-2.5 flex items-center justify-center shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-fibrasa.png"
            alt="Fibrasa Embalagens"
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between px-1">
          <div>
            <div className="text-[13px] font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>PlanerSeman</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#147846]/40 text-[#44ac34] rounded border border-[#147846]/60">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Coordenação de Manutenção</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#27aa0f] shadow-xs shadow-[#27aa0f]" title="Sistema Operacional" />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#147846] text-white shadow-sm shadow-[#147846]/40 font-semibold border-l-4 border-[#44ac34]"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? "bg-red-500 text-white" : "bg-red-500/20 text-red-400"
                  }`}
                  title={`${item.badge} atividades em atraso`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Alerta de Atrasos se houver */}
      {overdueCount > 0 && (
        <div className="px-4 py-3 mx-3 mb-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <div className="text-xs text-red-300">
            <span className="font-semibold">{overdueCount}</span> atividade(s) precisam de atenção imediata.
          </div>
        </div>
      )}

      {/* User Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center font-bold text-white text-sm">
            FS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Frank Silva</p>
            <p className="text-xs text-slate-400 truncate">Coordenação Geral</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
