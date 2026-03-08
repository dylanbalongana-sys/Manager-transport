import { useState } from 'react';
import { Plus, Trash2, Save, Zap, ZapOff, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, uid } from '../store/useStore';
import type { Automation as AutomationTask } from '../types';

export const EXPENSE_CATEGORIES = [
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
  { label: 'Autre charge', value: 'autre' },
];

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
};

const FREQ_COLORS: Record<string, string> = {
  daily: '#00E676',
  weekly: '#FFC107',
  monthly: '#a78bfa',
};

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 3,
  color: ['#00E676', '#FFC107', '#FF3B3B'][i % 3],
}));

export default function Automation() {
  const { automations, addAutomation, updateAutomation, deleteAutomation, toggleAutomation, settings } = useStore();
  const currency = settings.currency || 'Fr';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AutomationTask>>({
    category: 'carburant',
    amount: 0,
    liters: 0,
    frequency: 'daily',
    isActive: true,
    comment: '',
  });

  const resetForm = () => {
    setForm({ category: 'carburant', amount: 0, liters: 0, frequency: 'daily', isActive: true, comment: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (task: AutomationTask) => {
    setForm({ ...task });
    setEditingId(task.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const handleSave = () => {
    if (!form.amount) return alert('Renseignez le montant.');
    const catLabel = EXPENSE_CATEGORIES.find(c => c.value === form.category)?.label || 'Charge';
    const task: AutomationTask = {
      id: editingId || uid(),
      name: catLabel,
      category: form.category || 'autre',
      amount: Number(form.amount) || 0,
      liters: Number(form.liters) || undefined,
      frequency: form.frequency || 'daily',
      isActive: form.isActive ?? true,
      comment: form.comment || '',
    };
    if (editingId) {
      updateAutomation(editingId, task);
    } else {
      addAutomation(task);
    }
    resetForm();
  };

  const selectedCat = EXPENSE_CATEGORIES.find((c) => c.value === form.category);
  const activeCount = automations.filter(a => a.isActive).length;
  const dailyCost = automations.filter(a => a.isActive && a.frequency === 'daily').reduce((s, a) => s + a.amount, 0);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#05070D' }}>

      {/* Image de fond — technologie / digital */}
      <img
        src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80"
        alt=""
        aria-hidden
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.07, filter: 'blur(2px)', pointerEvents: 'none',
        }}
      />

      {/* Halos tech */}
      <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '30%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Grid techno */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
        backgroundImage: 'linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />

      {/* Scan line bleue */}
      <motion.div
        style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)', pointerEvents: 'none', zIndex: 1 }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      />

      {/* Particules Congo */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.color, pointerEvents: 'none', zIndex: 1,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Contenu principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-16">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl mb-10 overflow-hidden"
          style={{
            background: 'rgba(11,15,26,0.75)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Shimmer */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent)' }} />

          <div className="px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Icône Zap avec halo */}
              <div className="relative flex-shrink-0">
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.25) 0%, transparent 70%)', filter: 'blur(10px)' }} />
                <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(6px)' }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)' }}>
                  <Zap className="w-7 h-7" style={{ color: '#00B4FF' }} />
                </div>
              </div>

              <div>
                <h1 className="font-extrabold text-4xl md:text-5xl tracking-tight"
                  style={{ background: 'linear-gradient(135deg, #00B4FF 0%, #60a5fa 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Automatisation
                </h1>
                <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                  Charges récurrentes · automatisées · intelligentes
                </p>
                {/* Statut live */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeCount > 0 ? '#00E676' : '#9AA4B2', boxShadow: activeCount > 0 ? '0 0 8px #00E676' : 'none' }} />
                  <span className="text-xs" style={{ color: '#9AA4B2' }}>
                    {activeCount > 0 ? `${activeCount} tâche${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}` : 'Aucune tâche active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges véhicule */}
            <div className="flex flex-col gap-2 items-start sm:items-end">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.15)', color: '#60a5fa' }}>
                <Zap className="w-3.5 h-3.5" />
                {settings.vehicleName || 'Véhicule'}
              </div>
              <div className="px-3 py-1 rounded-lg text-xs font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9AA4B2' }}>
                {settings.vehiclePlate || 'BZV-000-A'}
              </div>
            </div>
          </div>

          {/* Barre Congo */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)' }} />
        </motion.div>

        {/* ── KPI COMPACTS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-5 mb-10"
        >
          {[
            { label: 'Tâches actives', value: activeCount, color: '#00B4FF', bg: 'rgba(0,180,255,0.08)', border: 'rgba(0,180,255,0.15)' },
            { label: 'Tâches inactives', value: automations.filter(a => !a.isActive).length, color: '#9AA4B2', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.12)' },
            { label: 'Coût journalier', value: fmt(dailyCost, currency), color: '#FFC107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.15)' },
          ].map((k, i) => (
            <div key={i} className="rounded-2xl px-5 py-4"
              style={{ background: k.bg, border: `1px solid ${k.border}`, backdropFilter: 'blur(20px)' }}>
              <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>{k.label}</p>
              <p className="font-bold text-xl" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </motion.div>

        {/* ── BOUTON + FORMULAIRE ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-2xl transition-all duration-200"
            style={{
              background: showForm ? 'rgba(0,180,255,0.08)' : 'linear-gradient(135deg, #0077cc, #00B4FF)',
              border: showForm ? '1px solid rgba(0,180,255,0.2)' : 'none',
              color: '#fff',
              boxShadow: showForm ? 'none' : '0 8px 24px rgba(0,180,255,0.25)',
            }}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fermer' : 'Nouvelle automatisation'}
          </button>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-5 rounded-3xl p-7"
                  style={{
                    background: 'rgba(11,15,26,0.8)',
                    backdropFilter: 'blur(28px)',
                    border: '1px solid rgba(0,180,255,0.12)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  }}>
                  <p className="text-white font-semibold mb-6">{editingId ? 'Modifier la tâche' : 'Nouvelle tâche automatisée'}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Catégorie */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-2" style={{ color: '#9AA4B2' }}>Catégorie *</label>
                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none transition-all"
                          style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)', color: '#F5F7FA' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,180,255,0.4)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value} style={{ background: '#0F1625' }}>{c.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9AA4B2' }} />
                      </div>
                      {/* Champ libre si "Autre" sélectionné */}
                      <AnimatePresence>
                        {form.category === 'autre' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <input
                              type="text"
                              value={form.comment || ''}
                              onChange={(e) => setForm({ ...form, comment: e.target.value })}
                              placeholder="Précisez la charge automatisée..."
                              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all mt-2"
                              style={{ background: '#0F1625', border: '1px solid rgba(255,193,7,0.25)', color: '#F5F7FA' }}
                              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,193,7,0.5)'}
                              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,193,7,0.25)'}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Fréquence */}
                    <div>
                      <label className="block text-xs mb-2" style={{ color: '#9AA4B2' }}>Fréquence</label>
                      <div className="relative">
                        <select
                          value={form.frequency}
                          onChange={(e) => setForm({ ...form, frequency: e.target.value as AutomationTask['frequency'] })}
                          className="w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none transition-all"
                          style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)', color: '#F5F7FA' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,180,255,0.4)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                        >
                          <option value="daily" style={{ background: '#0F1625' }}>Quotidien</option>
                          <option value="weekly" style={{ background: '#0F1625' }}>Hebdomadaire</option>
                          <option value="monthly" style={{ background: '#0F1625' }}>Mensuel</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9AA4B2' }} />
                      </div>
                    </div>

                    {/* Montant */}
                    <div>
                      <label className="block text-xs mb-2" style={{ color: '#9AA4B2' }}>Montant ({currency}) *</label>
                      <input
                        type="number"
                        value={form.amount || ''}
                        onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)', color: '#F5F7FA' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,180,255,0.4)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                      />
                    </div>

                    {/* Litres si applicable */}
                    {selectedCat?.hasLiters && (
                      <div>
                        <label className="block text-xs mb-2" style={{ color: '#9AA4B2' }}>Litres (optionnel)</label>
                        <input
                          type="number"
                          value={form.liters || ''}
                          onChange={(e) => setForm({ ...form, liters: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                          style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)', color: '#F5F7FA' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,180,255,0.4)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                        />
                      </div>
                    )}

                    {/* Commentaire */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-2" style={{ color: '#9AA4B2' }}>Commentaire (optionnel)</label>
                      <input
                        type="text"
                        value={form.comment || ''}
                        onChange={(e) => setForm({ ...form, comment: e.target.value })}
                        placeholder="Ex: Carburant trajet Bacongo → Centre-ville..."
                        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)', color: '#F5F7FA' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,180,255,0.4)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                      />
                    </div>
                  </div>

                  {/* Aperçu */}
                  <div className="mt-5 rounded-xl px-5 py-4"
                    style={{ background: 'rgba(0,180,255,0.04)', border: '1px solid rgba(0,180,255,0.1)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#00B4FF' }}>Aperçu</p>
                    <p className="text-white font-medium text-sm">
                      {EXPENSE_CATEGORIES.find(c => c.value === form.category)?.label || 'Charge'} — {FREQ_LABELS[form.frequency || 'daily']}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9AA4B2' }}>
                      {fmt(Number(form.amount) || 0, currency)}{form.liters ? ` · ${form.liters}L` : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button onClick={handleSave}
                      className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all"
                      style={{ background: 'linear-gradient(135deg, #0077cc, #00B4FF)', color: '#fff', boxShadow: '0 4px 16px rgba(0,180,255,0.25)' }}>
                      <Save className="w-4 h-4" />
                      {editingId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                    <button onClick={resetForm}
                      className="px-5 py-3 rounded-xl text-sm transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9AA4B2' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── LISTE DES TÂCHES ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {automations.length === 0 ? (
            <div className="rounded-3xl p-16 text-center"
              style={{ background: 'rgba(11,15,26,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.12)' }}>
                <Zap className="w-8 h-8" style={{ color: '#00B4FF', opacity: 0.4 }} />
              </div>
              <p className="font-semibold text-lg" style={{ color: '#F5F7FA' }}>Aucune tâche automatisée</p>
              <p className="text-sm mt-2" style={{ color: '#9AA4B2' }}>
                Créez une automatisation pour ne plus saisir les charges répétitives
              </p>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(11,15,26,0.7)',
                backdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}>
              {/* Séparateur lumineux en haut */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)' }} />

              <div style={{ maxHeight: 520, overflowY: 'auto' }}
                className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-900/40">
                {automations.map((task, idx) => {
                  const isExpanded = expandedId === task.id;
                  const freqColor = FREQ_COLORS[task.frequency] || '#9AA4B2';
                  const catLabel = EXPENSE_CATEGORIES.find(c => c.value === task.category)?.label || task.name;

                  return (
                    <div key={task.id}>
                      {idx > 0 && (
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 24px' }} />
                      )}

                      {/* Ligne compacte */}
                      <div
                        className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200"
                        style={{ background: isExpanded ? 'rgba(0,180,255,0.04)' : 'transparent' }}
                        onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      >
                        {/* Icône avec statut */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: task.isActive ? 'rgba(0,180,255,0.1)' : 'rgba(148,163,184,0.06)',
                              border: `1px solid ${task.isActive ? 'rgba(0,180,255,0.2)' : 'rgba(148,163,184,0.1)'}`,
                            }}>
                            <Zap className="w-4 h-4" style={{ color: task.isActive ? '#00B4FF' : '#9AA4B2' }} />
                          </div>
                          {/* Point actif */}
                          {task.isActive && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                              style={{ background: '#00E676', boxShadow: '0 0 6px #00E676' }} />
                          )}
                        </div>

                        {/* Nom + badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate" style={{ color: '#F5F7FA' }}>{catLabel}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{ background: `${freqColor}15`, color: freqColor, border: `1px solid ${freqColor}30` }}>
                              {FREQ_LABELS[task.frequency]}
                            </span>
                            {!task.isActive && (
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: 'rgba(148,163,184,0.08)', color: '#9AA4B2', border: '1px solid rgba(148,163,184,0.12)' }}>
                                Inactif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Montant */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-base" style={{ color: task.isActive ? '#00B4FF' : '#9AA4B2' }}>
                            {fmt(task.amount, currency)}
                          </p>
                        </div>

                        {/* Flèche */}
                        <div className="flex-shrink-0 ml-1" style={{ color: '#9AA4B2' }}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="px-6 pb-5 pt-1">
                              <div className="rounded-2xl p-5"
                                style={{ background: 'rgba(0,180,255,0.04)', border: '1px solid rgba(0,180,255,0.08)' }}>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Catégorie</p>
                                    <p className="text-sm font-medium" style={{ color: '#F5F7FA' }}>{catLabel}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Fréquence</p>
                                    <p className="text-sm font-medium" style={{ color: freqColor }}>{FREQ_LABELS[task.frequency]}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Montant</p>
                                    <p className="text-sm font-bold" style={{ color: '#00B4FF' }}>{fmt(task.amount, currency)}</p>
                                  </div>
                                  {task.liters && (
                                    <div>
                                      <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Litres</p>
                                      <p className="text-sm font-medium" style={{ color: '#F5F7FA' }}>{task.liters}L</p>
                                    </div>
                                  )}
                                  {task.comment && (
                                    <div className="col-span-2">
                                      <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Commentaire</p>
                                      <p className="text-sm" style={{ color: '#F5F7FA' }}>{task.comment}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-3"
                                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                  {/* Toggle actif/inactif */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleAutomation(task.id); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                      background: task.isActive ? 'rgba(148,163,184,0.08)' : 'rgba(0,180,255,0.1)',
                                      border: task.isActive ? '1px solid rgba(148,163,184,0.15)' : '1px solid rgba(0,180,255,0.2)',
                                      color: task.isActive ? '#9AA4B2' : '#00B4FF',
                                    }}>
                                    {task.isActive ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                    {task.isActive ? 'Désactiver' : 'Activer'}
                                  </button>

                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                    style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.15)', color: '#FFC107' }}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Modifier
                                  </button>

                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteAutomation(task.id); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                    style={{ background: 'rgba(255,59,59,0.06)', border: '1px solid rgba(255,59,59,0.12)', color: '#FF3B3B' }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Séparateur lumineux en bas */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)' }} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
