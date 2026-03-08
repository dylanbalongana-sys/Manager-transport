import { useState } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  BarChart3, Calendar, Lightbulb, ThumbsUp, ThumbsDown,
  Wrench, BanIcon, Zap, Target, ArrowUp, ArrowDown,
  Minus, Star, Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}
function pct(val: number, total: number) {
  if (total === 0) return 0;
  return Math.round((val / total) * 100);
}

type Period = 'week' | 'month' | 'all';

const CAT_LABELS: Record<string, string> = {
  carburant: 'Carburant', huile_moteur: 'Huile moteur', huile_boite: 'Huile de boîte',
  huile_frein: 'Huile de frein', huile_direction: 'Huile direction', huile_differentiel: 'Huile différentiel',
  salaire_chauffeur: 'Salaire chauffeur', salaire_controleur: 'Salaire contrôleur',
  salaire_collaborateur: 'Salaire collaborateur', police_jc: 'Police (JC)',
  assurance: 'Assurance', patente: 'Patente', lavage: 'Lavage', parking: 'Parking', autre: 'Autre',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-1.5 rounded-full" style={{ width: `${w}%`, background: color, transition: 'width 0.8s ease' }} />
    </div>
  );
}

function DonutStat({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
  const p = pct(value, total);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (p / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4} strokeLinecap="round" />
        <text x="36" y="40" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">{p}%</text>
      </svg>
      <p className="text-xs text-center leading-tight" style={{ color: '#9AA4B2' }}>{label}</p>
    </div>
  );
}

