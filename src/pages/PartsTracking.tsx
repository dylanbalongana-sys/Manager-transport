import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ChevronDown, AlertTriangle, CheckCircle, Clock, Wrench, Package, BarChart2 } from 'lucide-react';
import { useStore, uid } from '../store/useStore';

// ── Helpers ──────────────────────────────────────────────────────────────────
function toDaysMonths(days: number): string {
  const m = Math.floor(days / 30);
  const d = days % 30;
  if (m === 0) return `${d} j`;
  if (d === 0) return `${m} mois`;
  return `${m} mois ${d} j`;
}

// ── Types locaux ──────────────────────────────────────────────────────────────
interface PartCycle { id: string; buyDate: string; degradeDate: string; }
interface StudyPart { id: string; name: string; cycles: PartCycle[]; }
interface KnownPart { id: string; name: string; lifeDays: number; installDate: string; source: 'manual' | 'study'; }

// ── Jauge circulaire ──────────────────────────────────────────────────────────
function CircularGauge({ pct, color, size = 100 }: { pct: number; color: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size * 0.18} fontWeight="bold" fill="white">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Accordion section ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, children, defaultOpen = false }:
  { title: string; icon: React.ElementType; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'rgba(26,18,8,0.92)', border: `1px solid rgba(184,115,51,0.18)`, borderRadius: 20, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-7 py-5"
        style={{ borderBottom: open ? '1px solid rgba(184,115,51,0.12)' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <div style={{ background: `${color}22`, borderRadius: 12, padding: 8 }}>
            <Icon style={{ color, width: 20, height: 20 }} />
          </div>
          <span className="text-white font-bold text-base tracking-wide">{title}</span>
        </div>
        <ChevronDown
          className="text-amber-600 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', width: 20, height: 20 }}
        />
      </button>
      <div style={{
        maxHeight: open ? '3000px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.45s ease',
      }}>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function PartsTracking() {
  const { dailyEntries } = useStore();

  // Jours travaillés total
  const workedDays = dailyEntries.filter(e => (e.dayType || 'normal') === 'normal').length;

  // ── État études ──
  const [studies, setStudies] = useState<StudyPart[]>([
    { id: uid(), name: 'Pneu avant gauche', cycles: [
      { id: uid(), buyDate: '2024-10-01', degradeDate: '2025-01-02' },
    ]},
  ]);
  const [newStudyName, setNewStudyName] = useState('');
  const [addingCycle, setAddingCycle] = useState<string | null>(null);
  const [cycleForm, setCycleForm] = useState({ buyDate: '', degradeDate: '' });

  // ── État données manuelles ──
  const [knownParts, setKnownParts] = useState<KnownPart[]>([
    { id: uid(), name: 'Pneu avant gauche', lifeDays: 90, installDate: '2025-01-02', source: 'manual' },
  ]);
  const [showKnownForm, setShowKnownForm] = useState(false);
  const [knownForm, setKnownForm] = useState({ name: '', lifeDays: '', installDate: '' });

  // ── Calcul moyenne depuis études ──
  function studyAvg(study: StudyPart): number | null {
    const durations = study.cycles
      .filter(c => c.buyDate && c.degradeDate)
      .map(c => Math.max(0, Math.round((new Date(c.degradeDate).getTime() - new Date(c.buyDate).getTime()) / 86400000)));
    if (durations.length === 0) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  // ── Toutes les données (études + manuelles) ──
  const allData: (KnownPart & { avgDays?: number })[] = [
    ...knownParts.map(k => ({ ...k })),
    ...studies
      .filter(s => studyAvg(s) !== null)
      .filter(s => !knownParts.find(k => k.name.toLowerCase() === s.name.toLowerCase()))
      .map(s => ({
        id: s.id, name: s.name,
        lifeDays: studyAvg(s)!,
        installDate: s.cycles[s.cycles.length - 1]?.degradeDate || '',
        source: 'study' as const,
      })),
  ];

  // ── Amortissement ──
  function getAmortissement(part: KnownPart) {
    if (!part.installDate || part.lifeDays <= 0) return null;
    const install = new Date(part.installDate);
    const today = new Date();
    const calDays = Math.round((today.getTime() - install.getTime()) / 86400000);
    // jours travaillés depuis installation
    const workedSince = dailyEntries.filter(e =>
      (e.dayType || 'normal') === 'normal' && e.date >= part.installDate
    ).length;
    const used = Math.min(workedSince, part.lifeDays);
    const pct = (used / part.lifeDays) * 100;
    const remaining = Math.max(0, part.lifeDays - used);
    return { pct, used, remaining, calDays };
  }

  // Couleur jauge
  function gaugeColor(pct: number) {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F59E0B';
    return '#B87333';
  }

  return (
    <div className="relative min-h-screen" style={{ background: '#0D0A06' }}>

      {/* Fond image mécanique */}
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=60"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.05, filter: 'blur(2px) sepia(0.5)' }}
      />

      {/* Halos cuivre */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,115,51,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Particules */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              left: `${(i * 7 + 5) % 95}%`,
              top: `${(i * 11 + 8) % 88}%`,
              background: ['#B87333','#F59E0B','#EF4444','#D97706'][i % 4],
              boxShadow: `0 0 8px 2px ${['#B87333','#F59E0B','#EF4444','#D97706'][i % 4]}88`,
            }}
            animate={{ y: [0, -14, 0], opacity: [0.3, 0.9, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-16 space-y-8">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'rgba(26,18,8,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(184,115,51,0.25)',
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <div className="px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{ background: 'rgba(184,115,51,0.15)', borderRadius: 12, padding: 10 }}
                >
                  <Wrench style={{ color: '#B87333', width: 24, height: 24 }} />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#B87333', boxShadow: '0 0 10px #B87333' }}
                    />
                    <span style={{ color: '#B87333', fontSize: 11, fontWeight: 600, letterSpacing: 2 }}>SYSTÈME ACTIF</span>
                  </div>
                </div>
              </div>
              <h1 style={{
                fontSize: 36, fontWeight: 900, letterSpacing: -1,
                background: 'linear-gradient(90deg, #B87333, #F59E0B, #EF4444)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Suivi des Pièces
              </h1>
              <p style={{ color: '#9AA4B2', fontSize: 14, marginTop: 4 }}>
                Tableau de bord mécanique — Durée de vie & Amortissement
              </p>
            </div>

            {/* Stats rapides */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Études', value: studies.length, color: '#B87333' },
                { label: 'Pièces suivies', value: allData.length, color: '#F59E0B' },
                { label: 'Jours travaillés', value: workedDays, color: '#EF4444' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '12px 20px', textAlign: 'center', minWidth: 90,
                }}>
                  <p style={{ color: s.color, fontSize: 24, fontWeight: 800 }}>{s.value}</p>
                  <p style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Barre cuivre */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #B87333, #F59E0B, #EF4444)' }} />
        </motion.div>

        {/* ── SECTION 1 : ÉTUDES ── */}
        <Section title="Études — Construire la moyenne" icon={BarChart2} color="#B87333">
          <div className="space-y-6">

            {/* Ajouter une pièce à étudier */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newStudyName}
                onChange={e => setNewStudyName(e.target.value)}
                placeholder="Nom de la pièce à étudier (ex: Pneu avant...)"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,115,51,0.2)',
                  borderRadius: 12, padding: '10px 16px', color: 'white', fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  if (!newStudyName.trim()) return;
                  setStudies(s => [...s, { id: uid(), name: newStudyName.trim(), cycles: [] }]);
                  setNewStudyName('');
                }}
                style={{
                  background: 'linear-gradient(135deg, #B87333, #F59E0B)',
                  borderRadius: 12, padding: '10px 20px', color: 'white', fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus style={{ width: 16, height: 16 }} /> Ajouter
              </button>
            </div>

            {/* Liste des études */}
            {studies.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '32px 0' }}>
                <Package style={{ width: 40, height: 40, margin: '0 auto 12px', color: '#374151' }} />
                <p>Aucune pièce à étudier — ajoutez-en une ci-dessus</p>
              </div>
            )}

            {studies.map(study => {
              const avg = studyAvg(study);
              return (
                <div key={study.id} style={{
                  background: 'rgba(184,115,51,0.04)', border: '1px solid rgba(184,115,51,0.15)',
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  {/* Header pièce */}
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(184,115,51,0.1)' }}>
                    <div className="flex items-center gap-3">
                      <Wrench style={{ color: '#B87333', width: 18, height: 18 }} />
                      <span className="text-white font-bold">{study.name}</span>
                      {avg !== null && (
                        <span style={{
                          background: 'rgba(184,115,51,0.2)', color: '#F59E0B',
                          borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 600,
                        }}>
                          Moy: {toDaysMonths(avg)} ({avg} j)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAddingCycle(study.id); setCycleForm({ buyDate: '', degradeDate: '' }); }}
                        style={{
                          background: 'rgba(184,115,51,0.15)', color: '#F59E0B',
                          borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <Plus style={{ width: 12, height: 12 }} /> Cycle
                      </button>
                      <button
                        onClick={() => setStudies(s => s.filter(x => x.id !== study.id))}
                        style={{ color: '#6B7280', padding: 6, borderRadius: 8 }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>

                  {/* Formulaire cycle */}
                  <AnimatePresence>
                    {addingCycle === study.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderBottom: '1px solid rgba(184,115,51,0.1)' }}
                      >
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label style={{ color: '#9AA4B2', fontSize: 11, display: 'block', marginBottom: 6 }}>Date d'achat</label>
                            <input type="date" value={cycleForm.buyDate}
                              onChange={e => setCycleForm(f => ({ ...f, buyDate: e.target.value }))}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(184,115,51,0.2)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ color: '#9AA4B2', fontSize: 11, display: 'block', marginBottom: 6 }}>Date de dégradation</label>
                            <input type="date" value={cycleForm.degradeDate}
                              onChange={e => setCycleForm(f => ({ ...f, degradeDate: e.target.value }))}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(184,115,51,0.2)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none' }}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => {
                                if (!cycleForm.buyDate || !cycleForm.degradeDate) return;
                                setStudies(s => s.map(x => x.id === study.id
                                  ? { ...x, cycles: [...x.cycles, { id: uid(), ...cycleForm }] }
                                  : x
                                ));
                                setAddingCycle(null);
                              }}
                              style={{ flex: 1, background: 'linear-gradient(135deg, #B87333, #F59E0B)', borderRadius: 10, padding: '9px 0', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                            >
                              <Save style={{ width: 14, height: 14 }} /> Sauver
                            </button>
                            <button onClick={() => setAddingCycle(null)} style={{ color: '#6B7280', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13 }}>✕</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cycles */}
                  <div className="px-6 py-3 space-y-2">
                    {study.cycles.length === 0 && (
                      <p style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic' }}>Aucun cycle enregistré — cliquez sur "+ Cycle"</p>
                    )}
                    {study.cycles.map((c, i) => {
                      const dur = c.buyDate && c.degradeDate
                        ? Math.round((new Date(c.degradeDate).getTime() - new Date(c.buyDate).getTime()) / 86400000)
                        : null;
                      return (
                        <div key={c.id} className="flex items-center justify-between" style={{
                          background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 14px',
                        }}>
                          <div className="flex items-center gap-4">
                            <span style={{ color: '#B87333', fontSize: 11, fontWeight: 700 }}>#{i + 1}</span>
                            <div className="flex gap-3 text-xs" style={{ color: '#9AA4B2' }}>
                              <span>Achat: <span style={{ color: 'white' }}>{new Date(c.buyDate + 'T12:00:00').toLocaleDateString('fr-FR')}</span></span>
                              <span>→</span>
                              <span>Dégradation: <span style={{ color: 'white' }}>{new Date(c.degradeDate + 'T12:00:00').toLocaleDateString('fr-FR')}</span></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {dur !== null && (
                              <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12 }}>
                                {toDaysMonths(dur)} ({dur} j)
                              </span>
                            )}
                            <button onClick={() => setStudies(s => s.map(x => x.id === study.id
                              ? { ...x, cycles: x.cycles.filter(cc => cc.id !== c.id) }
                              : x
                            ))}>
                              <Trash2 style={{ width: 13, height: 13, color: '#6B7280' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── SECTION 2 : DONNÉES ── */}
        <Section title="Données — Durées de vie connues & calculées" icon={Package} color="#F59E0B">
          <div className="space-y-5">
            {/* Bouton ajouter manuel */}
            <button
              onClick={() => setShowKnownForm(f => !f)}
              style={{
                background: 'linear-gradient(135deg, #B87333, #F59E0B)',
                borderRadius: 12, padding: '10px 20px', color: 'white', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus style={{ width: 16, height: 16 }} /> Ajouter une donnée connue
            </button>

            <AnimatePresence>
              {showKnownForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 16, padding: 24,
                  }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
                      {[
                        { label: 'Nom de la pièce', key: 'name', type: 'text', placeholder: 'Ex: Pneu avant...' },
                        { label: 'Durée de vie (jours)', key: 'lifeDays', type: 'number', placeholder: '90' },
                        { label: "Date d'installation", key: 'installDate', type: 'date', placeholder: '' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ color: '#9AA4B2', fontSize: 11, display: 'block', marginBottom: 6 }}>{f.label}</label>
                          <input
                            type={f.type}
                            placeholder={f.placeholder}
                            value={(knownForm as any)[f.key]}
                            onChange={e => setKnownForm(kf => ({ ...kf, [f.key]: e.target.value }))}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '9px 14px', color: 'white', fontSize: 13, outline: 'none' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (!knownForm.name || !knownForm.lifeDays) return;
                          setKnownParts(k => [...k, { id: uid(), name: knownForm.name, lifeDays: Number(knownForm.lifeDays), installDate: knownForm.installDate, source: 'manual' }]);
                          setKnownForm({ name: '', lifeDays: '', installDate: '' });
                          setShowKnownForm(false);
                        }}
                        style={{ background: 'linear-gradient(135deg, #B87333, #F59E0B)', borderRadius: 10, padding: '9px 20px', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Save style={{ width: 14, height: 14 }} /> Enregistrer
                      </button>
                      <button onClick={() => setShowKnownForm(false)} style={{ color: '#6B7280', padding: '9px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13 }}>Annuler</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tableau des données */}
            {allData.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '32px 0' }}>
                <BarChart2 style={{ width: 40, height: 40, margin: '0 auto 12px', color: '#374151' }} />
                <p>Aucune donnée — ajoutez des données manuelles ou des études</p>
              </div>
            ) : (
              <div style={{ border: '1px solid rgba(184,115,51,0.15)', borderRadius: 16, overflow: 'hidden' }}>
                {/* En-tête tableau */}
                <div className="grid grid-cols-4 px-6 py-3" style={{ background: 'rgba(184,115,51,0.08)', borderBottom: '1px solid rgba(184,115,51,0.1)' }}>
                  {['Pièce', 'Source', 'Durée de vie', 'Installation'].map(h => (
                    <span key={h} style={{ color: '#B87333', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{h.toUpperCase()}</span>
                  ))}
                </div>
                {allData.map((p, i) => (
                  <div key={p.id} className="grid grid-cols-4 px-6 py-4 items-center" style={{
                    borderBottom: i < allData.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: p.source === 'manual' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                      color: p.source === 'manual' ? '#F59E0B' : '#60A5FA',
                      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, width: 'fit-content',
                    }}>
                      {p.source === 'manual' ? '✏️ Manuelle' : '📊 Calculée'}
                    </span>
                    <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                      {toDaysMonths(p.lifeDays)} <span style={{ color: '#6B7280', fontSize: 12 }}>({p.lifeDays} j)</span>
                    </span>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#9AA4B2', fontSize: 13 }}>
                        {p.installDate ? new Date(p.installDate + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}
                      </span>
                      {p.source === 'manual' && (
                        <button onClick={() => setKnownParts(k => k.filter(x => x.id !== p.id))}>
                          <Trash2 style={{ width: 14, height: 14, color: '#6B7280' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── SECTION 3 : AMORTISSEMENT ── */}
        <Section title="Amortissement & Alertes" icon={Clock} color="#EF4444" defaultOpen>
          {allData.filter(p => p.installDate).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6B7280', padding: '32px 0' }}>
              <Clock style={{ width: 40, height: 40, margin: '0 auto 12px', color: '#374151' }} />
              <p>Ajoutez des pièces avec une date d'installation pour voir l'amortissement</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allData.filter(p => p.installDate).map(p => {
                const data = getAmortissement(p);
                if (!data) return null;
                const { pct, used, remaining } = data;
                const color = gaugeColor(pct);
                const isAlert = pct >= 90;
                const isWarn = pct >= 70 && pct < 90;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(26,18,8,0.95)',
                      border: `1px solid ${isAlert ? 'rgba(239,68,68,0.4)' : isWarn ? 'rgba(245,158,11,0.3)' : 'rgba(184,115,51,0.2)'}`,
                      borderRadius: 20,
                      overflow: 'hidden',
                      boxShadow: isAlert ? '0 0 30px rgba(239,68,68,0.15)' : 'none',
                    }}
                  >
                    {/* Barre couleur top */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

                    <div className="p-6">
                      {/* Nom + alerte */}
                      <div className="flex items-center justify-between mb-5">
                        <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{p.name}</h3>
                        {isAlert && (
                          <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '4px 10px' }}
                          >
                            <AlertTriangle style={{ width: 12, height: 12, color: '#EF4444' }} />
                            <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 700 }}>À CHANGER</span>
                          </motion.div>
                        )}
                        {isWarn && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '4px 10px' }}>
                            <AlertTriangle style={{ width: 12, height: 12, color: '#F59E0B' }} />
                            <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>À VÉRIFIER</span>
                          </div>
                        )}
                        {!isAlert && !isWarn && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(184,115,51,0.1)', border: '1px solid rgba(184,115,51,0.2)', borderRadius: 20, padding: '4px 10px' }}>
                            <CheckCircle style={{ width: 12, height: 12, color: '#B87333' }} />
                            <span style={{ color: '#B87333', fontSize: 11, fontWeight: 700 }}>BON ÉTAT</span>
                          </div>
                        )}
                      </div>

                      {/* Jauge + infos */}
                      <div className="flex items-center gap-6">
                        <CircularGauge pct={pct} color={color} size={110} />
                        <div className="flex-1 space-y-3">
                          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                            <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 3 }}>Durée totale</p>
                            <p style={{ color: '#F59E0B', fontWeight: 800, fontSize: 16 }}>{toDaysMonths(p.lifeDays)}</p>
                            <p style={{ color: '#6B7280', fontSize: 11 }}>({p.lifeDays} jours)</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px' }}>
                              <p style={{ color: '#6B7280', fontSize: 10, marginBottom: 2 }}>Utilisé</p>
                              <p style={{ color, fontWeight: 700, fontSize: 13 }}>{toDaysMonths(used)}</p>
                              <p style={{ color: '#6B7280', fontSize: 10 }}>({used} j)</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px' }}>
                              <p style={{ color: '#6B7280', fontSize: 10, marginBottom: 2 }}>Restant</p>
                              <p style={{ color: remaining > 0 ? '#B87333' : '#EF4444', fontWeight: 700, fontSize: 13 }}>
                                {remaining > 0 ? toDaysMonths(remaining) : 'DÉPASSÉ'}
                              </p>
                              {remaining > 0 && <p style={{ color: '#6B7280', fontSize: 10 }}>({remaining} j)</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Barre linéaire avec marqueurs */}
                      <div className="mt-5">
                        <div style={{ position: 'relative', background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 8 }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 99,
                            background: `linear-gradient(90deg, #B87333, ${color})`,
                            transition: 'width 1s ease',
                          }} />
                          {/* Marqueurs 1/3 et 2/3 */}
                          {[33, 66].map(m => (
                            <div key={m} style={{
                              position: 'absolute', top: -3, left: `${m}%`,
                              width: 2, height: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 1,
                            }} />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span style={{ color: '#6B7280', fontSize: 10 }}>Neuf</span>
                          <span style={{ color: '#6B7280', fontSize: 10 }}>1/3</span>
                          <span style={{ color: '#6B7280', fontSize: 10 }}>2/3</span>
                          <span style={{ color: '#EF4444', fontSize: 10 }}>Limite</span>
                        </div>
                      </div>

                      {/* Source */}
                      <div className="mt-3 flex justify-between items-center">
                        <span style={{
                          background: p.source === 'manual' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                          color: p.source === 'manual' ? '#F59E0B' : '#60A5FA',
                          borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 600,
                        }}>
                          {p.source === 'manual' ? '✏️ Donnée manuelle' : '📊 Moyenne calculée'}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: 10 }}>
                          Installé: {new Date(p.installDate + 'T12:00:00').toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}
