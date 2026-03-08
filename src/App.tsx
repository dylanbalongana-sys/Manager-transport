import { useState, useEffect } from 'react';
import {
  LayoutDashboard, CalendarDays, Bus, Bell, AlertTriangle, CheckCircle2, Clock,
  Receipt, CreditCard, ClipboardList, Zap, Target, BarChart3, Wrench,
  Settings2, LogOut, BookOpen, History, Cloud, CloudOff, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Dashboard from './pages/Dashboard';
import DailyActivity from './pages/DailyActivity';
import Charges from './pages/Charges';
import Debts from './pages/Debts';
import ProvisionalDebts from './pages/ProvisionalDebts';
import AutomationPage from './pages/Automation';
import ObjectivesPage from './pages/Objectives';
import BilanPage from './pages/Bilan';
import PartsTracking from './pages/PartsTracking';
import SettingsPage from './pages/Settings';
import Auth from './pages/Auth';
import Guide from './pages/Guide';
import HistoryPage from './pages/History';
import MaintenanceFund from './pages/MaintenanceFund';
import { useStore } from './store/useStore';
import { useFirebaseSync } from './sync/useFirebaseSync';

type Page =
  | 'dashboard' | 'daily' | 'charges' | 'debts' | 'provisional'
  | 'automation' | 'objectives' | 'bilan' | 'parts' | 'settings'
  | 'guide' | 'history' | 'maintenance';

type Role = 'admin' | 'collaborator';

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType; short: string; adminOnly?: boolean }[] = [
  { id: 'dashboard',   label: 'Tableau de bord',      icon: LayoutDashboard, short: 'Dashboard'  },
  { id: 'daily',       label: 'Activité Journalière', icon: CalendarDays,    short: 'Activité'   },
  { id: 'charges',     label: 'Frais & Charges',      icon: Receipt,         short: 'Frais'      },
  { id: 'debts',       label: 'Dettes',               icon: CreditCard,      short: 'Dettes'     },
  { id: 'provisional', label: 'Prévisionnel',         icon: ClipboardList,   short: 'Prévis.'    },
  { id: 'automation',  label: 'Automatisation',       icon: Zap,             short: 'Auto.'      },
  { id: 'objectives',  label: 'Objectifs',            icon: Target,          short: 'Objectifs'  },
  { id: 'bilan',       label: 'Bilan',                icon: BarChart3,       short: 'Bilan'      },
  { id: 'parts',       label: 'Suivi Pièces',         icon: Wrench,          short: 'Pièces'     },
  { id: 'maintenance', label: 'Frais Maintenance',    icon: Wrench,          short: 'Maint.'     },
  { id: 'history',     label: 'Historique',           icon: History,         short: 'Historique' },
  { id: 'guide',       label: 'Guide',                icon: BookOpen,        short: 'Guide'      },
  { id: 'settings',    label: 'Paramètres',           icon: Settings2,       short: 'Paramètres' },
];

