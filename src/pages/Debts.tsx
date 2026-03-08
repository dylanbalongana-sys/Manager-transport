import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Save, Edit2, Check, ChevronDown, ChevronUp,
  CreditCard, AlertCircle, CheckCircle2, Clock, Wrench, ShoppingBag, MoreHorizontal, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, uid } from '../store/useStore';
import type { Debt } from '../types';

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

const SUPPLIER_TYPES = [
  { value: 'mechanic', label: 'Mécanicien', icon: Wrench, color: '#f59e0b' },
  { value: 'wholesaler', label: 'Fournisseur', icon: ShoppingBag, color: '#6366f1' },
  { value: 'other', label: 'Autre', icon: MoreHorizontal, color: '#64748b' },
];

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string;
  border: string; glow: string; icon: React.ElementType
}> = {
  pending: { label: 'Non payée', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', glow: 'rgba(239,68,68,0.12)', icon: AlertCircle },
  partial: { label: 'Partielle', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', glow: 'rgba(245,158,11,0.12)', icon: Clock },
  paid: { label: 'Payée', color: '#00E676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.25)', glow: 'rgba(0,230,118,0.12)', icon: CheckCircle2 },
};

const EMPTY_FORM: Partial<Debt> = {
  supplier: '', supplierType: 'mechanic', part: '',
  amount: 0, remainingAmount: 0,
  dateCreated: new Date().toISOString().split('T')[0],
  dateDue: '', status: 'pending', notes: '',
};

// Particules identiques au Dashboard
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 6 + 5,
  delay: Math.random() * 4,
  color: i % 3 === 0 ? '#00E676' : i % 3 === 1 ? '#FFC107' : '#FF3B3B',
}));

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt, payDebt, settings, cashBalance } = useStore();
  const currency = settings.currency || 'Fr';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Debt>>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal paiement
  const [payModal, setPayModal] = useState<{ debtId: string; maxAmount: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paySource, setPaySource] = useState<'cash' | 'own'>('cash');

  const handlePay = () => {
    if (!payModal || !payAmount) return;
    const amount = Number(payAmount);
    if (amount <= 0 || amount > payModal.maxAmount) return;
    payDebt(payModal.debtId, amount, paySource === 'cash');
    setPayModal(null);
    setPayAmount('');
    setPaySource('cash');
  };

  const totalDebt = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0);
  const pendingCount = debts.filter(d => d.status === 'pending').length;
  const partialCount = debts.filter(d => d.status === 'partial').length;
  const paidCount = debts.filter(d => d.status === 'paid').length;
  const animatedTotal = useCountUp(totalDebt);
  const totalInitial = debts.reduce((s, d) => s + d.amount, 0);
  const totalPaid = debts.reduce((s, d) => s + (d.amount - d.remainingAmount), 0);
  const globalPct = totalInitial > 0 ? Math.round((totalPaid / totalInitial) * 100) : 0;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (debt: Debt) => {
    setForm({ ...debt });
    setEditingId(debt.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.supplier || !form.part || !form.amount) {
      return alert('Remplissez les champs obligatoires.');
    }
    const debt: Debt = {
      id: editingId || uid(),
      supplier: form.supplier!,
      supplierType: form.supplierType || 'other',
      part: form.part!,
      amount: Number(form.amount) || 0,
      remainingAmount: Number(form.remainingAmount ?? form.amount) || 0,
      dateCreated: form.dateCreated || new Date().toISOString().split('T')[0],
      dateDue: form.dateDue || '',
      status: form.status || 'pending',
      notes: form.notes || '',
    };
    editingId ? updateDebt(editingId, debt) : addDebt(debt);
    resetForm();
  };

  const inputStyle = {
    background: '#0F1625',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#F5F7FA',
  };

  return (
    <div className="relative min-h-screen w-full" style={{ background: '#05070D' }}>

      {/* ── IMAGE DE FOND REPRÉSENTATIVE ── */}
      <img
        src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80"
        alt=""
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.07, filter: 'blur(2px)', zIndex: 0 }}
      />

      {/* ── FOND SPATIAL + PARTICULES ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.25), transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        {/* Particules identiques au Dashboard */}
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 pb-24" style={{ zIndex: 2 }}>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl mb-10"
          style={{
            background: 'rgba(11,15,26,0.75)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 0 50px rgba(239,68,68,0.07)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-3xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5), rgba(245,158,11,0.4), transparent)' }} />

          <div className="px-8 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl blur-xl"
                  style={{ background: 'rgba(239,68,68,0.3)', transform: 'scale(1.4)' }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(245,158,11,0.15))', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <CreditCard className="w-7 h-7" style={{ color: '#ef4444' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <motion.div className="w-2 h-2 rounded-full"
                    style={{ background: totalDebt > 0 ? '#ef4444' : '#00E676', boxShadow: `0 0 8px ${totalDebt > 0 ? '#ef4444' : '#00E676'}` }}
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#9AA4B2' }}>
                    {totalDebt > 0 ? 'Dettes actives' : 'Tout soldé'}
                  </span>
                </div>
                <h1 className="font-extrabold leading-tight"
                  style={{
                    fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
                    background: 'linear-gradient(90deg, #ef4444, #f59e0b, #00E676)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                  Gestion des Dettes
                </h1>
                <p className="text-sm mt-0.5" style={{ color: '#9AA4B2' }}>Suivi des créances fournisseurs et mécaniciens</p>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="flex gap-6 flex-wrap">
              {[
                { label: 'Total restant', val: fmt(animatedTotal, currency), color: '#ef4444' },
                { label: 'Remboursé', val: `${globalPct}%`, color: '#00E676' },
                { label: 'Dossiers', val: String(debts.length), color: '#F5F7FA' },
              ].map(({ label, val, color }, i) => (
                <div key={label} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-8 hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }} />}
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: '#9AA4B2' }}>{label}</p>
                    <p className="font-black text-lg tabular-nums" style={{ color }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Barre Congo */}
          <div className="h-[3px] rounded-b-3xl"
            style={{ background: 'linear-gradient(90deg, #00E676 0%, #FFC107 50%, #FF3B3B 100%)' }} />
        </motion.div>

        {/* ── KPI ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10"
        >
          {[
            { label: 'Non payées', value: pendingCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: AlertCircle },
            { label: 'Partielles', value: partialCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: Clock },
            { label: 'Réglées', value: paidCount, color: '#00E676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', icon: CheckCircle2 },
            { label: 'Progression globale', value: `${globalPct}%`, color: '#FFC107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.2)', icon: CreditCard, isProgress: true, pct: globalPct },
          ].map(({ label, value, color, bg, border, icon: Icon, isProgress, pct }) => (
            <motion.div
              key={label}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(20px)' }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-0.5" style={{ color: '#9AA4B2' }}>{label}</p>
                {isProgress ? (
                  <div>
                    <p className="font-black text-lg" style={{ color }}>{value}</p>
                    <div className="h-1 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #00E676, #FFC107)' }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2 }} />
                    </div>
                  </div>
                ) : (
                  <p className="font-black text-2xl" style={{ color }}>{value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── BOUTON NOUVELLE DETTE ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm font-medium" style={{ color: '#9AA4B2' }}>
            {debts.length} dette{debts.length !== 1 ? 's' : ''} enregistrée{debts.length !== 1 ? 's' : ''}
          </p>
          <motion.button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm text-white flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.8), rgba(245,158,11,0.8))',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 0 20px rgba(239,68,68,0.12)',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {showForm && !editingId ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm && !editingId ? 'Fermer' : 'Nouvelle dette'}
          </motion.button>
        </div>

        {/* ── FORMULAIRE ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden mb-8"
            >
              <div className="rounded-3xl p-8"
                style={{
                  background: 'rgba(11,15,26,0.85)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}>
                <h3 className="font-bold text-base mb-6" style={{ color: '#F5F7FA' }}>
                  {editingId ? '✏️ Modifier la dette' : '➕ Nouvelle dette'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Fournisseur / Mécanicien *</label>
                    <input type="text" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                      placeholder="Nom du fournisseur"
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.target.style.border = '1px solid rgba(245,158,11,0.5)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Type</label>
                    <div className="relative">
                      <select value={form.supplierType}
                        onChange={(e) => setForm({ ...form, supplierType: e.target.value as Debt['supplierType'] })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none"
                        style={inputStyle}>
                        {SUPPLIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9AA4B2' }} />
                    </div>
                  </div>

                  {/* Champ libre si "Autre" sélectionné */}
                  {form.supplierType === 'other' && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#f59e0b' }}>
                        Précisez le type *
                      </label>
                      <input
                        type="text"
                        value={form.notes?.startsWith('Type: ') ? form.notes.replace('Type: ', '') : ''}
                        onChange={(e) => setForm({ ...form, notes: e.target.value ? `Type: ${e.target.value}` : '' })}
                        placeholder="Ex: Propriétaire de station, Partenaire, Ami..."
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                        style={{
                          background: '#0F1625',
                          border: '1px solid rgba(245,158,11,0.5)',
                          color: '#F5F7FA',
                          boxShadow: '0 0 12px rgba(245,158,11,0.08)',
                        }}
                        onFocus={e => { e.target.style.border = '1px solid rgba(245,158,11,0.8)'; e.target.style.boxShadow = '0 0 16px rgba(245,158,11,0.15)'; }}
                        onBlur={e => { e.target.style.border = '1px solid rgba(245,158,11,0.5)'; e.target.style.boxShadow = '0 0 12px rgba(245,158,11,0.08)'; }}
                        autoFocus
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Pièce / Objet *</label>
                    <input type="text" value={form.part || ''} onChange={(e) => setForm({ ...form, part: e.target.value })}
                      placeholder="Ex: Plaquettes de frein..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.target.style.border = '1px solid rgba(245,158,11,0.5)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Montant total ({currency}) *</label>
                    <input type="number" value={form.amount || ''}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value), remainingAmount: Number(e.target.value) })}
                      placeholder="0" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.target.style.border = '1px solid rgba(239,68,68,0.5)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Montant restant ({currency})</label>
                    <input type="number" value={form.remainingAmount || ''}
                      onChange={(e) => setForm({ ...form, remainingAmount: Number(e.target.value) })}
                      placeholder="0" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.target.style.border = '1px solid rgba(245,158,11,0.5)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Statut</label>
                    <div className="relative">
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Debt['status'] })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none" style={inputStyle}>
                        <option value="pending">Non payée</option>
                        <option value="partial">Partiellement payée</option>
                        <option value="paid">Entièrement payée</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9AA4B2' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Date de création</label>
                    <input type="date" value={form.dateCreated || ''} onChange={(e) => setForm({ ...form, dateCreated: e.target.value })}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Date d'échéance</label>
                    <input type="date" value={form.dateDue || ''} onChange={(e) => setForm({ ...form, dateDue: e.target.value })}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={inputStyle} />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Notes</label>
                  <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2} placeholder="Informations supplémentaires..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none" style={inputStyle} />
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Save className="w-4 h-4" />
                    {editingId ? 'Mettre à jour' : 'Enregistrer'}
                  </motion.button>
                  <button onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#9AA4B2' }}>
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LISTE SCROLLABLE DES DETTES ── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(11,15,26,0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* En-tête liste */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>
              {debts.length} dette{debts.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs" style={{ color: '#9AA4B2' }}>Cliquez sur une ligne pour les détails</p>
          </div>

          {/* Zone scrollable */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: '520px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(245,158,11,0.3) transparent',
            }}
          >
            <AnimatePresence>
              {debts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <CreditCard className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  <p className="font-semibold" style={{ color: '#9AA4B2' }}>Aucune dette enregistrée</p>
                  <p className="text-sm" style={{ color: 'rgba(154,164,178,0.5)' }}>
                    Cliquez sur "Nouvelle dette" pour en ajouter une
                  </p>
                </motion.div>
              ) : (
                debts.map((debt, i) => {
                  const cfg = STATUS_CONFIG[debt.status];
                  const StatusIcon = cfg.icon;
                  const supplierInfo = SUPPLIER_TYPES.find(t => t.value === debt.supplierType);
                  const SupplierIcon = supplierInfo?.icon || MoreHorizontal;
                  const pct = debt.amount > 0 ? Math.round(((debt.amount - debt.remainingAmount) / debt.amount) * 100) : 0;
                  const isOverdue = debt.dateDue && debt.status !== 'paid' && new Date(debt.dateDue) < new Date();
                  const isExpanded = expandedId === debt.id;

                  return (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {/* Ligne compacte */}
                      <div
                        className="px-6 py-4 flex items-center gap-4 cursor-pointer transition-all duration-200"
                        style={{ background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                        onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent')}
                      >
                        {/* Icône fournisseur */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <SupplierIcon className="w-4 h-4" style={{ color: supplierInfo?.color || '#64748b' }} />
                        </div>

                        {/* Nom + pièce */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate" style={{ color: '#F5F7FA' }}>{debt.supplier}</p>
                            {isOverdue && (
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                                En retard
                              </span>
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: '#9AA4B2' }}>{debt.part}</p>
                        </div>

                        {/* Barre progression mini */}
                        <div className="hidden sm:block w-24">
                          <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.color}, #00E676)` }} />
                          </div>
                          <p className="text-xs mt-1 text-center" style={{ color: '#9AA4B2' }}>{pct}%</p>
                        </div>

                        {/* Badge statut */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{cfg.label}</span>
                        </div>

                        {/* Montant */}
                        <p className="font-black text-base tabular-nums flex-shrink-0 w-28 text-right"
                          style={{ color: cfg.color }}>
                          {fmt(debt.remainingAmount, currency)}
                        </p>

                        {/* Expand icon */}
                        <div className="flex-shrink-0 ml-1">
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4" style={{ color: '#9AA4B2' }} />
                            : <ChevronDown className="w-4 h-4" style={{ color: '#9AA4B2' }} />}
                        </div>
                      </div>

                      {/* Détails expandés */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-3"
                              style={{ borderTop: `1px solid ${cfg.border}`, background: 'rgba(0,0,0,0.2)' }}>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* Infos */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9AA4B2' }}>Infos</p>
                                  <p className="text-sm" style={{ color: '#F5F7FA' }}>
                                    <span style={{ color: '#9AA4B2' }}>Type : </span>{supplierInfo?.label}
                                  </p>
                                  <p className="text-sm" style={{ color: '#F5F7FA' }}>
                                    <span style={{ color: '#9AA4B2' }}>Créé : </span>
                                    {new Date(debt.dateCreated).toLocaleDateString('fr-FR')}
                                  </p>
                                  {debt.dateDue && (
                                    <p className="text-sm" style={{ color: isOverdue ? '#ef4444' : '#F5F7FA' }}>
                                      <span style={{ color: '#9AA4B2' }}>Échéance : </span>
                                      {new Date(debt.dateDue).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </div>

                                {/* Montants */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9AA4B2' }}>Montants</p>
                                  <p className="text-sm" style={{ color: '#F5F7FA' }}>
                                    <span style={{ color: '#9AA4B2' }}>Total : </span>{fmt(debt.amount, currency)}
                                  </p>
                                  <p className="text-sm">
                                    <span style={{ color: '#9AA4B2' }}>Payé : </span>
                                    <span style={{ color: '#00E676' }}>{fmt(debt.amount - debt.remainingAmount, currency)}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span style={{ color: '#9AA4B2' }}>Restant : </span>
                                    <span style={{ color: cfg.color, fontWeight: 700 }}>{fmt(debt.remainingAmount, currency)}</span>
                                  </p>
                                </div>

                                {/* Actions */}
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9AA4B2' }}>Actions</p>
                                  {debt.notes && (
                                    <p className="text-sm mb-4 px-3 py-2 rounded-xl"
                                      style={{ color: '#B8C1CC', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                      {debt.notes}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <motion.button onClick={(e) => { e.stopPropagation(); handleEdit(debt); }}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
                                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Edit2 className="w-3 h-3" /> Modifier
                                    </motion.button>
                                    {debt.status !== 'paid' && (
                                      <motion.button
                                        onClick={(e) => { e.stopPropagation(); setPayModal({ debtId: debt.id, maxAmount: debt.remainingAmount }); setPayAmount(String(debt.remainingAmount)); }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                                        style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676' }}
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Check className="w-3 h-3" /> Payer
                                      </motion.button>
                                    )}
                                    <motion.button
                                      onClick={(e) => { e.stopPropagation(); deleteDebt(debt.id); }}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
                                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Trash2 className="w-3 h-3" /> Supprimer
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── MODAL PAIEMENT ── */}
      <AnimatePresence>
        {payModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 100 }}
            onClick={() => setPayModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-8"
              style={{ background: 'rgba(11,15,26,0.98)', border: '1px solid rgba(0,230,118,0.2)', boxShadow: '0 0 60px rgba(0,230,118,0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-6" style={{ color: '#F5F7FA' }}>💳 Payer la dette</h3>

              {/* Montant */}
              <div className="mb-5">
                <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>
                  Montant à payer ({currency}) — Max: {fmt(payModal.maxAmount, currency)}
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  max={payModal.maxAmount}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: '#0F1625', border: '1px solid rgba(0,230,118,0.3)', color: '#F5F7FA' }}
                />
              </div>

              {/* Source du paiement */}
              <div className="mb-6">
                <label className="text-xs font-medium mb-3 block" style={{ color: '#9AA4B2' }}>Source du paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaySource('cash')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                    style={{
                      background: paySource === 'cash' ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)',
                      border: paySource === 'cash' ? '2px solid rgba(0,230,118,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-semibold" style={{ color: paySource === 'cash' ? '#00E676' : '#9AA4B2' }}>
                      Depuis la caisse
                    </span>
                    <span className="text-xs" style={{ color: '#9AA4B2' }}>
                      Caisse: {fmt(cashBalance, currency)}
                    </span>
                  </button>
                  <button
                    onClick={() => setPaySource('own')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                    style={{
                      background: paySource === 'own' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                      border: paySource === 'own' ? '2px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-2xl">👤</span>
                    <span className="text-xs font-semibold" style={{ color: paySource === 'own' ? '#f59e0b' : '#9AA4B2' }}>
                      Fonds propres
                    </span>
                    <span className="text-xs" style={{ color: '#9AA4B2' }}>
                      Mon argent personnel
                    </span>
                  </button>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handlePay}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #00E676, #00c853)' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  ✓ Confirmer le paiement
                </motion.button>
                <button
                  onClick={() => setPayModal(null)}
                  className="px-5 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#9AA4B2' }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