function DayBarsChart({ entries, currency }: { entries: { date: string; netRevenue: number; revenue: number; dayType: string }[]; currency: string }) {
  if (entries.length === 0) return null;
  const last7 = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const maxVal = Math.max(...last7.map(e => Math.abs(e.netRevenue)), 1);
  return (
    <div className="space-y-3">
      {last7.map(entry => {
        const isNormal = (entry.dayType || 'normal') === 'normal';
        const net = entry.netRevenue;
        const barW = Math.max(3, (Math.abs(net) / maxVal) * 100);
        const dayLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        return (
          <div key={entry.date} className="flex items-center gap-3">
            <span className="text-xs w-14 flex-shrink-0" style={{ color: '#9AA4B2' }}>{dayLabel}</span>
            <div className="flex-1 h-7 rounded-xl relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-7 rounded-xl" style={{
                width: `${barW}%`,
                background: !isNormal ? 'rgba(255,255,255,0.1)' : net >= 0 ? 'linear-gradient(90deg,#00E676,#00b359)' : 'linear-gradient(90deg,#FF3B3B,#cc0000)',
              }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#F5F7FA' }}>
                {isNormal ? fmt(net, currency) : entry.dayType === 'maintenance' ? '🔧 Maintenance' : '🚫 Inactif'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklySummary({ entries }: { entries: { date: string; netRevenue: number; dayType: string }[] }) {
  const weeks: Record<string, typeof entries> = {};
  entries.forEach(e => {
    const d = new Date(e.date + 'T12:00:00');
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(e);
  });
  const weekKeys = Object.keys(weeks).sort().slice(-4);
  if (weekKeys.length < 2) return <p className="text-sm text-center py-6" style={{ color: '#555e6b' }}>Pas assez de données</p>;
  const maxNet = Math.max(...weekKeys.map(k => Math.abs(weeks[k].reduce((s, e) => s + (e.dayType === 'normal' ? e.netRevenue : 0), 0))), 1);
  return (
    <div>
      <p className="text-xs mb-4 font-medium" style={{ color: '#9AA4B2' }}>Évolution semaine par semaine</p>
      <div className="flex items-end gap-3 h-28">
        {weekKeys.map((key, idx) => {
          const weekNet = weeks[key].reduce((s, e) => s + (e.dayType === 'normal' ? e.netRevenue : 0), 0);
          const h = Math.max(4, (Math.abs(weekNet) / maxNet) * 100);
          const prev = idx > 0 ? weeks[weekKeys[idx - 1]].reduce((s, e) => s + (e.dayType === 'normal' ? e.netRevenue : 0), 0) : null;
          const trend = prev !== null ? (weekNet > prev ? 'up' : weekNet < prev ? 'down' : 'flat') : null;
          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              {trend === 'up' && <ArrowUp className="w-3 h-3" style={{ color: '#00E676' }} />}
              {trend === 'down' && <ArrowDown className="w-3 h-3" style={{ color: '#FF3B3B' }} />}
              {trend === 'flat' && <Minus className="w-3 h-3" style={{ color: '#555e6b' }} />}
              {trend === null && <div className="w-3 h-3" />}
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <div className="w-full rounded-t-xl" style={{
                  height: `${h}%`,
                  background: weekNet >= 0 ? 'linear-gradient(180deg,#00E676,#00b359)' : 'linear-gradient(180deg,#FF3B3B,#cc0000)',
                }} />
              </div>
              <p className="text-[9px] text-center" style={{ color: '#555e6b' }}>
                {new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] font-bold" style={{ color: weekNet >= 0 ? '#00E676' : '#FF3B3B' }}>
                {weekNet >= 0 ? '+' : ''}{Math.round(weekNet / 1000)}k
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ✅ SectionCard défini EN DEHORS de Bilan — jamais recréé lors des re-renders
function SectionCard({
  title, icon: Icon, iconColor, isOpen, onToggle, children
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl" style={{ background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}20` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>{title}</p>
        </div>
        <span style={{
          color: '#9AA4B2', fontSize: 18,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          display: 'inline-block',
        }}>▾</span>
      </button>
      <div style={{ maxHeight: isOpen ? '3000px' : '0', overflow: 'hidden', transition: 'max-height 0.45s ease' }}>
        <div className="px-5 pb-6">
          <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.05)' }} />
          {children}
        </div>
      </div>
    </div>
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: i % 3 === 0 ? '#00E676' : i % 3 === 1 ? '#FFC107' : '#FF3B3B',
  size: Math.random() * 3 + 1.5,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 3,
}));

export default function Bilan() {
  const { dailyEntries, debts, objectives, automations, settings, cashBalance, maintenanceFund, parts } = useStore();
  const currency = settings.currency || 'Fr';
  const [period, setPeriod] = useState<Period>('month');

  // ✅ État des sections géré ici, jamais reseté
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const now = new Date();
  const filterEntries = () => {
    if (period === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return dailyEntries.filter(e => new Date(e.date) >= weekAgo);
    }
    if (period === 'month') return dailyEntries.filter(e => e.date.startsWith(now.toISOString().slice(0, 7)));
    return dailyEntries;
  };

  const entries = filterEntries();
  const normalDays = entries.filter(e => (e.dayType || 'normal') === 'normal');
  const maintenanceDays = entries.filter(e => e.dayType === 'maintenance');
  const inactiveDays = entries.filter(e => e.dayType === 'inactive');

  const totalRevenue = normalDays.reduce((s, e) => s + e.revenue, 0);
  const totalExpenses = entries.reduce((s, e) => s + e.expenses.reduce((a, b) => a + b.amount, 0), 0);
  const totalBreakdownCost = entries.reduce((s, e) => s + e.breakdowns.reduce((a, b) => a + b.amount, 0), 0);
  const totalNet = normalDays.reduce((s, e) => s + e.netRevenue, 0);
  const totalDebt = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0);
  const totalBreakdownCount = entries.reduce((s, e) => s + e.breakdowns.length, 0);

  const avgDailyRevenue = normalDays.length > 0 ? totalRevenue / normalDays.length : 0;
  const avgDailyExpenses = normalDays.length > 0 ? totalExpenses / normalDays.length : 0;
  const avgDailyNet = normalDays.length > 0 ? totalNet / normalDays.length : 0;
  const expenseRatio = pct(totalExpenses + totalBreakdownCost, totalRevenue);
  const profitMargin = pct(totalNet, totalRevenue);

  const expenseByCategory: Record<string, number> = {};
  entries.forEach(e => e.expenses.forEach(exp => { expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount; }));
  const topExpenses = Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a).slice(0, 6);

  const breakdownByCategory: Record<string, { count: number; total: number }> = {};
  entries.forEach(e => e.breakdowns.forEach(bd => {
    if (!breakdownByCategory[bd.category]) breakdownByCategory[bd.category] = { count: 0, total: 0 };
    breakdownByCategory[bd.category].count++;
    breakdownByCategory[bd.category].total += bd.amount;
  }));
  const topBreakdowns = Object.entries(breakdownByCategory).sort(([, a], [, b]) => b.total - a.total).slice(0, 4);

  const bestDay = normalDays.length > 0 ? normalDays.reduce((b, e) => e.netRevenue > b.netRevenue ? e : b) : null;
  const worstDay = normalDays.length > 0 ? normalDays.reduce((w, e) => e.netRevenue < w.netRevenue ? e : w) : null;

  // Score santé basé sur la caisse + autres indicateurs
  let healthScore = 50;
  // Caisse — critère principal
  if (cashBalance > 200000) healthScore += 20;
  else if (cashBalance > 50000) healthScore += 10;
  else if (cashBalance <= 0) healthScore -= 25;
  else if (cashBalance < 10000) healthScore -= 15;
  // Frais maintenance
  if (maintenanceFund > 100000) healthScore += 10;
  else if (maintenanceFund <= 0) healthScore -= 5;
  // Marge
  if (profitMargin >= 40) healthScore += 15; else if (profitMargin >= 20) healthScore += 8; else if (profitMargin < 0) healthScore -= 15;
  // Pannes
  if (totalBreakdownCount === 0) healthScore += 10; else if (totalBreakdownCount > 3) healthScore -= 10;
  // Dettes
  if (totalDebt === 0) healthScore += 10; else if (totalDebt > cashBalance) healthScore -= 10;
  // Jours inactifs
  if (inactiveDays.length === 0) healthScore += 5; else if (inactiveDays.length > 3) healthScore -= 10;
  // Pièces critiques
  const criticalParts = parts.filter(p => p.installedDate && p.knownDurationDays && (() => {
    const installed = new Date(p.installedDate);
    const today = new Date();
    const daysUsed = Math.floor((today.getTime() - installed.getTime()) / 86400000);
    return (daysUsed / p.knownDurationDays!) >= 0.9;
  })());
  if (criticalParts.length > 0) healthScore -= criticalParts.length * 5;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthColor = healthScore >= 70 ? '#00E676' : healthScore >= 40 ? '#FFC107' : '#FF3B3B';
  const healthLabel = healthScore >= 70 ? 'Excellente' : healthScore >= 40 ? 'Correcte' : 'Préoccupante';

  const recommendations: { type: 'positive' | 'warning' | 'danger' | 'info'; text: string }[] = [];
  if (profitMargin >= 40) recommendations.push({ type: 'positive', text: `Excellente marge bénéficiaire de ${profitMargin}% — Très bonne gestion des charges !` });
  else if (profitMargin >= 20) recommendations.push({ type: 'info', text: `Marge correcte (${profitMargin}%) — Cherchez à optimiser les charges.` });
  else if (profitMargin > 0) recommendations.push({ type: 'warning', text: `Marge faible (${profitMargin}%) — Analysez et réduisez vos principales dépenses.` });
  else if (totalRevenue > 0) recommendations.push({ type: 'danger', text: `Marge négative ! Vos charges dépassent vos recettes. Action urgente requise.` });
  if (inactiveDays.length > 2) recommendations.push({ type: 'warning', text: `${inactiveDays.length} jours sans activité — Vérifiez l'état du véhicule.` });
  if (maintenanceDays.length > 0) recommendations.push({ type: 'info', text: `${maintenanceDays.length} journée(s) de maintenance — Bon suivi de l'entretien.` });
  if (totalBreakdownCount > 3) recommendations.push({ type: 'danger', text: `${totalBreakdownCount} pannes — Envisagez un contrôle technique complet.` });
  if (totalBreakdownCount === 0 && entries.length > 0) recommendations.push({ type: 'positive', text: 'Aucune panne sur la période — Excellent état mécanique !' });
  if (totalDebt > totalNet * 0.5 && totalNet > 0) recommendations.push({ type: 'warning', text: `Vos dettes représentent plus de 50% de vos bénéfices nets.` });
  if (totalDebt === 0) recommendations.push({ type: 'positive', text: 'Aucune dette en cours — Excellente santé financière !' });
  if (automations.filter(a => a.isActive).length > 0) recommendations.push({ type: 'info', text: `${automations.filter(a => a.isActive).length} tâche(s) automatisée(s) active(s).` });
  const lateObjectives = objectives.filter(o => o.status === 'late');
  if (lateObjectives.length > 0) recommendations.push({ type: 'warning', text: `${lateObjectives.length} objectif(s) en retard — Réévaluez vos priorités.` });

  const workingDaysRatio = entries.length > 0 ? normalDays.length / entries.length : 0;
  const projectedMonthlyRevenue = avgDailyRevenue * 30 * workingDaysRatio;
  const projectedMonthlyNet = avgDailyNet * 30 * workingDaysRatio;
  const periodLabel = period === 'week' ? '7 derniers jours' : period === 'month' ? 'Ce mois-ci' : 'Toute la période';

  return (
    <div style={{ background: '#05070D', minHeight: '100vh' }} className="relative overflow-x-hidden">

      <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=60" alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.06, filter: 'blur(2px)' }} />

      <div className="absolute pointer-events-none" style={{ top: -80, left: '20%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: 0, right: '15%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }}
        animate={{ top: ['0%', '100%'] }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }} />

      {PARTICLES.map(p => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}` }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }} />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pb-24">

        {/* HERO */}
        <div className="mb-10 pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#8b5cf6', boxShadow: '0 0 10px rgba(139,92,246,0.7)' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#9AA4B2' }}>Rapport financier</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#F5F7FA' }}>Bilan & Analyse</h1>
              <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>{periodLabel} — {entries.length} journée{entries.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1 rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['week', 'month', 'all'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: period === p ? 'rgba(139,92,246,0.25)' : 'transparent',
                    color: period === p ? '#a78bfa' : '#9AA4B2',
                    border: period === p ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  }}>
                  {p === 'week' ? '7 jours' : p === 'month' ? 'Ce mois' : 'Tout'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg, #8b5cf6, #FFC107, #00E676)' }} />
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-24 rounded-3xl" style={{ background: 'rgba(11,15,26,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#9AA4B2' }} />
            <p className="text-base font-medium" style={{ color: '#9AA4B2' }}>Aucune donnée pour cette période</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Score santé — toujours visible */}
            <div className="rounded-3xl p-6" style={{ background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4" style={{ color: '#FFC107' }} />
                    <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>Score de santé globale</p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: '#9AA4B2' }}>Basé sur la marge, les pannes, les dettes et la régularité</p>
                  <div className="w-full rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-3 rounded-full" style={{ width: `${healthScore}%`, background: healthColor, transition: 'width 1.2s ease' }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs" style={{ color: '#555e6b' }}>0</span>
                    <span className="text-xs font-bold" style={{ color: healthColor }}>{healthScore}/100 — {healthLabel}</span>
                    <span className="text-xs" style={{ color: '#555e6b' }}>100</span>
                  </div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${healthColor}15`, border: `2px solid ${healthColor}40` }}>
                    <span className="text-2xl font-black" style={{ color: healthColor }}>{healthScore}</span>
                  </div>
                  <p className="text-xs mt-1 font-semibold" style={{ color: healthColor }}>{healthLabel}</p>
                </div>
              </div>
            </div>

            {/* Indicateurs clés */}
            <SectionCard title="Indicateurs clés" icon={Activity} iconColor="#00E676"
              isOpen={openSections.has('kpi')} onToggle={() => toggleSection('kpi')}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Recettes brutes', value: fmt(totalRevenue, currency), sub: `Moy/j: ${fmt(Math.round(avgDailyRevenue), currency)}`, color: '#00E676', icon: TrendingUp },
                  { label: 'Charges totales', value: fmt(totalExpenses + totalBreakdownCost, currency), sub: `${expenseRatio}% des recettes`, color: '#FFC107', icon: TrendingDown },
                  { label: 'Bénéfice net', value: fmt(totalNet, currency), sub: `Marge: ${profitMargin}%`, color: totalNet >= 0 ? '#60a5fa' : '#FF3B3B', icon: Activity },
                  { label: 'Caisse actuelle', value: fmt(cashBalance, currency), sub: `${entries.length} jour(s) saisis`, color: cashBalance >= 0 ? '#F5F7FA' : '#FF3B3B', icon: Calendar },
                ].map(k => (
                  <div key={k.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                      <p className="text-xs" style={{ color: '#9AA4B2' }}>{k.label}</p>
                    </div>
                    <p className="font-bold text-base" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs mt-1" style={{ color: '#555e6b' }}>{k.sub}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Évolution graphique */}
            <SectionCard title="Évolution graphique" icon={BarChart3} iconColor="#8b5cf6"
              isOpen={openSections.has('graph')} onToggle={() => toggleSection('graph')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium mb-4" style={{ color: '#9AA4B2' }}>Résultats journaliers (7 derniers jours)</p>
                  <DayBarsChart entries={entries.map(e => ({ date: e.date, netRevenue: e.netRevenue, revenue: e.revenue, dayType: e.dayType || 'normal' }))} currency={currency} />
                </div>
                <WeeklySummary entries={entries.map(e => ({ date: e.date, netRevenue: e.netRevenue, dayType: e.dayType || 'normal' }))} />
              </div>
            </SectionCard>

            {/* Indicateurs de performance */}
            <SectionCard title="Indicateurs de performance" icon={Target} iconColor="#FFC107"
              isOpen={openSections.has('perf')} onToggle={() => toggleSection('perf')}>
              <div className="flex flex-wrap gap-8 justify-around">
                <DonutStat value={totalNet} total={totalRevenue} color="#00E676" label="Marge bénéficiaire" />
                <DonutStat value={normalDays.length} total={entries.length} color="#60a5fa" label="Jours normaux" />
                <DonutStat value={totalExpenses} total={totalRevenue} color="#FFC107" label="Charges / Recettes" />
                <DonutStat value={Math.min(totalDebt, totalNet)} total={Math.max(totalNet, totalDebt)} color="#FF3B3B" label="Dettes / Bénéfices" />
                <DonutStat value={objectives.filter(o => o.status === 'completed').length} total={Math.max(objectives.length, 1)} color="#a78bfa" label="Objectifs réalisés" />
              </div>
            </SectionCard>

            {/* Charges & Pannes */}
            <SectionCard title="Répartition des charges & pannes" icon={TrendingDown} iconColor="#FFC107"
              isOpen={openSections.has('charges')} onToggle={() => toggleSection('charges')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium mb-4" style={{ color: '#9AA4B2' }}>Top dépenses</p>
                  {topExpenses.length === 0 ? (
                    <p className="text-sm" style={{ color: '#555e6b' }}>Aucune dépense enregistrée</p>
                  ) : (
                    <div className="space-y-4">
                      {topExpenses.map(([cat, amt], i) => (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{ background: i === 0 ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#FFC107' : '#9AA4B2' }}>{i + 1}</span>
                              <span style={{ color: '#F5F7FA' }}>{CAT_LABELS[cat] || cat}</span>
                            </div>
                            <span style={{ color: '#FFC107' }}>{fmt(amt, currency)} ({pct(amt, totalExpenses + totalBreakdownCost)}%)</span>
                          </div>
                          <MiniBar value={amt} max={topExpenses[0][1]} color="#FFC107" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium mb-4" style={{ color: '#9AA4B2' }}>Pannes & Réparations</p>
                  {topBreakdowns.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#00E676' }} />
                      <p className="text-sm font-semibold" style={{ color: '#00E676' }}>Aucune panne</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topBreakdowns.map(([cat, data]) => (
                        <div key={cat} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,59,59,0.05)', border: '1px solid rgba(255,59,59,0.08)' }}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium" style={{ color: '#F5F7FA' }}>{cat}</span>
                            <span className="text-sm font-bold" style={{ color: '#FF3B3B' }}>{fmt(data.total, currency)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MiniBar value={data.total} max={topBreakdowns[0][1].total} color="#FF3B3B" />
                            <span className="text-xs flex-shrink-0" style={{ color: '#555e6b' }}>{data.count}x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Meilleure & Pire journée */}
            {(bestDay || worstDay) && (
              <SectionCard title="Meilleure & Pire journée" icon={Calendar} iconColor="#60a5fa"
                isOpen={openSections.has('days')} onToggle={() => toggleSection('days')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bestDay && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.12)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="w-4 h-4" style={{ color: '#00E676' }} />
                        <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>🏆 Meilleure journée</p>
                      </div>
                      <p className="font-medium capitalize" style={{ color: '#F5F7FA' }}>{new Date(bestDay.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      <p className="font-black text-3xl mt-1" style={{ color: '#00E676' }}>{fmt(bestDay.netRevenue, currency)}</p>
                      <p className="text-xs mt-1" style={{ color: '#555e6b' }}>Brut: {fmt(bestDay.revenue, currency)}</p>
                    </div>
                  )}
                  {worstDay && worstDay.id !== bestDay?.id && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,59,59,0.05)', border: '1px solid rgba(255,59,59,0.12)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsDown className="w-4 h-4" style={{ color: '#FF3B3B' }} />
                        <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>📉 Jour le plus difficile</p>
                      </div>
                      <p className="font-medium capitalize" style={{ color: '#F5F7FA' }}>{new Date(worstDay.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      <p className="font-black text-3xl mt-1" style={{ color: worstDay.netRevenue >= 0 ? '#FFC107' : '#FF3B3B' }}>{fmt(worstDay.netRevenue, currency)}</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Répartition journées */}
            <SectionCard title="Répartition des journées" icon={Calendar} iconColor="#60a5fa"
              isOpen={openSections.has('repartition')} onToggle={() => toggleSection('repartition')}>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { icon: CheckCircle2, count: normalDays.length, label: 'Normales', color: '#00E676' },
                  { icon: Wrench, count: maintenanceDays.length, label: 'Maintenance', color: '#FFC107' },
                  { icon: BanIcon, count: inactiveDays.length, label: 'Sans activité', color: '#FF3B3B' },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: `${item.color}10`, border: `1px solid ${item.color}20` }}>
                    <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: item.color }} />
                    <p className="font-black text-2xl" style={{ color: item.color }}>{item.count}</p>
                    <p className="text-xs mt-1" style={{ color: '#9AA4B2' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: '#555e6b' }}>{pct(item.count, entries.length)}%</p>
                  </div>
                ))}
              </div>
              <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
                {normalDays.length > 0 && <div className="rounded-l-full" style={{ width: `${pct(normalDays.length, entries.length)}%`, background: '#00E676' }} />}
                {maintenanceDays.length > 0 && <div style={{ width: `${pct(maintenanceDays.length, entries.length)}%`, background: '#FFC107' }} />}
                {inactiveDays.length > 0 && <div className="rounded-r-full" style={{ width: `${pct(inactiveDays.length, entries.length)}%`, background: '#FF3B3B' }} />}
              </div>
            </SectionCard>

            {/* Moyennes & Projections */}
            <SectionCard title="Moyennes & Projections" icon={Zap} iconColor="#60a5fa"
              isOpen={openSections.has('proj')} onToggle={() => toggleSection('proj')}>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Recette brute / jour', value: fmt(Math.round(avgDailyRevenue), currency), color: '#00E676' },
                  { label: 'Charges / jour', value: fmt(Math.round(avgDailyExpenses), currency), color: '#FFC107' },
                  { label: 'Net / jour', value: fmt(Math.round(avgDailyNet), currency), color: avgDailyNet >= 0 ? '#60a5fa' : '#FF3B3B' },
                ].map(m => (
                  <div key={m.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>{m.label}</p>
                    <p className="font-bold text-base" style={{ color: m.color }}>{m.value}</p>
                  </div>
                ))}
              </div>
              {projectedMonthlyRevenue > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#a78bfa' }}>📈 Projection mensuelle</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: '#9AA4B2' }}>Recettes projetées</p>
                      <p className="font-bold" style={{ color: '#00E676' }}>{fmt(Math.round(projectedMonthlyRevenue), currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#9AA4B2' }}>Bénéfice projeté</p>
                      <p className="font-bold" style={{ color: projectedMonthlyNet >= 0 ? '#60a5fa' : '#FF3B3B' }}>{fmt(Math.round(projectedMonthlyNet), currency)}</p>
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#555e6b' }}>* Basé sur {Math.round(workingDaysRatio * 100)}% de jours actifs</p>
                </div>
              )}
            </SectionCard>

            {/* Recommandations */}
            <SectionCard title="Analyse & Recommandations" icon={Lightbulb} iconColor="#FFC107"
              isOpen={openSections.has('reco')} onToggle={() => toggleSection('reco')}>
              {recommendations.length === 0 ? (
                <div className="text-center py-6" style={{ color: '#555e6b' }}>
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Enregistrez plus d'activités pour obtenir des recommandations</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {recommendations.filter(r => r.type === 'positive').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="w-3 h-3" style={{ color: '#00E676' }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00E676' }}>Points positifs</p>
                      </div>
                      <div className="space-y-2">
                        {recommendations.filter(r => r.type === 'positive').map((r, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.1)' }}>
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#00E676' }} />
                            <p className="text-sm" style={{ color: '#F5F7FA' }}>{r.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.filter(r => r.type === 'danger' || r.type === 'warning').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3 h-3" style={{ color: '#FF3B3B' }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FF3B3B' }}>Points d'attention</p>
                      </div>
                      <div className="space-y-2">
                        {recommendations.filter(r => r.type === 'danger' || r.type === 'warning').map((r, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-2xl px-4 py-3"
                            style={{ background: r.type === 'danger' ? 'rgba(255,59,59,0.06)' : 'rgba(255,193,7,0.05)', border: `1px solid ${r.type === 'danger' ? 'rgba(255,59,59,0.12)' : 'rgba(255,193,7,0.1)'}` }}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: r.type === 'danger' ? '#FF3B3B' : '#FFC107' }} />
                            <p className="text-sm" style={{ color: '#F5F7FA' }}>{r.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.filter(r => r.type === 'info').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-3 h-3" style={{ color: '#60a5fa' }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>Informations</p>
                      </div>
                      <div className="space-y-2">
                        {recommendations.filter(r => r.type === 'info').map((r, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)' }}>
                            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
                            <p className="text-sm" style={{ color: '#F5F7FA' }}>{r.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  );
}
