import { useState } from 'react';
import { Wrench, Droplets, ShieldCheck, Users, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

const EXPENSE_LABELS: Record<string, string> = {
  carburant: 'Carburant', huile_moteur: 'Huile moteur', huile_boite: 'Huile de boîte',
  huile_frein: 'Huile de frein', huile_direction: 'Huile de direction', huile_differentiel: 'Huile différentiel',
  salaire_chauffeur: 'Salaire chauffeur', salaire_controleur: 'Salaire contrôleur',
  salaire_collaborateur: 'Salaire collaborateur', police_jc: 'Police (JC)',
  assurance: 'Assurance', patente: 'Patente', lavage: 'Lavage', parking: 'Parking', autre: 'Autre',
};

const CATEGORY_GROUPS = [
  { label: 'Carburants & Lubrifiants', icon: Droplets, color: '#60a5fa', glow: 'rgba(96,165,250,0.15)', keys: ['carburant', 'huile_moteur', 'huile_boite', 'huile_frein', 'huile_direction', 'huile_differentiel'] },
  { label: 'Charges réglementaires', icon: ShieldCheck, color: '#00E676', glow: 'rgba(0,230,118,0.15)', keys: ['assurance', 'patente', 'police_jc'] },
  { label: 'Salaires', icon: Users, color: '#a78bfa', glow: 'rgba(167,139,250,0.15)', keys: ['salaire_chauffeur', 'salaire_controleur', 'salaire_collaborateur'] },
  { label: 'Autres charges', icon: TrendingDown, color: '#9AA4B2', glow: 'rgba(154,164,178,0.1)', keys: ['lavage', 'parking', 'autre'] },
];

export default function Charges() {
  const { dailyEntries, settings } = useStore();
  const currency = settings.currency || 'Fr';

  const allExpenses = dailyEntries.flatMap(e => e.expenses);
  const allBreakdowns = dailyEntries.flatMap(e => e.breakdowns);

  const totalByCategory = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBreakdowns = allBreakdowns.reduce((s, b) => s + b.amount, 0);
  const grandTotal = totalExpenses + totalBreakdowns;

  const breakdownsByCategory = allBreakdowns.reduce<Record<string, { count: number; total: number }>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = { count: 0, total: 0 };
    acc[b.category].count++;
    acc[b.category].total += b.amount;
    return acc;
  }, {});

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openPannes, setOpenPannes] = useState(false);

  const toggle = (label: string) => setOpenGroup(prev => prev === label ? null : label);

  return (
    <div style={{ background: '#05070D', minHeight: '100vh' }} className="relative overflow-x-hidden">

      {/* Image de fond — mécanique / moteur */}
      <img
        src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=60"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.07, filter: 'blur(2px)' }}
      />

      {/* Halos */}
      <div className="absolute pointer-events-none" style={{ top: -100, left: '30%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 70%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: 0, right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,59,59,0.05) 0%, transparent 70%)' }} />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pb-24">

        {/* HERO */}
        <div className="mb-10 pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#FFC107', boxShadow: '0 0 10px rgba(255,193,7,0.6)' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#9AA4B2' }}>Analyse financière</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#F5F7FA' }}>
                Frais & Charges
              </h1>
              <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                {dailyEntries.length} journée{dailyEntries.length > 1 ? 's' : ''} analysée{dailyEntries.length > 1 ? 's' : ''}
              </p>
            </div>
            {/* Total global */}
            <div className="px-5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Total déductions</p>
              <p className="text-xl font-extrabold" style={{ color: '#FF3B3B' }}>{fmt(grandTotal, currency)}</p>
            </div>
          </div>
          <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg, #FFC107, #FF3B3B, #00E676)' }} />
        </div>

        {/* 3 KPI compacts */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Charges opérationnelles', value: totalExpenses, color: '#FFC107' },
            { label: 'Pannes & réparations', value: totalBreakdowns, color: '#FF3B3B' },
            { label: 'Déductions totales', value: grandTotal, color: '#F5F7FA' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs mb-2" style={{ color: '#9AA4B2' }}>{k.label}</p>
              <p className="text-lg font-bold" style={{ color: k.color }}>{fmt(k.value, currency)}</p>
            </div>
          ))}
        </div>

        {/* Vide state */}
        {allExpenses.length === 0 && allBreakdowns.length === 0 ? (
          <div className="text-center py-24" style={{ color: '#555e6b' }}>
            <Wrench className="w-10 h-10 mx-auto mb-4 opacity-40" />
            <p className="text-base font-medium">Aucune charge enregistrée</p>
            <p className="text-sm mt-1 opacity-60">Commencez par enregistrer des activités journalières</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Groupes de charges — accordéons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORY_GROUPS.map(({ label, icon: Icon, color, glow, keys }) => {
                const groupTotal = keys.reduce((s, k) => s + (totalByCategory[k] || 0), 0);
                const isOpen = openGroup === label;
                const pct = grandTotal > 0 ? Math.round((groupTotal / grandTotal) * 100) : 0;

                return (
                  <div key={label} className="rounded-3xl overflow-hidden" style={{ background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* En-tête accordion */}
                    <button onClick={() => toggle(label)} className="w-full flex items-center justify-between p-5 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: glow }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>{label}</p>
                          <p className="text-xs" style={{ color }}>{pct}% du total</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold" style={{ color }}>{fmt(groupTotal, currency)}</p>
                        {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#9AA4B2' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#9AA4B2' }} />}
                      </div>
                    </button>

                    {/* Barre de progression */}
                    <div className="px-5 pb-2">
                      <div className="h-1 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          className="h-1 rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Contenu accordion */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-3 space-y-2">
                            <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            {keys.map(key => {
                              const amt = totalByCategory[key] || 0;
                              const entries = allExpenses.filter(e => e.category === key);
                              const liters = entries.reduce((s, e) => s + (e.liters || 0), 0);
                              return (
                                <div key={key} className="flex items-center justify-between py-2">
                                  <div>
                                    <p className="text-sm" style={{ color: amt > 0 ? '#F5F7FA' : '#555e6b' }}>{EXPENSE_LABELS[key]}</p>
                                    <p className="text-xs" style={{ color: '#555e6b' }}>
                                      {entries.length} entrée{entries.length > 1 ? 's' : ''}
                                      {liters > 0 && ` · ${liters}L`}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold" style={{ color: amt > 0 ? color : '#555e6b' }}>
                                    {fmt(amt, currency)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Pannes — pleine largeur */}
            {Object.keys(breakdownsByCategory).length > 0 && (
              <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,59,59,0.12)', boxShadow: '0 0 40px rgba(255,59,59,0.05)' }}>
                <button onClick={() => setOpenPannes(p => !p)} className="w-full flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,59,59,0.12)' }}>
                      <Wrench className="w-4 h-4" style={{ color: '#FF3B3B' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>Pannes par catégorie</p>
                      <p className="text-xs" style={{ color: '#FF3B3B' }}>{Object.keys(breakdownsByCategory).length} catégorie{Object.keys(breakdownsByCategory).length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold" style={{ color: '#FF3B3B' }}>{fmt(totalBreakdowns, currency)}</p>
                    {openPannes ? <ChevronUp className="w-4 h-4" style={{ color: '#9AA4B2' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9AA4B2' }} />}
                  </div>
                </button>

                <AnimatePresence>
                  {openPannes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-5 pb-5">
                        {Object.entries(breakdownsByCategory).map(([cat, { count, total }]) => (
                          <div key={cat} className="rounded-2xl px-4 py-4" style={{ background: 'rgba(255,59,59,0.05)', border: '1px solid rgba(255,59,59,0.08)' }}>
                            <p className="text-sm font-semibold mb-1" style={{ color: '#F5F7FA' }}>{cat}</p>
                            <p className="text-xs mb-3" style={{ color: '#9AA4B2' }}>{count} panne{count > 1 ? 's' : ''}</p>
                            <p className="text-base font-bold" style={{ color: '#FF3B3B' }}>{fmt(total, currency)}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
