import { useState } from 'react';
import { Plus, Trash2, Save, Edit2, ArrowRight, ChevronDown, ClipboardList, XCircle } from 'lucide-react';
import { useStore, uid } from '../store/useStore';
import type { ProvisionalDebt } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  provisional: { text: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)' },
  confirmed: { text: '#00E676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.25)' },
  cancelled: { text: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
};

const STATUS_LABELS: Record<string, string> = {
  provisional: 'Prévisionnelle',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  color: ['#00E676', '#FFC107', '#FF3B3B'][i % 3],
  duration: 3 + Math.random() * 4,
  delay: Math.random() * 3,
  size: 2 + Math.random() * 3,
}));

export default function ProvisionalDebts() {
  const {
    provisionalDebts,
    debts,
    addProvisionalDebt,
    updateProvisionalDebt,
    deleteProvisionalDebt,
    updateDebt,
    settings,
  } = useStore();

  const currency = settings.currency || 'Fr';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProvisionalDebt>>({
    label: '',
    originalDebtId: '',
    amount: 0,
    dateCreated: new Date().toISOString().split('T')[0],
    status: 'provisional',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      label: '',
      originalDebtId: '',
      amount: 0,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'provisional',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const applyReserve = (originalDebtId: string, amount: number) => {
    const d = debts.find(x => x.id === originalDebtId);
    if (!d) return { ok: false, msg: 'Dette liée introuvable.' };

    if (amount <= 0) return { ok: true, msg: '' };

    if (d.remainingAmount < amount) {
      return { ok: false, msg: `Montant trop grand. Reste sur cette dette : ${fmt(d.remainingAmount, currency)}` };
    }

    const newRemaining = d.remainingAmount - amount;
    const newStatus = newRemaining === 0 ? 'paid' : 'partial';
    updateDebt(d.id, { remainingAmount: newRemaining, status: newStatus as any });
    return { ok: true, msg: '' };
  };

  const releaseReserve = (originalDebtId: string, amount: number) => {
    const d = debts.find(x => x.id === originalDebtId);
    if (!d) return;

    if (amount <= 0) return;

    const newRemaining = d.remainingAmount + amount;
    const newStatus = newRemaining === 0 ? 'paid' : newRemaining < d.amount ? 'partial' : 'pending';
    updateDebt(d.id, { remainingAmount: newRemaining, status: newStatus as any });
  };

  const handleEdit = (pd: ProvisionalDebt) => {
    setForm({ ...pd });
    setEditingId(pd.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const handleSave = () => {
    const label = (form.label || '').trim();
    const amount = Number(form.amount) || 0;
    const originalDebtId = (form.originalDebtId || '').trim();

    if (!label || amount <= 0) return alert('Remplissez les champs obligatoires.');

    const newPd: ProvisionalDebt = {
      id: editingId || uid(),
      label,
      originalDebtId: originalDebtId || undefined,
      amount,
      dateCreated: form.dateCreated || new Date().toISOString().split('T')[0],
      status: (form.status || 'provisional') as any,
      notes: form.notes || '',
    };

    if (editingId) {
      const old = provisionalDebts.find(x => x.id === editingId);
      if (old?.originalDebtId) {
        releaseReserve(old.originalDebtId, old.amount);
      }

      if (newPd.originalDebtId && newPd.status !== 'cancelled') {
        const r = applyReserve(newPd.originalDebtId, newPd.amount);
        if (!r.ok) {
          if (old?.originalDebtId && old.status !== 'cancelled') {
            const back = applyReserve(old.originalDebtId, old.amount);
            if (!back.ok) {
              alert('Erreur : impossible de restaurer la dette d’origine. Vérifiez les montants.');
            }
          }
          return alert(r.msg);
        }
      }

      updateProvisionalDebt(editingId, newPd);
    } else {
      if (newPd.originalDebtId && newPd.status !== 'cancelled') {
        const r = applyReserve(newPd.originalDebtId, newPd.amount);
        if (!r.ok) return alert(r.msg);
      }
      addProvisionalDebt(newPd);
    }

    resetForm();
  };

  const moveToConfirmed = (pd: ProvisionalDebt) => {
    updateProvisionalDebt(pd.id, { status: 'confirmed' });
  };

  const cancelPd = (pd: ProvisionalDebt) => {
    if (!window.confirm('Annuler cette dette prévisionnelle ? Le montant retournera dans la dette réelle si elle est liée.')) return;

    if (pd.originalDebtId) {
      releaseReserve(pd.originalDebtId, pd.amount);
    }
    updateProvisionalDebt(pd.id, { status: 'cancelled' });
  };

  const deletePd = (pd: ProvisionalDebt) => {
    if (!window.confirm('Supprimer cette dette prévisionnelle ? Le montant retournera dans la dette réelle si elle est liée.')) return;

    if (pd.originalDebtId) {
      releaseReserve(pd.originalDebtId, pd.amount);
    }
    deleteProvisionalDebt(pd.id);
  };

  const totalProvisional = provisionalDebts
    .filter(pd => pd.status === 'provisional')
    .reduce((s, pd) => s + pd.amount, 0);

  const kpis = [
    { label: 'Total prévisionnel', value: fmt(totalProvisional, currency), color: '#FB923C' },
    { label: 'En attente', value: String(provisionalDebts.filter(pd => pd.status === 'provisional').length), color: '#FFC107' },
    { label: 'Confirmées', value: String(provisionalDebts.filter(pd => pd.status === 'confirmed').length), color: '#00E676' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#05070D' }}>
      <img
        src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1800&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.07, filter: 'blur(2px)' }}
      />

      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />

      {PARTICLES.map(p => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`
          }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.25), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden mb-10"
          style={{
            background: 'rgba(11,15,26,0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 60px rgba(251,146,60,0.08)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.5), transparent)' }} />

          <div className="px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl" style={{ background: 'rgba(251,146,60,0.15)', filter: 'blur(12px)' }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)' }}>
                  <ClipboardList className="w-7 h-7" style={{ color: '#FB923C' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <motion.div className="w-2 h-2 rounded-full" style={{ background: '#FB923C' }}
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#9AA4B2' }}>Gestion prévisionnelle</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight"
                  style={{ background: 'linear-gradient(90deg, #FB923C, #FFC107, #00E676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Dettes Prévisionnelles
                </h1>
                <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                  Sommes mises de côté avant engagement réel
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#FB923C' }}>
                {settings.vehicleName || 'Véhicule'}
              </div>
              <div className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9AA4B2' }}>
                {provisionalDebts.length} entrée{provisionalDebts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          {kpis.map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl px-6 py-5 flex items-center justify-between"
              style={{
                background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
              <p className="text-sm" style={{ color: '#9AA4B2' }}>{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl px-6 py-5 mb-10"
          style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.18)', backdropFilter: 'blur(16px)' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
            <span style={{ color: '#FB923C', fontWeight: 600 }}>Dette prévisionnelle</span> — une somme mise{' '}
            <span style={{ color: '#F1F5F9', fontWeight: 500 }}>de côté</span> sur une dette réelle. Si vous annulez ou supprimez,
            le montant retourne automatiquement dans la dette réelle liée.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all mb-6"
            style={{ background: 'linear-gradient(135deg, #FB923C, #FFC107)', color: '#000', boxShadow: '0 4px 20px rgba(251,146,60,0.3)' }}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fermer' : 'Nouvelle dette prévisionnelle'}
          </button>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="rounded-3xl p-8"
                  style={{
                    background: 'rgba(11,15,26,0.8)', backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(251,146,60,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                  }}>
                  <h3 className="text-white font-semibold text-lg mb-7">
                    {editingId ? 'Modifier la dette prévisionnelle' : 'Nouvelle dette prévisionnelle'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                    <div className="sm:col-span-2">
                      <label className="block text-sm mb-2" style={{ color: '#9AA4B2' }}>Libellé / Description *</label>
                      <input
                        type="text"
                        value={form.label || ''}
                        onChange={e => setForm({ ...form, label: e.target.value })}
                        placeholder="Ex: Mise de côté, avance réparation..."
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', caretColor: '#FB923C' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#9AA4B2' }}>Montant ({currency}) *</label>
                      <input
                        type="number"
                        value={form.amount || ''}
                        onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', caretColor: '#FB923C' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#9AA4B2' }}>Dette réelle liée (optionnel)</label>
                      <div className="relative">
                        <select
                          value={form.originalDebtId || ''}
                          onChange={e => setForm({ ...form, originalDebtId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none appearance-none"
                          style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <option value="">Aucune</option>
                          {debts.map(d => (
                            <option key={d.id} value={d.id}>{d.supplier} — {d.part}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#64748B' }} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#9AA4B2' }}>Date</label>
                      <input
                        type="date"
                        value={form.dateCreated || ''}
                        onChange={e => setForm({ ...form, dateCreated: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', colorScheme: 'dark' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#9AA4B2' }}>Statut</label>
                      <div className="relative">
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value as ProvisionalDebt['status'] })}
                          className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none appearance-none"
                          style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <option value="provisional">Prévisionnelle</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#64748B' }} />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm mb-2" style={{ color: '#9AA4B2' }}>Notes (optionnel)</label>
                      <textarea
                        value={form.notes || ''}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        rows={2}
                        placeholder="Informations supplémentaires..."
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', caretColor: '#FB923C' }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8 flex-wrap">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all"
                      style={{ background: 'linear-gradient(135deg, #FB923C, #FFC107)', color: '#000' }}
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-5 py-3 rounded-xl text-sm transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#9AA4B2', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
          {provisionalDebts.length === 0 ? (
            <div className="text-center py-20 rounded-3xl" style={{ background: 'rgba(11,15,26,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg font-medium" style={{ color: '#F1F5F9' }}>Aucune dette prévisionnelle</p>
              <p className="text-sm mt-2" style={{ color: '#64748B' }}>Cliquez sur "Nouvelle dette prévisionnelle" pour commencer</p>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(11,15,26,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-sm font-medium" style={{ color: '#9AA4B2' }}>
                  {provisionalDebts.length} dette{provisionalDebts.length !== 1 ? 's' : ''} prévisionnelle{provisionalDebts.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm font-bold" style={{ color: '#FB923C' }}>
                  Total actif : {fmt(totalProvisional, currency)}
                </p>
              </div>

              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {provisionalDebts.map((pd, idx) => {
                  const s = STATUS_COLORS[pd.status];
                  const linkedDebt = pd.originalDebtId ? debts.find(d => d.id === pd.originalDebtId) : null;
                  const isExpanded = expandedId === pd.id;

                  return (
                    <div key={pd.id} style={{ borderBottom: idx < provisionalDebts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div
                        className="flex items-center gap-4 px-7 py-4 cursor-pointer transition-all"
                        style={{ background: isExpanded ? 'rgba(251,146,60,0.04)' : 'transparent' }}
                        onClick={() => setExpandedId(isExpanded ? null : pd.id)}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.text, boxShadow: `0 0 6px ${s.text}` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#F1F5F9' }}>{pd.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{new Date(pd.dateCreated).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                          {STATUS_LABELS[pd.status]}
                        </div>
                        <p className="text-base font-bold flex-shrink-0" style={{ color: '#FB923C' }}>{fmt(pd.amount, currency)}</p>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#64748B' }} />
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="px-7 pb-6 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <p className="text-xs mb-1" style={{ color: '#64748B' }}>Montant</p>
                                  <p className="text-lg font-bold" style={{ color: '#FB923C' }}>{fmt(pd.amount, currency)}</p>
                                </div>
                                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <p className="text-xs mb-1" style={{ color: '#64748B' }}>Date de création</p>
                                  <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                    {new Date(pd.dateCreated).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>

                              {linkedDebt && (
                                <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: '#FFC107' }} />
                                  <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Dette réelle liée</p>
                                    <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{linkedDebt.supplier} — {linkedDebt.part}</p>
                                  </div>
                                </div>
                              )}

                              {pd.notes && (
                                <div className="rounded-xl px-4 py-3 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <p className="text-xs mb-1" style={{ color: '#64748B' }}>Notes</p>
                                  <p className="text-sm" style={{ color: '#CBD5E1' }}>{pd.notes}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-3">
                                {pd.status === 'provisional' && (
                                  <button
                                    onClick={() => moveToConfirmed(pd)}
                                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                                    style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00E676' }}
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" /> Confirmer
                                  </button>
                                )}

                                {pd.status !== 'cancelled' && (
                                  <button
                                    onClick={() => cancelPd(pd)}
                                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                                    style={{ background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.25)', color: '#94A3B8' }}
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Annuler
                                  </button>
                                )}

                                <button
                                  onClick={() => handleEdit(pd)}
                                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                                  style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', color: '#FB923C' }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                                </button>

                                <button
                                  onClick={() => deletePd(pd)}
                                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                                  style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)', color: '#FF3B3B' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}