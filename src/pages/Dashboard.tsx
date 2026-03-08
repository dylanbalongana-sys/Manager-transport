import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Wallet, Zap, CreditCard, Target,
  ArrowUpRight, ArrowDownRight,
  Bus, PiggyBank, Wrench,
  CheckCircle2, Clock, AlertTriangle,
  ChevronRight, ClipboardCheck
} from 'lucide-react';
import { useStore } from '../store/useStore';

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(n: number, currency = 'FC') {
  return `${Math.round(n).toLocaleString('fr-FR')} ${currency}`;
}

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ✅ petit helper : si un KPI a été “corrigé” dans Settings, on prend la valeur corrigée */
function getOverrideNumber(v: any): number | null {
  if (typeof v !== 'number') return null;
  if (Number.isNaN(v)) return null;
  return v;
}

/* ─── Background ───────────────────────────────────────────── */
function BackgroundScene() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #040810 0%, #070d1a 40%, #05090f 100%)' }} />
      <motion.div className="absolute rounded-full"
        style={{ width: 800, height: 800, top: -300, left: -200,
          background: 'radial-gradient(circle, rgba(26,107,60,0.14) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width: 700, height: 700, top: '15%', right: -250,
          background: 'radial-gradient(circle, rgba(212,160,23,0.1) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width: 600, height: 600, bottom: -150, left: '25%',
          background: 'radial-gradient(circle, rgba(139,26,26,0.09) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `linear-gradient(rgba(251,191,36,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.6) 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
      }} />
      <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.12) 30%, rgba(34,197,94,0.12) 70%, transparent 100%)' }}
        animate={{ y: ['-5vh', '105vh'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
      />
    </div>
  );
}

/* ─── HERO CINÉMATIQUE ─────────────────────────────────────── */
function HeroCinematic({ settings }: { settings: any }) {
  const plate = settings.vehiclePlate || 'BZV-1234-A';
  const vehicleName = settings.vehicleName || 'Hiace Congo';

  return (
    <motion.div
      className="relative rounded-3xl"
      style={{
        height: 340,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 60px rgba(16,185,129,0.12), 0 0 120px rgba(212,160,23,0.06)',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1800&q=90&auto=format&fit=crop')`,
        filter: 'brightness(0.32) saturate(1.2)',
        transform: 'scale(1.05)',
      }} />

      <div className="absolute inset-0" style={{
        background: 'linear-gradient(125deg, rgba(26,107,60,0.5) 0%, rgba(7,12,26,0.55) 45%, rgba(120,20,20,0.22) 100%)',
      }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(4,8,16,0.98) 0%, rgba(4,8,16,0.45) 45%, transparent 100%)',
      }} />

      <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl" style={{
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.25)',
          backdropFilter: 'blur(12px)',
        }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-green-300 text-xs font-semibold whitespace-nowrap">Système actif</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl" style={{
          background: 'rgba(212,160,23,0.12)',
          border: '1px solid rgba(212,160,23,0.28)',
          backdropFilter: 'blur(12px)',
        }}>
          <Bus className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-yellow-300 text-xs font-bold leading-tight">{vehicleName}</span>
            <span className="text-yellow-500/70 text-[10px] leading-tight">{plate}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-10 pb-10 pt-4">
        <motion.div className="flex gap-1 mb-4"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
          <div className="h-[3px] w-12 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.7)' }} />
          <div className="h-[3px] w-6 rounded-full" style={{ background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.7)' }} />
          <div className="h-[3px] w-12 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.7)' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}>
          <p className="text-slate-400 text-sm font-medium mb-2 capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <h1 className="font-black text-3xl md:text-4xl text-white mb-2 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Pilotez votre flotte{' '}
            <span style={{
              background: 'linear-gradient(90deg, #fbbf24 0%, #22c55e 60%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>avec précision</span>
          </h1>

          <p className="text-slate-400 text-sm mb-5 max-w-md leading-relaxed">
            Suivi des recettes, dettes et performances en temps réel
          </p>

          <motion.button
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-black"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #d4a017)',
              boxShadow: '0 0 24px rgba(251,191,36,0.35)',
            }}
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(251,191,36,0.55)' }}
            whileTap={{ scale: 0.97 }}
          >
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span>Voir les performances</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────── */
function KpiCardPro({
  label, rawValue, icon: Icon, accentColor, glowColor, sub, trend, delay = 0, currency
}: {
  label: string; rawValue: number; icon: any; accentColor: string; glowColor: string;
  sub: string; trend: 'up' | 'down' | 'neutral'; delay?: number; currency: string;
}) {
  const animated = useCountUp(rawValue);

  const trendConfig = {
    up:      { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   text: '#4ade80', label: 'Positif',  icon: ArrowUpRight },
    down:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#f87171', label: 'Négatif',  icon: ArrowDownRight },
    neutral: { bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.2)', text: '#94a3b8', label: 'Stable',   icon: null },
  };
  const tc = trendConfig[trend];

  return (
    <motion.div
      className="relative group rounded-3xl cursor-pointer"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${glowColor}40, transparent, ${glowColor}20)`, filter: 'blur(6px)' }} />

      <div className="relative rounded-3xl px-6 pt-6 pb-6" style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.07)`,
        backdropFilter: 'blur(24px)',
      }}>
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-15 group-hover:opacity-28 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accentColor}, transparent)`,
            transform: 'translate(30%, -30%)',
          }} />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
            <Icon className="relative w-5 h-5 z-10" style={{ color: accentColor }} />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex-shrink-0"
            style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
            {tc.icon && <tc.icon className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{tc.label}</span>
          </div>
        </div>

        <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mb-2 relative z-10 leading-relaxed">
          {label}
        </p>

        <div className="flex items-end gap-1.5 mb-2.5 relative z-10">
          <motion.p className="font-black text-white leading-none tabular-nums" style={{ fontSize: '1.55rem', letterSpacing: '-0.02em' }}>
            {Math.round(animated).toLocaleString('fr-FR')}
          </motion.p>
          <span className="text-xs font-bold mb-0.5" style={{ color: accentColor }}>{currency}</span>
        </div>

        <p className="text-slate-500 text-xs relative z-10 leading-relaxed">{sub}</p>

        <div className="absolute bottom-0 left-3 right-3 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }} />
      </div>
    </motion.div>
  );
}

