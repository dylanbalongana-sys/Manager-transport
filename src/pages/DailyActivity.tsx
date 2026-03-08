// DailyActivity.tsx (NOUVEAU fichier complet + MINI HISTORIQUE réintégré)
import { useState, useEffect } from 'react';
import type { ElementType } from 'react';
import { Plus, Trash2, Save, ChevronDown, CheckCircle2, Wrench, BanIcon, Zap, TrendingUp } from 'lucide-react';
import { useStore, uid } from '../store/useStore';
import type { ExpenseItem, BreakdownItem, DailyEntry, DayType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const EXPENSE_CATEGORIES = [
  { label: 'Carburant', value: 'carburant', hasLiters: true },
  { label: 'Huile moteur', value: 'huile_moteur', hasLiters: true },
  { label: 'Huile de boîte', value: 'huile_boite', hasLiters: true },
  { label: 'Huile de frein', value: 'huile_frein', hasLiters: true },
  { label: 'Huile de direction', value: 'huile_direction', hasLiters: true },
  { label: 'Huile différentiel', value: 'huile_differentiel', hasLiters: true },
  { label: 'Salaire chauffeur', value: 'salaire_chauffeur' },
  { label: 'Salaire contrôleur', value: 'salaire_controleur' },
  { label: 'Salaire collaborateur', value: 'salaire_collaborateur' },
  { label: 'Police (JC)', value: 'police_jc' },
  { label: 'Assurance', value: 'assurance' },
  { label: 'Patente', value: 'patente' },
  { label: 'Lavage', value: 'lavage' },
  { label: 'Parking', value: 'parking' },
  { label: 'Autre', value: 'autre' },
];

const BREAKDOWN_CATEGORIES = [
  'Moteur', 'Freins', 'Transmission', 'Suspension', 'Direction',
  'Électrique', 'Refroidissement', 'Pneus / Roues', 'Carrosserie', 'Climatisation', 'Autre',
];

function fmt(n: number, currency = 'Fr') {
  return `${Math.round(n).toLocaleString('fr-FR')} ${currency}`;
}

const DAY_TYPES: { value: DayType; label: string; icon: ElementType; color: string; glow: string }[] = [
  { value: 'normal', label: 'Normale', icon: CheckCircle2, color: 'text-emerald-400', glow: 'rgba(0,230,118,0.15)' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-amber-400', glow: 'rgba(255,193,7,0.15)' },
  { value: 'inactive', label: 'Sans activité', icon: BanIcon, color: 'text-red-400', glow: 'rgba(255,59,59,0.15)' },
];

interface ExpenseRow { id: string; category: string; amountStr: string; litersStr: string; otherLabel: string; isAutomated?: boolean; }
interface BreakdownRow { id: string; category: string; partChanged: string; cause: string; amountStr: string; }

function expenseRowToItem(row: ExpenseRow): ExpenseItem {
  return {
    id: row.id,
    category: row.category,
    amount: parseFloat(row.amountStr) || 0,
    liters: row.litersStr ? parseFloat(row.litersStr) : undefined,
    comment: row.otherLabel
  };
}

function breakdownRowToItem(row: BreakdownRow): BreakdownItem {
  return {
    id: row.id,
    category: row.category,
    partChanged: row.partChanged,
    cause: row.cause,
    amount: parseFloat(row.amountStr) || 0
  };
}

type Section = 'recette' | 'charges' | 'pannes' | 'commentaire';

export default function DailyActivity() {
  const {
    dailyEntries,
    addDailyEntry,
    updateDailyEntry,
    setDailyEntries, // ✅ suppression SIMPLE : on enlève juste la ligne d'historique
    settings,
    automations,
    deductFromMaintenanceFund,
    deductFromCash,
    cashBalance,
    maintenanceFund,
  } = useStore();

  const currency = settings.currency || 'Fr';
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [dayType, setDayType] = useState<DayType>('normal');
  const [revenueStr, setRevenueStr] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [breakdowns, setBreakdowns] = useState<BreakdownRow[]>([]);
  const [generalComment, setGeneralComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<Section>('recette');
  const [saved, setSaved] = useState(false);
  const [deductFrom, setDeductFrom] = useState<'cash' | 'maintenance'>('cash');
  const [saveError, setSaveError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getAutoExpenses = (): ExpenseRow[] =>
    automations
      .filter(a => a.isActive && a.frequency === 'daily')
      .map(a => ({
        id: uid(),
        category: a.category,
        amountStr: a.amount.toString(),
        litersStr: a.liters ? a.liters.toString() : '',
        otherLabel: a.comment || '',
        isAutomated: true,
      }));

  useEffect(() => {
    const existing = dailyEntries.find(e => e.date === today);
    if (existing) {
      setIsLocked(true);
      setRevenueStr('');
      setExpenses([]);
      setBreakdowns([]);
      setEditingId(existing.id);
    } else {
      setIsLocked(false);
      const auto = getAutoExpenses();
      setExpenses(auto.length > 0 ? auto : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRevenueStr('');
    setBreakdowns([]);
    setGeneralComment('');
    setEditingId(null);
    setDayType('normal');
    setDeductFrom('cash');
    setSaveError('');
    setConfirmOpen(false);

    const existing = dailyEntries.find(e => e.date === date);
    if (existing) {
      setIsLocked(true);
      setDayType(existing.dayType || 'normal');
      setRevenueStr('');
      setExpenses([]);
      setBreakdowns([]);
      setGeneralComment('');
      setEditingId(null);
    } else {
      setIsLocked(false);
      const auto = getAutoExpenses();
      setExpenses(auto.length > 0 ? auto : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const totalExpensesAmt = expenses.reduce((s, e) => s + (parseFloat(e.amountStr) || 0), 0);
  const totalBreakdownsAmt = breakdowns.reduce((s, b) => s + (parseFloat(b.amountStr) || 0), 0);
  const totalMaint = totalExpensesAmt + totalBreakdownsAmt;

  const grossRevenue = dayType === 'normal' ? (parseFloat(revenueStr) || 0) : 0;
  const netRevenue = grossRevenue - totalExpensesAmt - totalBreakdownsAmt;

  const handleSave = (forceConfirm = false) => {
    if (isLocked) {
      setSaveError(`Cette date est déjà enregistrée. Supprimez d'abord l'enregistrement existant dans l'Historique.`);
      return;
    }
    setSaveError('');

    if (dayType === 'maintenance' && totalMaint > 0 && !forceConfirm) {
      setConfirmOpen(true);
      return;
    }

    if (dayType === 'maintenance' && totalMaint > 0 && deductFrom === 'maintenance' && totalMaint > maintenanceFund) {
      setConfirmOpen(false);
      alert('Fonds maintenance insuffisants');
      return;
    }

    const entry: DailyEntry = {
      id: editingId || uid(),
      date,
      dayType,
      revenue: grossRevenue,
      expenses: expenses.map(expenseRowToItem),
      breakdowns: breakdowns.map(breakdownRowToItem),
      comment: generalComment,
      netRevenue: dayType === 'inactive' ? 0 : netRevenue,
    };

    if (editingId) {
      updateDailyEntry(editingId, entry);
    } else {
      addDailyEntry(entry);

      if (dayType === 'maintenance' && totalMaint > 0) {
        if (deductFrom === 'maintenance') {
          deductFromMaintenanceFund(totalMaint, 'Maintenance depuis activité journalière', date);
        } else {
          deductFromCash(totalMaint);
        }
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (!editingId) {
      setRevenueStr('');
      setExpenses(getAutoExpenses());
      setBreakdowns([]);
      setGeneralComment('');
      setEditingId(null);
      setDeductFrom('cash');
      setSaveError('');
      setIsLocked(true);
    }

    setConfirmOpen(false);
  };

  const SectionHeader = ({ id, label, count, total, color }: { id: Section; label: string; count?: number; total?: number; color: string }) => (
    <button
      onClick={() => setOpenSection(id)}
      className="w-full flex items-center justify-between py-4 px-6 transition-all duration-200"
      style={{ borderBottom: openSection === id ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-white font-semibold text-sm">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#9AA4B2' }}>
            {count}
          </span>
        )}
        {total !== undefined && total > 0 && (
          <span className="text-xs font-medium" style={{ color }}>{fmt(total, currency)}</span>
        )}
      </div>
      <motion.div animate={{ rotate: openSection === id ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </motion.div>
    </button>
  );

  const handleDeleteHistoryLine = (entryId: string, entryDate: string) => {
    if (window.confirm(`Supprimer l'activité du ${new Date(entryDate + 'T12:00:00').toLocaleDateString('fr-FR')} ?`)) {
      // ✅ suppression simple : on enlève juste la ligne (aucun recalcul "intelligent" ici)
      const newEntries = dailyEntries.filter(e => e.id !== entryId);
      setDailyEntries(newEntries);

      if (entryDate === date) {
        setIsLocked(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen" style={{ background: '#05070D' }}>
      <img
        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.06, filter: 'blur(2px)' }}
        alt=""
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #00E676, #FFC107)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Activité Journalière
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
              {settings.vehicleName} · {settings.vehiclePlate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(0,230,118,0.6)' }} />
            <span className="text-xs" style={{ color: '#9AA4B2' }}>Système actif</span>
          </div>
        </div>

        <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl" style={{ background: 'rgba(11,15,26,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                    style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-3 block" style={{ color: '#9AA4B2' }}>Type de journée</label>
                  <div className="grid grid-cols-3 gap-3">
                    {DAY_TYPES.map(({ value, label, icon: Icon, color, glow }) => (
                      <button
                        key={value}
                        onClick={() => setDayType(value)}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 text-sm font-medium"
                        style={{
                          background: dayType === value ? `rgba(${glow.match(/[\d.]+/g)?.slice(0, 3).join(',')},0.12)` : 'rgba(255,255,255,0.03)',
                          border: dayType === value ? `1px solid rgba(${glow.match(/[\d.]+/g)?.slice(0, 3).join(',')},0.5)` : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: dayType === value ? `0 0 20px ${glow}` : 'none',
                        }}
                      >
                        <Icon className={`w-4 h-4 ${dayType === value ? color : 'text-slate-500'}`} />
                        <span className={dayType === value ? color : 'text-slate-400'}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {dayType === 'maintenance' && (
                  <div>
                    <label className="text-xs font-medium mb-3 block" style={{ color: '#9AA4B2' }}>
                      Les dépenses seront déduites de :
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'cash', label: 'Caisse actuelle', color: '#00E676' },
                        { value: 'maintenance', label: 'Frais de maintenance', color: '#FFC107' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDeductFrom(opt.value as 'cash' | 'maintenance')}
                          className="py-3 px-4 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: deductFrom === opt.value ? `rgba(${opt.color === '#00E676' ? '0,230,118' : '255,193,7'},0.12)` : 'rgba(255,255,255,0.03)',
                            border: deductFrom === opt.value ? `1px solid ${opt.color}80` : '1px solid rgba(255,255,255,0.06)',
                            color: deductFrom === opt.value ? opt.color : '#9AA4B2',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 text-xs" style={{ color: '#64748B' }}>
                      Caisse : {fmt(cashBalance, currency)} · Fonds maintenance : {fmt(maintenanceFund, currency)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl" style={{
              background: 'rgba(11,15,26,0.8)',
              border: openSection === 'recette' ? '1px solid rgba(0,230,118,0.25)' : '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              boxShadow: openSection === 'recette' ? '0 0 30px rgba(0,230,118,0.08)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              <SectionHeader id="recette" label="Recette brute" total={grossRevenue} color="#00E676" />
              <AnimatePresence>
                {openSection === 'recette' && dayType === 'normal' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="p-6">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={revenueStr}
                        onChange={e => setRevenueStr(e.target.value)}
                        placeholder="Ex: 35 000"
                        className="w-full rounded-xl px-5 py-4 text-2xl font-bold outline-none transition-all"
                        style={{ background: '#0F1625', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676', caretColor: '#00E676' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,230,118,0.5)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,230,118,0.1)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,230,118,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <p className="text-xs mt-2" style={{ color: '#9AA4B2' }}>Montant total encaissé en {currency}</p>
                    </div>
                  </motion.div>
                )}
                {openSection === 'recette' && dayType !== 'normal' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="px-6 pb-5">
                      <p className="text-sm" style={{ color: '#9AA4B2' }}>Pas de recette pour ce type de journée.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {dayType !== 'inactive' && (
              <div className="rounded-2xl" style={{
                background: 'rgba(11,15,26,0.8)',
                border: openSection === 'charges' ? '1px solid rgba(255,193,7,0.25)' : '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                boxShadow: openSection === 'charges' ? '0 0 30px rgba(255,193,7,0.06)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                <SectionHeader id="charges" label="Charges & Dépenses" count={expenses.length} total={totalExpensesAmt} color="#FFC107" />
                <AnimatePresence>
                  {openSection === 'charges' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="p-6 space-y-3">
                        {expenses.map((exp, idx) => {
                          const catInfo = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                          return (
                            <motion.div
                              key={exp.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="rounded-xl p-4"
                              style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.04)' }}
                            >
                              <div className="grid grid-cols-12 gap-3 items-start">
                                <div className={catInfo?.hasLiters && exp.category !== 'autre' ? 'col-span-4' : exp.category === 'autre' ? 'col-span-4' : 'col-span-6'}>
                                  <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Catégorie</label>
                                  <select
                                    value={exp.category}
                                    onChange={e => setExpenses(prev => prev.map(x => x.id === exp.id ? { ...x, category: e.target.value, otherLabel: '' } : x))}
                                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none appearance-none"
                                    style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                  >
                                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                  </select>
                                </div>

                                {exp.category === 'autre' && (
                                  <div className="col-span-4">
                                    <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Précisez</label>
                                    <input
                                      type="text"
                                      value={exp.otherLabel}
                                      onChange={e => setExpenses(prev => prev.map(x => x.id === exp.id ? { ...x, otherLabel: e.target.value } : x))}
                                      placeholder="Ex: Amendes..."
                                      className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                                      style={{ background: '#0B1220', border: '1px solid rgba(255,193,7,0.2)' }}
                                    />
                                  </div>
                                )}

                                <div className={catInfo?.hasLiters && exp.category !== 'autre' ? 'col-span-4' : exp.category === 'autre' ? 'col-span-2' : 'col-span-4'}>
                                  <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Montant</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={exp.amountStr}
                                    onChange={e => setExpenses(prev => prev.map(x => x.id === exp.id ? { ...x, amountStr: e.target.value } : x))}
                                    placeholder="0"
                                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)' }}
                                  />
                                </div>

                                {catInfo?.hasLiters && exp.category !== 'autre' && (
                                  <div className="col-span-2">
                                    <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Litres</label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={exp.litersStr}
                                      onChange={e => setExpenses(prev => prev.map(x => x.id === exp.id ? { ...x, litersStr: e.target.value } : x))}
                                      placeholder="0"
                                      className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                                      style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)' }}
                                    />
                                  </div>
                                )}

                                <div className="col-span-2 flex items-end pb-0.5 justify-end">
                                  <button onClick={() => setExpenses(prev => prev.filter(x => x.id !== exp.id))} className="p-2 rounded-lg transition-colors hover:bg-red-500/10">
                                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-400" />
                                  </button>
                                </div>
                              </div>

                              {exp.isAutomated && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Zap className="w-3 h-3 text-blue-400" />
                                  <span className="text-xs text-blue-400">Automatisé</span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}

                        {expenses.length === 0 && (
                          <div className="text-center py-6 text-sm" style={{ color: '#9AA4B2', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            Aucune charge — cliquez sur Ajouter
                          </div>
                        )}

                        <button
                          onClick={() => setExpenses(prev => [...prev, { id: uid(), category: 'carburant', amountStr: '', litersStr: '', otherLabel: '' }])}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
                          style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)', color: '#FFC107' }}
                        >
                          <Plus className="w-4 h-4" /> Ajouter une charge
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {dayType !== 'inactive' && (
              <div className="rounded-2xl" style={{
                background: 'rgba(11,15,26,0.8)',
                border: openSection === 'pannes' ? '1px solid rgba(255,59,59,0.25)' : '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                boxShadow: openSection === 'pannes' ? '0 0 30px rgba(255,59,59,0.06)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                <SectionHeader id="pannes" label="Pannes & Réparations" count={breakdowns.length} total={totalBreakdownsAmt} color="#FF3B3B" />
                <AnimatePresence>
                  {openSection === 'pannes' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="p-6 space-y-3">
                        {breakdowns.map((bd, idx) => (
                          <motion.div
                            key={bd.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-xl p-4"
                            style={{ background: '#0F1625', border: '1px solid rgba(255,59,59,0.08)' }}
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Catégorie</label>
                                <select
                                  value={bd.category}
                                  onChange={e => setBreakdowns(prev => prev.map(x => x.id === bd.id ? { ...x, category: e.target.value } : x))}
                                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none appearance-none"
                                  style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                >
                                  {BREAKDOWN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>

                              <div>
                                <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Coût ({currency})</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={bd.amountStr}
                                  onChange={e => setBreakdowns(prev => prev.map(x => x.id === bd.id ? { ...x, amountStr: e.target.value } : x))}
                                  placeholder="0"
                                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                                  style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)' }}
                                />
                              </div>

                              <div>
                                <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Pièce / Réparation</label>
                                <input
                                  type="text"
                                  value={bd.partChanged}
                                  onChange={e => setBreakdowns(prev => prev.map(x => x.id === bd.id ? { ...x, partChanged: e.target.value } : x))}
                                  placeholder="Ex: Filtre à huile..."
                                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                                  style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)' }}
                                />
                              </div>

                              <div>
                                <label className="text-xs mb-1.5 block" style={{ color: '#9AA4B2' }}>Cause</label>
                                <input
                                  type="text"
                                  value={bd.cause}
                                  onChange={e => setBreakdowns(prev => prev.map(x => x.id === bd.id ? { ...x, cause: e.target.value } : x))}
                                  placeholder="Ex: Usure..."
                                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                                  style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)' }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end mt-2">
                              <button onClick={() => setBreakdowns(prev => prev.filter(x => x.id !== bd.id))} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-400" />
                              </button>
                            </div>
                          </motion.div>
                        ))}

                        {breakdowns.length === 0 && (
                          <div className="text-center py-6 text-sm" style={{ color: '#9AA4B2', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            Aucune panne — cliquez sur Ajouter
                          </div>
                        )}

                        <button
                          onClick={() => setBreakdowns(prev => [...prev, { id: uid(), category: 'Moteur', partChanged: '', cause: '', amountStr: '' }])}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
                          style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)', color: '#FF3B3B' }}
                        >
                          <Plus className="w-4 h-4" /> Ajouter une panne
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="rounded-2xl" style={{
              background: 'rgba(11,15,26,0.8)',
              border: openSection === 'commentaire' ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease',
            }}>
              <SectionHeader id="commentaire" label="Commentaire" color="#9AA4B2" />
              <AnimatePresence>
                {openSection === 'commentaire' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="p-6">
                      <textarea
                        value={generalComment}
                        onChange={e => setGeneralComment(e.target.value)}
                        rows={3}
                        placeholder="Notes sur la journée..."
                        className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isLocked && !editingId && (
              <div className="rounded-xl px-5 py-4 text-sm font-medium" style={{
                background: 'rgba(255,59,59,0.08)',
                border: '1px solid rgba(255,59,59,0.3)',
                color: '#FF3B3B',
              }}>
                🔒 Cette date est déjà enregistrée. Supprimez d'abord l'enregistrement existant dans l'Historique pour pouvoir enregistrer à nouveau sur cette date.
              </div>
            )}

            {saveError && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', color: '#FF3B3B' }}>
                ⚠️ {saveError}
              </div>
            )}

            <motion.button
              onClick={() => handleSave(false)}
              whileTap={(isLocked && !editingId) ? {} : { scale: 0.97 }}
              disabled={isLocked && !editingId}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all"
              style={{
                background: (isLocked && !editingId)
                  ? 'rgba(255,255,255,0.05)'
                  : saved
                    ? 'linear-gradient(135deg, #00E676, #00C853)'
                    : 'linear-gradient(135deg, #FFC107, #FF8F00)',
                color: (isLocked && !editingId) ? '#4a5568' : '#000',
                boxShadow: (isLocked && !editingId) ? 'none' : saved ? '0 0 30px rgba(0,230,118,0.3)' : '0 0 30px rgba(255,193,7,0.3)',
                cursor: (isLocked && !editingId) ? 'not-allowed' : 'pointer',
                border: (isLocked && !editingId) ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <Save className="w-5 h-5" />
              {(isLocked && !editingId) ? '🔒 Date verrouillée — Supprimez d\'abord dans l\'Historique' : saved ? '✓ Enregistré !' : editingId ? 'Mettre à jour' : "Enregistrer l'activité"}
            </motion.button>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl p-6 sticky top-6" style={{ background: 'rgba(11,15,26,0.9)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: '#00E676' }} />
                Résumé financier
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 px-4 rounded-xl" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.1)' }}>
                  <span className="text-sm" style={{ color: '#9AA4B2' }}>Recette brute</span>
                  <span className="font-bold" style={{ color: '#00E676' }}>{fmt(grossRevenue, currency)}</span>
                </div>

                <div className="flex justify-between items-center py-3 px-4 rounded-xl" style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.1)' }}>
                  <span className="text-sm" style={{ color: '#9AA4B2' }}>Charges ({expenses.length})</span>
                  <span className="font-bold" style={{ color: '#FFC107' }}>- {fmt(totalExpensesAmt, currency)}</span>
                </div>

                {totalBreakdownsAmt > 0 && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl" style={{ background: 'rgba(255,59,59,0.06)', border: '1px solid rgba(255,59,59,0.1)' }}>
                    <span className="text-sm" style={{ color: '#9AA4B2' }}>Pannes ({breakdowns.length})</span>
                    <span className="font-bold" style={{ color: '#FF3B3B' }}>- {fmt(totalBreakdownsAmt, currency)}</span>
                  </div>
                )}

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                <div className="py-4 px-4 rounded-xl text-center" style={{
                  background: netRevenue >= 0 ? 'rgba(0,230,118,0.08)' : 'rgba(255,59,59,0.08)',
                  border: `1px solid ${netRevenue >= 0 ? 'rgba(0,230,118,0.2)' : 'rgba(255,59,59,0.2)'}`,
                }}>
                  <p className="text-xs mb-2" style={{ color: '#9AA4B2' }}>Résultat net</p>
                  <motion.p
                    key={netRevenue}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-extrabold"
                    style={{
                      color: netRevenue >= 0 ? '#00E676' : '#FF3B3B',
                      textShadow: netRevenue >= 0 ? '0 0 20px rgba(0,230,118,0.4)' : '0 0 20px rgba(255,59,59,0.4)',
                    }}
                  >
                    {fmt(dayType === 'inactive' ? 0 : netRevenue, currency)}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MINI HISTORIQUE (repris de l’ancien et adapté au nouveau) */}
      {dailyEntries.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-12">
          <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.3), transparent)' }} />
          <h3 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#00E676', boxShadow: '0 0 8px rgba(0,230,118,0.6)' }} />
            Historique des activités
            <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.06)', color: '#9AA4B2' }}>
              {dailyEntries.length}
            </span>
          </h3>

          <div className="space-y-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {[...dailyEntries].sort((a, b) => b.date.localeCompare(a.date)).map(entry => {
              const entryExpenses = entry.expenses.reduce((s, e) => s + e.amount, 0);
              const entryBreakdowns = entry.breakdowns.reduce((s, b) => s + b.amount, 0);

              const typeColor = entry.dayType === 'normal' ? '#00E676' : entry.dayType === 'maintenance' ? '#FFC107' : '#FF3B3B';
              const typeLabel = entry.dayType === 'normal' ? 'Normale' : entry.dayType === 'maintenance' ? 'Maintenance' : 'Inactive';

              return (
                <div
                  key={entry.id}
                  className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                  style={{ background: 'rgba(11,15,26,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeColor, boxShadow: `0 0 8px ${typeColor}` }} />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                          {typeLabel}
                        </span>

                        {entry.expenses.some(e => e.isAutomated) && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#60A5FA' }}>
                            <Zap className="w-3 h-3" /> Auto
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 mt-1 text-xs flex-wrap" style={{ color: '#9AA4B2' }}>
                        {entry.dayType === 'normal' && (
                          <span>
                            Brut: <span style={{ color: '#00E676' }}>{fmt(entry.revenue, currency)}</span>
                          </span>
                        )}
                        {entryExpenses > 0 && (
                          <span>
                            Charges: <span style={{ color: '#FFC107' }}>-{fmt(entryExpenses, currency)}</span>
                          </span>
                        )}
                        {entryBreakdowns > 0 && (
                          <span>
                            Pannes: <span style={{ color: '#FF3B3B' }}>-{fmt(entryBreakdowns, currency)}</span>
                          </span>
                        )}
                        <span>
                          Net:{' '}
                          <span style={{ color: entry.netRevenue >= 0 ? '#00E676' : '#FF3B3B', fontWeight: 600 }}>
                            {fmt(entry.netRevenue, currency)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHistoryLine(entry.id, entry.date)}
                    className="flex-shrink-0 p-2 rounded-lg transition-all hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="rounded-3xl p-7 w-full max-w-md"
              style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <h3 className="text-white font-bold text-xl mb-2">Confirmer l’enregistrement</h3>

              <p className="text-slate-400 text-sm mb-4">
                Vous allez enregistrer une journée <span className="text-white font-semibold">Maintenance</span>.
              </p>

              <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-slate-400 text-sm mb-2">
                  Montant total : <span className="text-white font-bold">{fmt(totalMaint, currency)}</span>
                </p>
                <p className="text-slate-400 text-sm">
                  Source : <span className="text-white font-bold">{deductFrom === 'maintenance' ? 'Fonds maintenance' : 'Caisse'}</span>
                </p>
              </div>

              {deductFrom === 'maintenance' && totalMaint > maintenanceFund && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium mb-4"
                  style={{ background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', color: '#FF3B3B' }}>
                  Fonds maintenance insuffisants.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8' }}
                >
                  Annuler
                </button>

                <button
                  onClick={() => handleSave(true)}
                  disabled={deductFrom === 'maintenance' && totalMaint > maintenanceFund}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{
                    background: (deductFrom === 'maintenance' && totalMaint > maintenanceFund)
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, #00E676, #00C853)',
                    color: (deductFrom === 'maintenance' && totalMaint > maintenanceFund) ? '#4a5568' : '#000',
                    border: 'none',
                    cursor: (deductFrom === 'maintenance' && totalMaint > maintenanceFund) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}