function SyncBadge({
  enabled,
  status,
  onManualSync,
}: {
  enabled: boolean;
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  onManualSync: () => void;
}) {
  if (!enabled) {
    return (
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        title="Synchronisation désactivée"
      >
        <CloudOff className="w-4 h-4 text-slate-500" />
        <span className="text-[11px] font-semibold text-slate-500">Sync OFF</span>
      </div>
    );
  }

  const map = {
    idle:    { icon: Cloud,        label: 'En attente',   color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.16)' },
    syncing: { icon: RefreshCcw,   label: 'Synchro...',   color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.22)' },
    synced:  { icon: CheckCircle2, label: 'Synchronisé',  color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.22)' },
    error:   { icon: AlertTriangle,label: 'Erreur',       color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)' },
    offline: { icon: CloudOff,     label: 'Hors-ligne',   color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.22)' },
  } as const;

  const cfg = map[status];
  const Icon = cfg.icon;

  return (
    <button
      onClick={onManualSync}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      title="Clique pour forcer une synchro"
    >
      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
      <span className="text-[11px] font-bold" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </button>
  );
}

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [dailyKey, setDailyKey] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [role, setRole] = useState<Role | null>(null);

  const { settings, objectives } = useStore();

  // ✅ La synchro doit recevoir BOTH : activée oui/non + rôle courant
  const syncEnabled = !!settings.syncEnabled;
  const { status, uploadToCloud } = useFirebaseSync(syncEnabled, role);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Brazzaville',
  });

  const lateCount = objectives.filter(o => o.status === 'late').length;

  const handleLogin = (r: Role) => setRole(r);
  const handleLogout = () => {
    setRole(null);
    setPage('dashboard');
  };

  if (!role) return <Auth onLogin={handleLogin} />;

  const visibleNav = NAV_ITEMS.filter(item => role === 'admin' || !item.adminOnly);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 left-0 right-0 z-50">
        <div
          style={{
            background: 'rgba(7,12,26,0.95)',
            backdropFilter: 'blur(40px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div className="max-w-[1400px] mx-auto px-5 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-xl blur-md opacity-60"
                  style={{ background: 'linear-gradient(135deg, #1a6b3c, #22c55e)' }}
                />
                <div
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a6b3c, #22c55e)' }}
                >
                  <Bus className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-sm leading-tight tracking-wide">Hiace Congo</p>
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#d4a017' }}>
                  Smart Mobility · BZV
                </p>
              </div>
            </div>

            <nav
              className="flex items-center gap-1 rounded-2xl p-1 overflow-x-auto flex-1 mx-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                scrollbarWidth: 'none',
              }}
            >
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const isActive = page === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'daily') setDailyKey(k => k + 1);
                      setPage(item.id);
                    }}
                    className="relative px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'rgba(245,158,11,0.15)',
                          border: '1px solid rgba(245,158,11,0.28)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`relative w-4 h-4 transition-colors duration-200 flex-shrink-0 ${
                        isActive ? 'text-amber-400' : 'text-white/30'
                      }`}
                    />
                    <span
                      className={`relative text-xs font-semibold transition-colors duration-200 whitespace-nowrap ${
                        isActive ? 'text-white' : 'text-white/30'
                      }`}
                    >
                      {item.short}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="hidden lg:flex flex-col items-end">
                <p className="text-white font-bold text-sm tabular-nums leading-tight">{timeStr}</p>
                <p className="text-slate-600 text-[9px] uppercase tracking-wider">Brazzaville</p>
              </div>

              <SyncBadge
                enabled={syncEnabled}
                status={status}
                onManualSync={() => uploadToCloud()}
              />

              <div className="relative">
                <motion.button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Bell className="w-4 h-4 text-slate-300" />
                  </motion.div>
                  {lateCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </motion.button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-72 rounded-2xl p-4 z-50"
                      style={{
                        background: 'rgba(7,12,26,0.97)',
                        backdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                      }}
                    >
                      <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-yellow-400" /> Notifications
                      </p>

                      {[
                        {
                          icon: AlertTriangle,
                          text: `${lateCount} objectif(s) en retard`,
                          color: '#ef4444',
                          bg: 'rgba(239,68,68,0.08)',
                        },
                        {
                          icon: CheckCircle2,
                          text: 'Système opérationnel',
                          color: '#22c55e',
                          bg: 'rgba(34,197,94,0.08)',
                        },
                        {
                          icon: Clock,
                          text: 'Vérifiez vos dettes actives',
                          color: '#fbbf24',
                          bg: 'rgba(251,191,36,0.08)',
                        },
                      ].map((n, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ background: n.bg, border: `1px solid ${n.color}18` }}
                        >
                          <n.icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: n.color }} />
                          <p className="text-slate-300 text-xs leading-relaxed">{n.text}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                  style={{
                    background:
                      role === 'admin'
                        ? 'linear-gradient(135deg, #d4a017, #fbbf24)'
                        : 'linear-gradient(135deg, #1a6b3c, #22c55e)',
                  }}
                >
                  {(settings.staff?.collaboratorName || 'G')[0].toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-xs font-semibold leading-tight">
                    {settings.staff?.collaboratorName?.split(' ')[0] || 'Gérant'}
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    {role === 'admin' ? 'Administrateur' : 'Collaborateur'}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4 text-red-400" />
              </motion.button>
            </div>
          </div>

          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, rgba(34,197,94,0.4) 0%, rgba(212,160,23,0.3) 50%, rgba(239,68,68,0.4) 100%)',
            }}
          />
        </div>
      </header>

      <main className="min-h-screen">
        {page === 'daily' && <DailyActivity key={dailyKey} />}

        {page !== 'daily' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {page === 'dashboard' && <Dashboard />}
              {page === 'charges' && <Charges />}
              {page === 'debts' && <Debts />}
              {page === 'provisional' && <ProvisionalDebts />}
              {page === 'automation' && <AutomationPage />}
              {page === 'objectives' && <ObjectivesPage />}
              {page === 'bilan' && <BilanPage />}
              {page === 'parts' && <PartsTracking />}
              {page === 'maintenance' && <MaintenanceFund />}
              {page === 'settings' && <SettingsPage role={role} />}
              {page === 'guide' && <Guide />}
              {page === 'history' && <HistoryPage />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}