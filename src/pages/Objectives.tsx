import { useState } from 'react';
import { Plus, Trash2, Save, Edit2, Check, Clock, AlertCircle, Target, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, uid } from '../store/useStore';
import type { Objective } from '../types';

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

const STATUS_STYLES: Record<string, { border: string; glow: string; dot: string; badge: string }> = {
  pending: {
    border: 'rgba(251,191,36,0.2)',
    glow: 'rgba(251,191,36,0.06)',
    dot: '#fbbf24',
    badge: 'rgba(251,191,36,0.12)',
  },
  completed: {
    border: 'rgba(34,197,94,0.2)',
    glow: 'rgba(34,197,94,0.06)',
    dot: '#22c55e',
    badge: 'rgba(34,197,94,0.12)',
  },
  late: {
    border: 'rgba(239,68,68,0.25)',
    glow: 'rgba(239,68,68,0.08)',
    dot: '#ef4444',
    badge: 'rgba(239,68,68,0.12)',
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En cours',
  completed: 'Réalisé ✓',
  late: 'En retard',
};

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 3,
  color: i % 3 === 0 ? '#00E676' : i % 3 === 1 ? '#FFC107' : '#FF3B3B',
}));

export default function ObjectivesPage() {
  const { objectives, addObjective, updateObjective, deleteObjective, settings } = useStore();
  const currency = settings.currency || 'Fr';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Objective>>({
    title: '',
    description: '',
    targetDate: '',
    amount: 0,
    status: 'pending' as const,
    reminderDays: 7,
  });

  const resetForm = () => {
    setForm({ title: '', description: '', targetDate: '', amount: 0, status: 'pending' as const, reminderDays: 7 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (o: Objective) => {
    setForm({ ...o });
    setEditingId(o.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const handleSave = () => {
    if (!form.title || !form.targetDate) return alert('Remplissez le titre et la date cible.');
    const obj: Objective = {
      id: editingId || uid(),
      title: form.title!,
      description: form.description || '',
      targetDate: form.targetDate!,
      amount: Number(form.amount) || undefined,
      status: form.status || 'pending',
      reminderDays: Number(form.reminderDays) || 7,
    };
    if (editingId) {
      updateObjective(editingId, obj);
    } else {
      addObjective(obj);
    }
    resetForm();
  };

  const getDiffDays = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  };

  const pending = objectives.filter(o => o.status === 'pending');
  const late = objectives.filter(o => o.status === 'late');
  const done = objectives.filter(o => o.status === 'completed');
  const sorted = [...late, ...pending, ...done];

  return (
    <div className="relative min-h-screen" style={{ background: '#05070D' }}>

      {/* Image de fond */}
      <img
        src="https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=1600&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.07, filter: 'blur(2px)' }}
      />

      {/* Halos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 600, height: 600, top: '-10%', left: '20%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, bottom: '10%', right: '10%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 400, height: 400, top: '40%', left: '-5%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />

        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />

        {/* Particules */}
        {PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Scan line violette */}
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-10">

        {/* HERO */}
        <motion.div
          className="relative rounded-3xl overflow-hidden mb-10"
          style={{
            background: 'rgba(11,15,26,0.75)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Icône */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6), rgba(251,191,36,0.3))' }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <Target className="w-8 h-8" style={{ color: '#a78bfa' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <motion.span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: late.length > 0 ? '#ef4444' : '#00E676',
                        boxShadow: `0 0 10px ${late.length > 0 ? '#ef4444' : '#00E676'}`,
                      }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs tracking-widest uppercase" style={{ color: '#9AA4B2' }}>
                      {late.length > 0 ? `${late.length} objectif(s) en retard` : 'Tous les objectifs à jour'}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #a78bfa 0%, #fbbf24 50%, #00E676 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                    Objectifs
                  </h1>
                  <p className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                    Suivi et gestion de vos objectifs · {settings.vehicleName || 'Véhicule'}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl text-center"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>{pending.length}</p>
                  <p className="text-xs" style={{ color: '#9AA4B2' }}>En cours</p>
                </div>
                <div className="px-4 py-2 rounded-xl text-center"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-xl font-bold text-red-400">{late.length}</p>
                  <p className="text-xs" style={{ color: '#9AA4B2' }}>En retard</p>
                </div>
                <div className="px-4 py-2 rounded-xl text-center"
                  style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)' }}>
                  <p className="text-xl font-bold" style={{ color: '#00E676' }}>{done.length}</p>
                  <p className="text-xs" style={{ color: '#9AA4B2' }}>Réalisés</p>
                </div>
              </div>
            </div>
          </div>
          {/* Barre Congo */}
          <div className="h-[3px]" style={{
            background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)',
          }} />
        </motion.div>

        {/* BOUTON + FORMULAIRE */}
        <div className="mb-8">
          <motion.button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-2xl transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(251,191,36,0.7))',
              boxShadow: '0 8px 30px rgba(139,92,246,0.25)',
              color: '#fff',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-4 h-4" />
            Nouvel objectif
          </motion.button>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden mt-5"
              >
                <div className="rounded-3xl p-7 md:p-9"
                  style={{
                    background: 'rgba(11,15,26,0.75)',
                    backdropFilter: 'blur(28px)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  }}>
                  <h3 className="text-white font-semibold text-lg mb-6">
                    {editingId ? 'Modifier l\'objectif' : 'Nouvel objectif'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Titre *</label>
                      <input
                        type="text"
                        value={form.title || ''}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Ex: Acheter un nouveau pneu, Révision moteur..."
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                        style={{
                          background: '#0F1625',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                        onFocus={e => e.currentTarget.style.border = '1px solid rgba(139,92,246,0.5)'}
                        onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Description</label>
                      <textarea
                        value={form.description || ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={2}
                        placeholder="Détails supplémentaires..."
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all resize-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Date cible *</label>
                      <input
                        type="date"
                        value={form.targetDate || ''}
                        onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Budget estimé ({currency})</label>
                      <input
                        type="number"
                        value={form.amount || ''}
                        onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Rappel avant (jours)</label>
                      <input
                        type="number"
                        value={form.reminderDays || 7}
                        onChange={(e) => setForm({ ...form, reminderDays: Number(e.target.value) })}
                        min={1} max={30}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: '#9AA4B2' }}>Statut</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as Objective['status'] })}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none"
                        style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <option value="pending">En cours</option>
                        <option value="done">Réalisé</option>
                        <option value="late">En retard</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-7">
                    <motion.button
                      onClick={handleSave}
                      className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-white"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(251,191,36,0.7))' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Mettre à jour' : 'Enregistrer'}
                    </motion.button>
                    <button
                      onClick={resetForm}
                      className="px-5 py-3 rounded-xl text-sm transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#9AA4B2' }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LISTE */}
        {sorted.length === 0 ? (
          <motion.div
            className="text-center py-20 rounded-3xl"
            style={{ background: 'rgba(11,15,26,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <Target className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(139,92,246,0.4)' }} />
            <p className="text-lg font-semibold text-white mb-1">Aucun objectif défini</p>
            <p className="text-sm" style={{ color: '#9AA4B2' }}>Créez votre premier objectif pour commencer le suivi</p>
          </motion.div>
        ) : (
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(11,15,26,0.7)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.06)',
              maxHeight: '560px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139,92,246,0.3) transparent',
            }}
          >
            {sorted.map((o, index) => {
              const diff = getDiffDays(o.targetDate);
              const s = STATUS_STYLES[o.status];
              const isExpanded = expandedId === o.id;

              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    borderBottom: index < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isExpanded ? s.glow : 'transparent',
                    transition: 'background 0.3s ease',
                  }}
                >
                  {/* Ligne compacte */}
                  <button
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  >
                    {/* Point statut */}
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }}
                      animate={{ scale: o.status === 'late' ? ([1, 1.3, 1] as number[]) : 1 }}
                      transition={{ duration: 1.5, repeat: o.status === 'late' ? Infinity : 0 }}
                    />

                    {/* Titre */}
                    <span className="text-white font-medium text-sm flex-1 truncate">{o.title}</span>

                    {/* Badge statut */}
                    <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                      style={{ background: s.badge, color: s.dot }}>
                      {STATUS_LABELS[o.status]}
                    </span>

                    {/* Jours */}
                    {o.status !== 'completed' && (
                      <span className="text-xs flex-shrink-0 hidden sm:flex items-center gap-1"
                        style={{ color: diff < 0 ? '#ef4444' : diff <= 7 ? '#fbbf24' : '#9AA4B2' }}>
                        <Clock className="w-3 h-3" />
                        {diff < 0 ? `${Math.abs(diff)}j retard` : `${diff}j`}
                      </span>
                    )}

                    {/* Budget */}
                    {o.amount && (
                      <span className="text-xs font-semibold flex-shrink-0 hidden md:block" style={{ color: '#a78bfa' }}>
                        {fmt(o.amount, currency)}
                      </span>
                    )}

                    {/* Flèche */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-4 h-4" style={{ color: '#9AA4B2' }} />
                    </motion.div>
                  </button>

                  {/* Détails expandés */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 space-y-4"
                          style={{ borderTop: `1px solid ${s.border}` }}>

                          {/* Description */}
                          {o.description && (
                            <p className="text-sm" style={{ color: '#9AA4B2' }}>{o.description}</p>
                          )}

                          {/* Infos */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-xl px-4 py-3"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Date cible</p>
                              <p className="text-white text-sm font-medium">
                                {new Date(o.targetDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            {o.amount && (
                              <div className="rounded-xl px-4 py-3"
                                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                                <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Budget</p>
                                <p className="text-sm font-bold" style={{ color: '#a78bfa' }}>{fmt(o.amount, currency)}</p>
                              </div>
                            )}
                            {o.status !== 'completed' && (
                              <div className="rounded-xl px-4 py-3"
                                style={{
                                  background: diff < 0 ? 'rgba(239,68,68,0.06)' : 'rgba(251,191,36,0.06)',
                                  border: `1px solid ${diff < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)'}`,
                                }}>
                                <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Délai</p>
                                <p className="text-sm font-bold flex items-center gap-1"
                                  style={{ color: diff < 0 ? '#ef4444' : '#fbbf24' }}>
                                  <AlertCircle className="w-3 h-3" />
                                  {diff < 0 ? `${Math.abs(diff)}j de retard` : `Dans ${diff}j`}
                                </p>
                              </div>
                            )}
                            <div className="rounded-xl px-4 py-3"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>Rappel</p>
                              <p className="text-white text-sm font-medium">{o.reminderDays || 7} jours avant</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            {o.status !== 'completed' && (
                              <motion.button
                                onClick={() => updateObjective(o.id, { status: 'completed' })}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: 'rgba(0,230,118,0.1)', color: '#00E676', border: '1px solid rgba(0,230,118,0.2)' }}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              >
                                <Check className="w-3.5 h-3.5" /> Marquer réalisé
                              </motion.button>
                            )}
                            <motion.button
                              onClick={() => handleEdit(o)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
                              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Modifier
                            </motion.button>
                            <motion.button
                              onClick={() => deleteObjective(o.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Supprimer
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