/* ─── NET GLOBAL DOMINANT ──────────────────────────────────── */
function NetGlobalDominant({
  totalExpenses, totalBreakdowns, totalDebt, cashBalance, currency
}: {
  totalExpenses: number; totalBreakdowns: number;
  totalDebt: number; cashBalance: number; currency: string;
}) {
  const [showDebt, setShowDebt] = useState(false);
  const displayed = showDebt ? cashBalance - totalDebt : cashBalance;
  const animatedDisplayed = useCountUp(Math.abs(displayed));
  const isPositive = displayed >= 0;

  return (
    <motion.div className="relative rounded-3xl overflow-hidden"
      initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="absolute -inset-0.5 rounded-3xl opacity-40" style={{
        background: `linear-gradient(135deg, ${isPositive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}, rgba(212,160,23,0.2), transparent)`,
        filter: 'blur(10px)',
      }} />

      <div className="relative rounded-3xl p-7 md:p-8" style={{
        background: 'linear-gradient(135deg, rgba(10,15,28,0.9) 0%, rgba(6,10,20,0.95) 100%)',
        border: `1px solid ${isPositive ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
        backdropFilter: 'blur(30px)',
      }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #22c55e, #fbbf24, #ef4444)' }} />
                <h3 className="text-white font-black text-xl" style={{ letterSpacing: '-0.02em' }}>Résultat Net Global</h3>
              </div>
              <p className="text-slate-500 text-sm ml-3">
                {showDebt ? 'Après déduction totale des dettes' : 'Hors déduction des dettes'}
              </p>
            </div>

            <div className="relative flex items-center p-1 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minWidth: 240,
            }}>
              <motion.div
                className="absolute top-1 bottom-1 rounded-xl"
                style={{ background: showDebt ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.12))' : 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.12))' }}
                animate={{ left: showDebt ? '50%' : '4px', right: showDebt ? '4px' : '50%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
              <button onClick={() => setShowDebt(false)}
                className={`relative z-10 flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${!showDebt ? 'text-green-300' : 'text-slate-500'}`}>
                Sans dettes
              </button>
              <button onClick={() => setShowDebt(true)}
                className={`relative z-10 flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 ${showDebt ? 'text-red-300' : 'text-slate-500'}`}>
                Avec dettes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
            {[
              { label: 'Pannes & Réparations', value: totalBreakdowns, color: '#f97316', icon: TrendingUp },
              { label: 'Charges Totales', value: totalExpenses, color: '#fbbf24', icon: ArrowDownRight },
              { label: 'Dettes Impayées', value: totalDebt, color: '#ef4444', icon: CreditCard },
            ].map(item => (
              <div key={item.label} className="rounded-2xl p-4" style={{
                background: `${item.color}08`,
                border: `1px solid ${item.color}18`,
              }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">{item.label}</p>
                </div>
                <p className="font-black text-xl tabular-nums leading-none" style={{ color: item.color, letterSpacing: '-0.02em' }}>
                  {item.value.toLocaleString('fr-FR')}
                </p>
                <p className="text-slate-700 text-[10px] mt-0.5">{currency}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={showDebt ? 'debt' : 'nodebt'}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-5 md:p-6 flex items-center justify-between gap-4"
              style={{
                background: isPositive ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))' : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))',
                border: `1px solid ${isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                boxShadow: `0 0 40px ${isPositive ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)'}`,
              }}
            >
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-semibold">
                  Net {showDebt ? '(déductions incluses)' : 'comptable'}
                </p>
                <div className="flex items-end gap-2 flex-wrap">
                  <span className="font-black text-4xl tabular-nums" style={{ color: isPositive ? '#22c55e' : '#ef4444', letterSpacing: '-0.03em' }}>
                    {isPositive ? '+' : '-'}{Math.round(animatedDisplayed).toLocaleString('fr-FR')}
                  </span>
                  <span className="text-base font-bold mb-1" style={{ color: isPositive ? '#22c55e99' : '#ef444499' }}>{currency}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  {isPositive
                    ? <ArrowUpRight className="w-7 h-7 text-green-400" />
                    : <ArrowDownRight className="w-7 h-7 text-red-400" />}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isPositive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {isPositive ? '▲ Bénéfice' : '▼ Déficit'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Carte secondaire wrapper ─────────────────────────────── */
function SecondaryCard({ title, icon: Icon, accentColor, children, delay = 0 }: {
  title: string; icon: any; accentColor: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      className="relative rounded-3xl group"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at top left, ${accentColor}30, transparent 60%)`, filter: 'blur(8px)' }} />
      <div className="relative rounded-3xl p-6" style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.2)`,
        minHeight: 280,
      }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28` }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <h3 className="text-white font-bold text-base" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Automations ──────────────────────────────────────────── */
function AutomationsMini({ automations }: { automations: any[] }) {
  const active = automations.filter(a => a.isActive).length;
  return (
    <SecondaryCard title="Automatisations" icon={Zap} accentColor="#60a5fa" delay={0.25}>
      <div className="flex items-center gap-1.5 mb-4 px-2.5 py-1.5 rounded-xl w-fit"
        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-300 text-xs font-semibold">{active} / {automations.length} actives</span>
      </div>
      <div className="space-y-3">
        {automations.map((auto, i) => (
          <motion.div key={auto.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
            className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/5"
            style={{ background: auto.isActive ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${auto.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: auto.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)' }}>
                <Zap className={`w-3.5 h-3.5 ${auto.isActive ? 'text-green-400' : 'text-slate-600'}`} />
              </div>
              <p className={`text-sm font-medium truncate max-w-[120px] ${auto.isActive ? 'text-slate-200' : 'text-slate-600'}`}>{auto.name || auto.label}</p>
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 flex-shrink-0 ${auto.isActive ? 'bg-green-500' : 'bg-slate-800'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${auto.isActive ? 'left-4' : 'left-0.5'}`} />
            </div>
          </motion.div>
        ))}
        {automations.length === 0 && (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">Aucune automatisation</p>
          </div>
        )}
      </div>
    </SecondaryCard>
  );
}

