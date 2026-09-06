import { Link, useLocation } from "wouter";
import { BarChart3, BookOpen, LayoutDashboard, LogOut, MessageSquare, Plus, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/new-training", label: "Novo treinamento", icon: Plus },
  { href: "/history", label: "Histórico", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#14231f]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-[#dfe5df] bg-[#fbfcfa] px-5 py-6 lg:flex">
        <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#14231f] text-[#dff7e6]"><Sparkles size={17} /></span>
          <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">Sales Simulator</span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#85918b]">Workspace</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || (item.href === "/dashboard" && location === "/");
            return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150", active ? "bg-[#e8f5e9] text-[#1d6b4b]" : "text-[#66736d] hover:bg-[#f0f3ef] hover:text-[#14231f]")}><item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />{item.label}</Link>;
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl bg-[#14231f] p-4 text-[#e8f5e9]">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#a9dec0]"><Target size={14} /> Foco da sessão</div>
            <p className="text-[13px] leading-5 text-[#d3e6d9]">Descobrir o que o cliente realmente precisa antes de propor.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-[#dfe5df] px-2 pt-5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#f4c2a1] text-xs font-bold text-[#7c3f25]">VC</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Vendedor em treino</p><p className="text-[11px] text-[#85918b]">MVP individual</p></div>
            <LogOut size={15} className="text-[#a7b1ab]" />
          </div>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e4e9e3]/80 bg-[#f6f7f4]/90 px-5 backdrop-blur-md lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#14231f] text-[#dff7e6]"><Sparkles size={15} /></span><span className="font-display text-sm font-semibold">Sales Simulator</span></Link>
          <Link href="/new-training" className="grid h-9 w-9 place-items-center rounded-lg bg-[#1d6b4b] text-white"><Plus size={17} /></Link>
        </header>
        <main className="mx-auto min-h-screen max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d6b4b]"><MessageSquare size={13} /> {eyebrow}</div><h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-[#14231f] sm:text-[38px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">{description}</p>}</div>{action}</div>;
}

export function StatCard({ label, value, note, accent = "green" }: { label: string; value: string; note: string; accent?: "green" | "orange" | "dark" }) {
  const colors = { green: "bg-[#e6f4e9] text-[#1d6b4b]", orange: "bg-[#fff0e7] text-[#a8552d]", dark: "bg-[#e7ece9] text-[#14231f]" };
  return <div className="rounded-2xl border border-[#e0e7e0] bg-white p-5 shadow-[0_4px_20px_rgba(20,35,31,0.035)]"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-medium text-[#718078]">{label}</span><span className={cn("rounded-lg px-2 py-1 text-[10px] font-semibold", colors[accent])}>{note}</span></div><div className="font-display text-3xl font-semibold tracking-[-0.04em] text-[#14231f]">{value}</div></div>;
}
