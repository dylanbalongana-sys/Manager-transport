import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  Wallet,
  Wrench,
  BarChart3,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Download,
  Users,
  AlertTriangle,
  RefreshCcw,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { useStore } from '../store/useStore';

type Role = 'admin' | 'collaborator';
interface Props {
  role: Role;
}

type TabKey = 'security' | 'kpi' | 'docs';

function fmt(n: number, currency = 'FC') {
  return `${Math.round(n).toLocaleString('fr-FR')} ${currency}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

function Card({
  title,
  icon: Icon,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-7"
      style={{
        background: 'rgba(10,14,26,0.86)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(22px)',
        boxShadow: '0 0 60px rgba(16,185,129,0.06)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Icon className="w-5 h-5 text-slate-200" />
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-base truncate">{title}</h3>
          {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings({ role }: Props) {
  const {
    settings,
    updateSettings,

    cashBalance,
    maintenanceFund,
    setCashBalance,
    setMaintenanceFund,

    documents,
    addDocument,
    deleteDocument,

    setDashboardOverrides,
    clearDashboardOverrides,
  } = useStore();

  const currency = settings.currency || 'FC';
  const maxMaintenance = settings.maxMaintenanceFund || 150000;
  const syncEnabled = !!settings.syncEnabled;

  const [tab, setTab] = useState<TabKey>('security');
  const [saved, setSaved] = useState(false);

  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showCollabPin, setShowCollabPin] = useState(false);

  const [adminPin, setAdminPin] = useState(settings.adminPin || '1234');
  const [collabPin, setCollabPin] = useState(settings.collaboratorPin || '0000');

  const [cashEdit, setCashEdit] = useState(String(cashBalance || 0));
  const [maintenanceEdit, setMaintenanceEdit] = useState(String(maintenanceFund || 0));

  const currentOverrides = settings.dashboardOverrides || {};
  const [kpiTodayEdit, setKpiTodayEdit] = useState(
    currentOverrides.todayRevenueBrut == null ? '' : String(currentOverrides.todayRevenueBrut)
  );
  const [kpiMonthEdit, setKpiMonthEdit] = useState(
    currentOverrides.monthRevenueBrut == null ? '' : String(currentOverrides.monthRevenueBrut)
  );
  const [kpiDebtEdit, setKpiDebtEdit] = useState(
    currentOverrides.totalDebt == null ? '' : String(currentOverrides.totalDebt)
  );
  const [kpiChargesEdit, setKpiChargesEdit] = useState(
    currentOverrides.totalExpenses == null ? '' : String(currentOverrides.totalExpenses)
  );
  const [kpiPannesEdit, setKpiPannesEdit] = useState(
    currentOverrides.totalBreakdowns == null ? '' : String(currentOverrides.totalBreakdowns)
  );

  const [docCategory, setDocCategory] = useState<'collaborator' | 'driver' | 'controller' | 'regulatory' | 'other'>(
    'collaborator'
  );
  const [docLabel, setDocLabel] = useState('');
  const [docMsg, setDocMsg] = useState<string>('');

  const tabs = useMemo(
    () => [
      { key: 'security' as const, label: 'Sécurité', icon: Shield },
      { key: 'kpi' as const, label: 'KPI Dashboard', icon: BarChart3 },
      { key: 'docs' as const, label: 'Documents', icon: FileText },
    ],
    []
  );

  const pulseSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleSavePins = () => {
    if (role === 'admin') {
      updateSettings({ adminPin, collaboratorPin: collabPin });
    } else {
      updateSettings({ collaboratorPin: collabPin });
    }
    pulseSaved();
  };

  // ✅ Maintenant admin ET collaborateur peuvent activer la synchro
  const handleEnableSync = () => {
    updateSettings({ syncEnabled: true });
    pulseSaved();
  };

  // ✅ L’admin peut désactiver ; le collaborateur aussi sur son appareil
  const handleDisableSync = () => {
    updateSettings({ syncEnabled: false });
    pulseSaved();
  };

  const handleAdjustCashMaintenance = () => {
    const newCash = Number(cashEdit) || 0;
    const newMaintenance = Number(maintenanceEdit) || 0;

    if (newMaintenance > maxMaintenance) {
      alert(`Le fonds maintenance ne peut pas dépasser ${maxMaintenance} ${currency}`);
      return;
    }
    if (newMaintenance < 0 || newCash < 0) {
      alert('Valeur invalide (pas de nombre négatif).');
      return;
    }

    setCashBalance(newCash);
    setMaintenanceFund(newMaintenance);
    pulseSaved();
  };

  const handleApplyKpiOverrides = () => {
    if (role !== 'admin') {
      alert("Seul l'administrateur peut corriger les KPI du Dashboard.");
      return;
    }

    const overrides: any = {};

    if (kpiTodayEdit.trim() !== '') overrides.todayRevenueBrut = Math.max(0, Number(kpiTodayEdit) || 0);
    if (kpiMonthEdit.trim() !== '') overrides.monthRevenueBrut = Math.max(0, Number(kpiMonthEdit) || 0);
    if (kpiDebtEdit.trim() !== '') overrides.totalDebt = Math.max(0, Number(kpiDebtEdit) || 0);
    if (kpiChargesEdit.trim() !== '') overrides.totalExpenses = Math.max(0, Number(kpiChargesEdit) || 0);
    if (kpiPannesEdit.trim() !== '') overrides.totalBreakdowns = Math.max(0, Number(kpiPannesEdit) || 0);

    setDashboardOverrides(overrides);
    pulseSaved();
  };

  const handleClearKpiOverrides = () => {
    if (role !== 'admin') return;
    clearDashboardOverrides();
    setKpiTodayEdit('');
    setKpiMonthEdit('');
    setKpiDebtEdit('');
    setKpiChargesEdit('');
    setKpiPannesEdit('');
    pulseSaved();
  };

  const groupedDocs = useMemo(() => {
    const docs = documents || [];
    const groups: Record<string, typeof docs> = {
      collaborator: [],
      driver: [],
      controller: [],
      regulatory: [],
      other: [],
    };
    docs.forEach((d) => {
      const k = (d.category || 'other') as keyof typeof groups;
      if (!groups[k]) groups.other.push(d);
      else groups[k].push(d);
    });
    return groups;
  }, [documents]);

  const handleUploadDoc = async (file: File) => {
    try {
      setDocMsg('');
      const dataUrl = await readFileAsDataURL(file);

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg =
        file.type.startsWith('image/') ||
        /\.(png|jpg|jpeg|webp)$/i.test(file.name.toLowerCase());

      if (!isPdf && !isImg) {
        setDocMsg('⚠️ Fichier refusé : uniquement PDF ou image.');
        return;
      }

      addDocument({
        label: docLabel.trim() || file.name,
        category: docCategory,
        mime: isPdf ? 'application/pdf' : 'image/*',
        fileName: file.name,
        dataUrl,
        createdAt: new Date().toISOString(),
      });

      setDocLabel('');
      setDocMsg('✅ Document ajouté.');
      pulseSaved();
      setTimeout(() => setDocMsg(''), 2200);
    } catch (e) {
      setDocMsg('⚠️ Impossible de lire ce fichier.');
    }
  };

  const inputStyle =
    'w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all';
  const inputBg = {
    background: 'rgba(15,20,40,0.78)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="relative min-h-screen" style={{ background: '#05070D' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #040810 0%, #070d1a 40%, #05090f 100%)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 780,
            height: 780,
            top: -320,
            left: -240,
            background: 'radial-gradient(circle, rgba(26,107,60,0.14) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 720,
            height: 720,
            top: '12%',
            right: -280,
            background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 620,
            height: 620,
            bottom: -170,
            left: '24%',
            background: 'radial-gradient(circle, rgba(139,26,26,0.10) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(251,191,36,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.6) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-7"
          style={{
            background: 'rgba(10,14,26,0.82)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(22px)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-white font-black text-2xl" style={{ letterSpacing: '-0.02em' }}>
                Paramètres
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Sécurité, documents et corrections du tableau de bord
              </p>
            </div>

            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                  style={{
                    background: 'rgba(0,230,118,0.12)',
                    border: '1px solid rgba(0,230,118,0.25)',
                    color: '#00E676',
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Enregistré</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex gap-2 flex-wrap">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#4ade80' : '#9AA4B2',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {tab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card
              title="Synchronisation Firebase"
              subtitle={
                role === 'admin'
                  ? "Active ou coupe l'envoi automatique des données vers Firebase."
                  : "Le collaborateur peut aussi activer la synchronisation sur son appareil pour récupérer les données."
              }
              icon={Cloud}
            >
              <div
                className="rounded-2xl p-4 mb-5"
                style={{
                  background: syncEnabled ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
                  border: syncEnabled
                    ? '1px solid rgba(34,197,94,0.22)'
                    : '1px solid rgba(239,68,68,0.18)',
                }}
              >
                <div className="flex items-center gap-3">
                  {syncEnabled ? (
                    <Cloud className="w-5 h-5 text-green-400" />
                  ) : (
                    <CloudOff className="w-5 h-5 text-red-400" />
                  )}

                  <div>
                    <p className="text-white font-semibold text-sm">
                      {syncEnabled ? 'Synchronisation activée' : 'Synchronisation désactivée'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {syncEnabled
                        ? 'Les changements de l’application peuvent être envoyés vers Firebase.'
                        : 'Aucune synchronisation automatique ne part vers Firebase.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={handleEnableSync}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(0,230,118,0.14)',
                    border: '1px solid rgba(0,230,118,0.28)',
                    color: '#00E676',
                  }}
                >
                  <Cloud className="w-4 h-4" />
                  Activer la synchronisation
                </button>

                <button
                  onClick={handleDisableSync}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    color: '#ef4444',
                  }}
                >
                  <CloudOff className="w-4 h-4" />
                  Désactiver la synchronisation
                </button>
              </div>

              <div
                className="mt-5 rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-slate-500 text-xs">
                  Important : sur un nouvel appareil, active la synchronisation pour récupérer les données déjà présentes dans Firebase.
                </p>
              </div>
            </Card>

            <Card
              title="Sécurité - Code PIN"
              subtitle={
                role === 'admin'
                  ? "L'admin peut gérer son PIN et celui du collaborateur."
                  : 'Vous gérez uniquement votre PIN (le PIN admin est invisible).'
              }
              icon={Shield}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {role === 'admin' && (
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-2 block">PIN Administrateur</label>
                    <div className="flex gap-2">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                        inputMode="numeric"
                      />
                      <button
                        onClick={() => setShowAdminPin((v) => !v)}
                        className="px-4 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#9AA4B2',
                        }}
                        title={showAdminPin ? 'Cacher' : 'Voir'}
                      >
                        {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-slate-600 text-xs mt-2">
                      Ce PIN est <span className="text-slate-500 font-semibold">secret</span> : le collaborateur ne le voit jamais.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-slate-400 text-xs font-medium mb-2 block">
                    {role === 'admin' ? 'PIN Collaborateur (visible par admin)' : 'Mon PIN'}
                  </label>

                  <div className="flex gap-2">
                    <input
                      type={showCollabPin ? 'text' : 'password'}
                      value={collabPin}
                      onChange={(e) => setCollabPin(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                      style={inputBg}
                      inputMode="numeric"
                    />
                    <button
                      onClick={() => setShowCollabPin((v) => !v)}
                      className="px-4 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9AA4B2',
                      }}
                      title={showCollabPin ? 'Cacher' : 'Voir'}
                    >
                      {showCollabPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {role === 'admin' ? (
                    <p className="text-slate-600 text-xs mt-2">
                      L’admin peut toujours voir ce PIN (même si le collaborateur le change).
                    </p>
                  ) : (
                    <p className="text-slate-600 text-xs mt-2">
                      Vous pouvez voir/cacher et changer votre PIN ici.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSavePins}
                className="mt-6 w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,230,118,0.28), rgba(255,193,7,0.18))',
                  border: '1px solid rgba(0,230,118,0.22)',
                  color: '#ffffff',
                }}
              >
                <Save className="w-4 h-4" />
                Sauvegarder les PIN
              </button>
            </Card>
          </motion.div>
        )}

        {tab === 'kpi' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card
              title="Correction financière"
              subtitle={role === 'admin' ? 'Ajuster caisse + fonds maintenance' : "Réservé à l'administrateur"}
              icon={Wallet}
            >
              {role !== 'admin' ? (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm font-medium">
                    Seul l’administrateur peut faire des corrections financières.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Modifier la caisse</label>
                      <input
                        type="number"
                        value={cashEdit}
                        onChange={(e) => setCashEdit(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                      <p className="text-slate-600 text-xs mt-2">Actuel: {fmt(cashBalance, currency)}</p>
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">
                        Modifier fonds maintenance (max: {fmt(maxMaintenance, currency)})
                      </label>
                      <input
                        type="number"
                        value={maintenanceEdit}
                        onChange={(e) => setMaintenanceEdit(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                      <p className="text-slate-600 text-xs mt-2">Actuel: {fmt(maintenanceFund, currency)}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleAdjustCashMaintenance}
                    className="mt-6 w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(0,230,118,0.14)',
                      border: '1px solid rgba(0,230,118,0.28)',
                      color: '#00E676',
                    }}
                  >
                    <Wrench className="w-4 h-4" />
                    Appliquer la correction
                  </button>
                </>
              )}
            </Card>

            <Card
              title="Corrections KPI du Dashboard"
              subtitle="Ici tu peux forcer l'affichage des KPI du tableau de bord (sans effacer tes données)."
              icon={BarChart3}
            >
              {role !== 'admin' ? (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm font-medium">
                    Seul l’administrateur peut corriger les KPI du Dashboard.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Recette du jour (brut)</label>
                      <input
                        type="number"
                        value={kpiTodayEdit}
                        onChange={(e) => setKpiTodayEdit(e.target.value)}
                        placeholder="Laisse vide si tu ne veux pas corriger"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Recette du mois (brut)</label>
                      <input
                        type="number"
                        value={kpiMonthEdit}
                        onChange={(e) => setKpiMonthEdit(e.target.value)}
                        placeholder="Laisse vide si tu ne veux pas corriger"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Total dettes (restant)</label>
                      <input
                        type="number"
                        value={kpiDebtEdit}
                        onChange={(e) => setKpiDebtEdit(e.target.value)}
                        placeholder="Laisse vide si tu ne veux pas corriger"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Charges totales</label>
                      <input
                        type="number"
                        value={kpiChargesEdit}
                        onChange={(e) => setKpiChargesEdit(e.target.value)}
                        placeholder="Laisse vide si tu ne veux pas corriger"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-slate-400 text-xs font-medium mb-2 block">Pannes & Réparations</label>
                      <input
                        type="number"
                        value={kpiPannesEdit}
                        onChange={(e) => setKpiPannesEdit(e.target.value)}
                        placeholder="Laisse vide si tu ne veux pas corriger"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={inputBg}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mt-6">
                    <button
                      onClick={handleApplyKpiOverrides}
                      className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,230,118,0.22), rgba(255,193,7,0.14))',
                        border: '1px solid rgba(0,230,118,0.22)',
                        color: '#ffffff',
                      }}
                    >
                      <Save className="w-4 h-4" />
                      Appliquer au Dashboard
                    </button>

                    <button
                      onClick={handleClearKpiOverrides}
                      className="py-3 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9AA4B2',
                      }}
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Annuler toutes les corrections
                    </button>
                  </div>

                  <div
                    className="mt-5 rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-slate-500 text-xs">
                      🧠 Important : ici tu “forces” seulement l’affichage du Dashboard.
                      <br />
                      Tes vraies données restent intactes dans leurs pages (Dettes, Journal, etc.).
                    </p>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}

        {tab === 'docs' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card
              title="Documents & Pièces justificatives"
              subtitle="Ajoute PDF ou images pour pouvoir récupérer tout à distance."
              icon={Users}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-2 block">Catégorie</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={inputBg}
                  >
                    <option value="collaborator">Collaborateur</option>
                    <option value="driver">Chauffeur</option>
                    <option value="controller">Contrôleur</option>
                    <option value="regulatory">Charges & Taxes</option>
                    <option value="other">Autres</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-slate-400 text-xs font-medium mb-2 block">Nom du document (optionnel)</label>
                  <input
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    placeholder="Ex: Assurance 2026, Carte ID chauffeur..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={inputBg}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <label
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer"
                  style={{
                    background: 'rgba(0,230,118,0.12)',
                    border: '1px solid rgba(0,230,118,0.22)',
                    color: '#00E676',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Ajouter un PDF / une image
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadDoc(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>

                <AnimatePresence>
                  {docMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-sm font-semibold"
                      style={{ color: docMsg.startsWith('✅') ? '#00E676' : '#f59e0b' }}
                    >
                      {docMsg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            <Card title="Mes documents" subtitle="Télécharger / supprimer" icon={FileText}>
              {!documents || documents.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Aucun document pour le moment</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {([
                    { key: 'collaborator', label: 'Collaborateur' },
                    { key: 'driver', label: 'Chauffeur' },
                    { key: 'controller', label: 'Contrôleur' },
                    { key: 'regulatory', label: 'Charges & Taxes' },
                    { key: 'other', label: 'Autres' },
                  ] as const).map((g) => {
                    const list = groupedDocs[g.key] || [];
                    if (list.length === 0) return null;

                    return (
                      <div key={g.key}>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                          {g.label} — {list.length}
                        </p>

                        <div className="space-y-3">
                          {list.map((d) => {
                            const isPdf =
                              (d.mime || '').includes('pdf') ||
                              (d.fileName || '').toLowerCase().endsWith('.pdf');
                            const Icon = isPdf ? FileText : ImageIcon;

                            return (
                              <div
                                key={d.id}
                                className="rounded-2xl p-4 flex items-center gap-4"
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                <div
                                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: isPdf ? 'rgba(167,139,250,0.12)' : 'rgba(96,165,250,0.12)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <Icon className="w-5 h-5" style={{ color: isPdf ? '#a78bfa' : '#60a5fa' }} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-white text-sm font-semibold truncate">{d.label || d.fileName}</p>
                                  <p className="text-slate-600 text-xs truncate">
                                    {d.fileName} • {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <a
                                    href={d.dataUrl}
                                    download={d.fileName || 'document'}
                                    className="px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                    style={{
                                      background: 'rgba(0,230,118,0.10)',
                                      border: '1px solid rgba(0,230,118,0.20)',
                                      color: '#00E676',
                                    }}
                                    title="Télécharger"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>

                                  <button
                                    onClick={() => deleteDocument(d.id)}
                                    className="px-3 py-2 rounded-xl text-sm font-bold"
                                    style={{
                                      background: 'rgba(239,68,68,0.08)',
                                      border: '1px solid rgba(239,68,68,0.18)',
                                      color: '#ef4444',
                                    }}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
              )}
            </Card>

            <div
              className="rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-slate-500 text-sm">
                Les documents sont stockés dans l’app.
                <br />
                Si la synchronisation Firebase est activée, ils peuvent aussi être inclus dans la synchro prévue par le projet.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}