/* ─── Objectifs ────────────────────────────────────────────── */
function ObjectivesMini({ objectives, currency }: { objectives: any[]; currency: string }) {
  const statusConfig = {
    pending:   { color: '#fbbf24', label: 'En cours', icon: Clock },
    completed: { color: '#22c55e', label: 'Terminé',  icon: CheckCircle2 },
    late:      { color: '#ef4444', label: 'En retard', icon: AlertTriangle },
  };
  return (
    <SecondaryCard title="Objectifs" icon={Target} accentColor="#fbbf24" delay={0.3}>
      <div className="space-y-3.5">
        {objectives.map((obj, i) => {
          const cfg = statusConfig[obj.status as keyof typeof statusConfig] || statusConfig.pending;
          const diff = obj.targetDate ? Math.ceil((new Date(obj.targetDate).getTime() - Date.now()) / 86400000) : 0;
          return (
            <motion.div key={obj.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
              className="p-3.5 rounded-2xl" style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}18` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <cfg.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <p className="text-white text-sm font-semibold truncate">{obj.title}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ml-2"
                  style={{ background: `${cfg.color}20`, color: cfg.color }}>{cfg.label}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                {obj.amount && <span className="font-medium" style={{ color: cfg.color }}>{obj.amount.toLocaleString('fr-FR')} {currency}</span>}
                <span>{diff < 0 ? `${Math.abs(diff)}j retard` : `Dans ${diff}j`}</span>
              </div>
            </motion.div>
          );
        })}
        {objectives.length === 0 && (
          <div className="text-center py-10">
            <Target className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">Aucun objectif</p>
          </div>
        )}
      </div>
    </SecondaryCard>
  );
}

/* ─── MAIN DASHBOARD ───────────────────────────────────────── */
export default function Dashboard() {
  const {
    dailyEntries,
    debts,
    automations,
    objectives,
    cashBalance,
    maintenanceFund = 0,
    settings,
    lastAccountingDate,
    closeAccounting
  } = useStore();

  const [showAccountingModal, setShowAccountingModal] = useState(false);

  const currency = settings.currency || 'FC';

  // ✅ Date "référence" = dernière journée enregistrée (sinon aujourd'hui réel)
  const systemToday = new Date().toISOString().split('T')[0];
  const lastRecordedDate = dailyEntries.length
    ? dailyEntries.reduce((max, e) => (e.date && e.date > max ? e.date : max), systemToday)
    : systemToday;

  // ✅ Recette du "jour" = recette de lastRecordedDate (normal uniquement)
  const todayNormalEntries = dailyEntries.filter(
    e => e.date === lastRecordedDate && (e.dayType || 'normal') === 'normal'
  );
  const todayRevenueBrutRaw = todayNormalEntries.reduce((s, e) => s + (e.revenue || 0), 0);
  const todayNet = todayNormalEntries.reduce((s, e) => s + (e.netRevenue || 0), 0);

  // Filtrer les entrées depuis le dernier arrêté comptable
  const filteredEntries = lastAccountingDate
    ? dailyEntries.filter(e => e.date > lastAccountingDate)
    : dailyEntries;

  const filteredDebts = lastAccountingDate
    ? debts.filter(d => !d.dateCreated || d.dateCreated > lastAccountingDate)
    : debts;

  const totalExpensesRaw   = filteredEntries.reduce((s, e) => s + e.expenses.reduce((a, b) => a + b.amount, 0), 0);
  const totalBreakdownsRaw = filteredEntries.reduce((s, e) => s + e.breakdowns.reduce((a, b) => a + b.amount, 0), 0);
  const totalDebtRaw = filteredDebts.filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0);

  // Recette du mois = cumul brut depuis le dernier arrêté
  const thisMonth        = new Date().toISOString().slice(0, 7);
  const monthEntries     = filteredEntries.filter(e => e.date.startsWith(thisMonth));
  const monthRevenueBrutRaw = monthEntries.reduce((s, e) => s + e.revenue, 0);
  const monthNet         = monthEntries.reduce((s, e) => s + e.netRevenue, 0);

  const lateObjectives = objectives.filter(o => o.status === 'late');

  const maxMaintenanceFund = settings.maxMaintenanceFund || 150000;
  const maintenancePct = maxMaintenanceFund > 0 ? Math.round((maintenanceFund / maxMaintenanceFund) * 100) : 0;

  /* ✅ ICI : on applique les corrections KPI si elles existent */
  const ov = settings.dashboardOverrides || {};
  const todayRevenueBrut = getOverrideNumber(ov.todayRevenueBrut) ?? todayRevenueBrutRaw;
  const monthRevenueBrut = getOverrideNumber(ov.monthRevenueBrut) ?? monthRevenueBrutRaw;
  const totalDebt = getOverrideNumber(ov.totalDebt) ?? totalDebtRaw;
  const totalExpenses = getOverrideNumber(ov.totalExpenses) ?? totalExpensesRaw;
  const totalBreakdowns = getOverrideNumber(ov.totalBreakdowns) ?? totalBreakdownsRaw;

  const kpiCards = [
    {
      label: 'Caisse Actuelle',
      rawValue: cashBalance,
      icon: PiggyBank,
      accentColor: '#22c55e',
      glowColor: '#22c55e',
      sub: 'Cumul nets journaliers',
      trend: cashBalance >= 0 ? 'up' : 'down' as any,
      delay: 0,
    },
    {
      label: 'Recette du Jour',
      rawValue: todayRevenueBrut,
      icon: TrendingUp,
      accentColor: '#60a5fa',
      glowColor: '#60a5fa',
      sub: todayNormalEntries.length > 0
        ? `Date: ${new Date(lastRecordedDate).toLocaleDateString('fr-FR')} • Net: ${fmt(todayNet, currency)}`
        : `Date: ${new Date(lastRecordedDate).toLocaleDateString('fr-FR')} • Aucune activité`,
      trend: todayRevenueBrut >= 0 ? 'up' : 'down' as any,
      delay: 0.07,
    },
    {
      label: 'Recette du Mois',
      rawValue: monthRevenueBrut,
      icon: Wallet,
      accentColor: '#a78bfa',
      glowColor: '#a78bfa',
      sub: `Net mois: ${fmt(monthNet, currency)}`,
      trend: monthNet >= 0 ? 'up' : 'down' as any,
      delay: 0.14,
    },
    {
      label: 'Total Dettes',
      rawValue: totalDebt,
      icon: CreditCard,
      accentColor: '#ef4444',
      glowColor: '#ef4444',
      sub: `${debts.filter(d => d.status !== 'paid').length} dette(s) active(s)`,
      trend: 'down' as any,
      delay: 0.21,
    },
    {
      label: 'Frais de Maintenance',
      rawValue: maintenanceFund,
      icon: Wrench,
      accentColor: '#f97316',
      glowColor: '#f97316',
      sub: `${maintenancePct}% — Max: ${fmt(maxMaintenanceFund, currency)}`,
      trend: maintenanceFund > 0 ? 'up' : 'neutral' as any,
      delay: 0.28,
    },
  ];

  return (
    <div className="min-h-screen relative">
      <BackgroundScene />

      <div className="relative z-10 pt-0 pb-16 px-4 md:px-8 max-w-7xl mx-auto space-y-10">

        <AnimatePresence>
          {lateObjectives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
              <p className="text-red-300 text-sm">
                <span className="font-bold">{lateObjectives.length} objectif(s) en retard :</span>{' '}
                {lateObjectives.map(o => o.title).join(', ')}
              </p>
              <ChevronRight className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button
            onClick={() => setShowAccountingModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
          >
            <ClipboardCheck className="w-4 h-4" />
            Arrêté Comptable
            {lastAccountingDate && (
              <span className="text-xs opacity-60 ml-1">— dernier: {new Date(lastAccountingDate).toLocaleDateString('fr-FR')}</span>
            )}
          </button>
        </div>

        {showAccountingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md rounded-3xl p-8"
              style={{ background: 'rgba(10,15,28,0.98)', border: '1px solid rgba(251,191,36,0.25)' }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)' }}>
                  <ClipboardCheck className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Arrêté Comptable</h3>
                  <p className="text-slate-500 text-sm">Clôture de la période en cours</p>
                </div>
              </div>

              <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <p className="text-yellow-300 text-sm font-semibold mb-3">KPI remis à 0 sur le Dashboard :</p>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {['Recette du mois', 'Total dettes (Dashboard)', 'Pannes & Réparations', 'Charges totales'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-slate-600 text-xs mt-3">⚠️ Les données restent dans leurs pages dédiées. La caisse est inchangée.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { closeAccounting(); setShowAccountingModal(false); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-black"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #d4a017)' }}
                >
                  Confirmer l'arrêté
                </button>
                <button
                  onClick={() => setShowAccountingModal(false)}
                  className="px-5 py-3 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <HeroCinematic settings={settings} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map(card => (
            <KpiCardPro key={card.label} {...card} currency={currency} />
          ))}
        </div>

        <NetGlobalDominant
          totalExpenses={totalExpenses}
          totalBreakdowns={totalBreakdowns}
          totalDebt={totalDebt}
          cashBalance={cashBalance}
          currency={currency}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AutomationsMini automations={automations} />
          <ObjectivesMini objectives={objectives} currency={currency} />
        </div>

        <motion.footer
          className="pt-8 flex items-center justify-between flex-wrap gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a6b3c, #22c55e)' }}>
              <Bus className="w-4 h-4 text-white" />
            </div>
            <p className="text-slate-600 text-xs">Hiace Congo – Smart Mobility Brazzaville</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 rounded-full" style={{ background: '#1a6b3c' }} />
            <div className="w-2.5 h-1.5 rounded-full" style={{ background: '#d4a017' }} />
            <div className="w-5 h-1.5 rounded-full" style={{ background: '#8b1a1a' }} />
            <span className="text-slate-700 text-[10px] ml-1">🇨🇬 Congo-Brazzaville</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}