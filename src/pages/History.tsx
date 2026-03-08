import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  History,
  CheckCircle2,
  Wrench,
  BanIcon,
  ChevronDown,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trash2,
  CreditCard,
} from 'lucide-react';

function fmt(n: number, currency = 'Fr') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

type Filter = 'all' | 'normal' | 'maintenance' | 'inactive';

type HistoryKind = 'daily' | 'maintenanceTx' | 'debtPayment';

type ConfirmDelete =
  | { kind: 'daily'; id: string; date: string; title: string }
  | { kind: 'maintenanceTx'; id: string; date: string; title: string }
  | { kind: 'debtPayment'; id: string; date: string; title: string };

export default function HistoryPage() {
  const {
    dailyEntries,
    deleteDailyEntry,
    settings,
    debtPayments,
    maintenanceTransactions,
    deleteMaintenanceTransaction,
    deleteDebtPayment,
  } = useStore();

  const currency = settings.currency || 'FC';
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1) On construit UNE seule liste d'historique avec 3 types d'items
  // ─────────────────────────────────────────────────────────────────────────────
  const historyItems = useMemo(() => {
    const daily = (dailyEntries || []).map((e) => {
      const dayType = (e.dayType || 'normal') as Filter; // normal/maintenance/inactive
      const title =
        dayType === 'normal'
          ? 'Activité journalière'
          : dayType === 'maintenance'
          ? "Journée d'entretien"
          : 'Journée sans activité';

      return {
        uid: `daily:${e.id}`,
        kind: 'daily' as const,
        filterType: dayType as Filter,
        date: e.date,
        title,
        raw: e,
      };
    });

    const maint = (maintenanceTransactions || []).map((tx) => {
      return {
        uid: `maintenanceTx:${tx.id}`,
        kind: 'maintenanceTx' as const,
        filterType: 'maintenance' as const,
        date: tx.date,
        title: tx.label || 'Opération maintenance',
        raw: tx,
      };
    });

    const debts = (debtPayments || []).map((p) => {
      // Tu as confirmé : tu veux que ça apparaisse dans "Normales"
      return {
        uid: `debtPayment:${p.id}`,
        kind: 'debtPayment' as const,
        filterType: 'normal' as const,
        date: p.date,
        title: `${p.supplier} — ${p.part}`,
        raw: p,
      };
    });

    const all = [...daily, ...maint, ...debts];

    // tri date décroissante
    all.sort((a, b) => {
      const c = b.date.localeCompare(a.date);
      if (c !== 0) return c;
      // secondaire : daily en premier, puis maintenance, puis dettes (juste pour stabilité)
      const order: Record<HistoryKind, number> = { daily: 0, maintenanceTx: 1, debtPayment: 2 };
      return order[a.kind] - order[b.kind];
    });

    return all;
  }, [dailyEntries, maintenanceTransactions, debtPayments]);

  const filtered = historyItems.filter((item) => {
    const matchType = filter === 'all' || item.filterType === filter;
    const matchSearch = !search || item.date.includes(search);
    return matchType && matchSearch;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Stats (on garde les mêmes stats, basées sur les dailyEntries)
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredDaily = useMemo(() => {
    // On aligne les stats sur le filtre actuel
    // - Normal => journées normales
    // - Maintenance => journées maintenance
    // - Inactive => journées inactives
    // - All => toutes les journées
    const base = [...(dailyEntries || [])].sort((a, b) => b.date.localeCompare(a.date));
    return base.filter((e) => {
      const t = (e.dayType || 'normal') as Filter;
      const matchType = filter === 'all' || t === filter;
      const matchSearch = !search || e.date.includes(search);
      return matchType && matchSearch;
    });
  }, [dailyEntries, filter, search]);

  const totalRevenue = filteredDaily
    .filter((e) => (e.dayType || 'normal') === 'normal')
    .reduce((s, e) => s + e.revenue, 0);

  const totalNet = filteredDaily
    .filter((e) => (e.dayType || 'normal') === 'normal')
    .reduce((s, e) => s + e.netRevenue, 0);

  const totalPannes = filteredDaily.reduce((s, e) => s + e.breakdowns.length, 0);

  const FILTERS: { id: Filter; label: string; icon: React.ElementType; color: string; bg: string }[] = [
    { id: 'all', label: 'Toutes', icon: Calendar, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    { id: 'normal', label: 'Normales', icon: CheckCircle2, color: '#00E676', bg: 'rgba(0,230,118,0.1)' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: '#FFC107', bg: 'rgba(255,193,7,0.1)' },
    { id: 'inactive', label: 'Inactives', icon: BanIcon, color: '#FF3B3B', bg: 'rgba(255,59,59,0.1)' },
  ];

  const handleDelete = (payload: ConfirmDelete) => {
    if (payload.kind === 'daily') deleteDailyEntry(payload.id);
    if (payload.kind === 'maintenanceTx') deleteMaintenanceTransaction(payload.id);
    if (payload.kind === 'debtPayment') deleteDebtPayment(payload.id);

    setConfirmDelete(null);
    setOpenId(null);
  };

  return (
    <div className="relative min-h-screen" style={{ background: '#05070D' }}>
      {/* Fond */}
      <img
        src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.04, filter: 'blur(3px)' }}
        alt=""
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(100,181,246,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Hero */}
        <div
          className="rounded-3xl p-7"
          style={{
            background: 'rgba(10,14,26,0.9)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(100,181,246,0.15)',
                border: '1px solid rgba(100,181,246,0.25)',
              }}
            >
              <History className="w-6 h-6" style={{ color: '#64B5F6' }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Historique</h1>
              <p className="text-slate-400 text-sm">
                Toutes les activités enregistrées · Supprimez pour libérer une date
              </p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Journées', value: filteredDaily.length.toString(), color: '#64B5F6' },
              { label: 'Recettes brutes', value: fmt(totalRevenue, currency), color: '#00E676' },
              { label: 'Net total', value: fmt(totalNet, currency), color: totalNet >= 0 ? '#00E676' : '#FF3B3B' },
              { label: 'Pannes', value: totalPannes.toString(), color: '#FF3B3B' },
            ].map((s, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className="font-bold text-lg" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Barre Congo */}
          <div
            className="mt-5 h-px"
            style={{
              background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)',
            }}
          />
        </div>

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isActive ? f.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? f.color + '40' : 'rgba(255,255,255,0.07)'}`,
                    color: isActive ? f.color : '#94a3b8',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {f.label}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une date (ex: 2025-01)"
              className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-slate-600"
            />
          </div>
        </div>

        {/* Modal confirmation suppression */}
        {confirmDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <div
              className="rounded-3xl p-8 max-w-md w-full"
              style={{
                background: 'rgba(15,20,35,0.98)',
                border: '1px solid rgba(255,59,59,0.3)',
                boxShadow: '0 0 60px rgba(255,59,59,0.15)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(255,59,59,0.12)', border: '1px solid rgba(255,59,59,0.25)' }}
              >
                <Trash2 className="w-7 h-7" style={{ color: '#FF3B3B' }} />
              </div>

              <h3 className="text-white font-bold text-xl text-center mb-2">Supprimer cet enregistrement ?</h3>

              <p className="text-slate-400 text-sm text-center mb-1">
                {new Date(confirmDelete.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              <p className="text-slate-500 text-xs text-center mb-2">{confirmDelete.title}</p>

              <p className="text-slate-500 text-xs text-center mb-6">
                Cette action est irréversible.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                  }}
                >
                  Annuler
                </button>

                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: 'rgba(255,59,59,0.15)',
                    border: '1px solid rgba(255,59,59,0.4)',
                    color: '#FF3B3B',
                  }}
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste UNIFIÉE */}
        {filtered.length === 0 ? (
          <div
            className="text-center py-20 rounded-3xl"
            style={{
              background: 'rgba(10,14,26,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <History className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-slate-400 font-medium">Aucune activité trouvée</p>
            <p className="text-slate-600 text-sm mt-1">Commencez par saisir des activités journalières</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const isOpen = openId === item.uid;

              // ─────────────────────────────────────────────────────────────
              // CONFIG style (on garde exactement la même logique/design)
              // ─────────────────────────────────────────────────────────────
              const typeConfig = (() => {
                if (item.kind === 'daily') {
                  const entry = item.raw as any;
                  const dayType = (entry.dayType || 'normal') as 'normal' | 'maintenance' | 'inactive';
                  return (
                    {
                      normal: { icon: CheckCircle2, color: '#00E676', label: 'Normale', bg: 'rgba(0,230,118,0.08)' },
                      maintenance: { icon: Wrench, color: '#FFC107', label: 'Maintenance', bg: 'rgba(255,193,7,0.08)' },
                      inactive: { icon: BanIcon, color: '#FF3B3B', label: 'Inactive', bg: 'rgba(255,59,59,0.08)' },
                    }[dayType] || { icon: CheckCircle2, color: '#00E676', label: 'Normale', bg: 'rgba(0,230,118,0.08)' }
                  );
                }

                if (item.kind === 'maintenanceTx') {
                  return { icon: Wrench, color: '#FFC107', label: 'Maintenance', bg: 'rgba(255,193,7,0.08)' };
                }

                // debtPayment
                return { icon: CreditCard, color: '#00E676', label: 'Normale', bg: 'rgba(0,230,118,0.08)' };
              })();

              const TypeIcon = typeConfig.icon;

              // ─────────────────────────────────────────────────────────────
              // Données spécifiques à chaque type
              // ─────────────────────────────────────────────────────────────
              const daily = item.kind === 'daily' ? (item.raw as any) : null;
              const maint = item.kind === 'maintenanceTx' ? (item.raw as any) : null;
              const debt = item.kind === 'debtPayment' ? (item.raw as any) : null;

              const dailyExpTotal = daily ? daily.expenses.reduce((s: number, e: any) => s + e.amount, 0) : 0;
              const dailyBdTotal = daily ? daily.breakdowns.reduce((s: number, b: any) => s + b.amount, 0) : 0;

              const mainRightValue = (() => {
                if (item.kind === 'daily') {
                  const dayType = (daily.dayType || 'normal') as string;
                  if (dayType === 'normal') {
                    return (
                      <p
                        className="font-bold text-sm"
                        style={{ color: daily.netRevenue >= 0 ? '#00E676' : '#FF3B3B' }}
                      >
                        {fmt(daily.netRevenue, currency)}
                      </p>
                    );
                  }
                  return (
                    <p className="text-xs" style={{ color: typeConfig.color }}>
                      {typeConfig.label}
                    </p>
                  );
                }

                if (item.kind === 'maintenanceTx') {
                  const isDeduct = String(maint.type).includes('deduct');
                  const color = isDeduct ? '#FF3B3B' : '#00E676';
                  return (
                    <p className="font-bold text-sm" style={{ color }}>
                      {isDeduct ? '-' : '+'}
                      {fmt(maint.amount, currency)}
                    </p>
                  );
                }

                // debtPayment
                const color = debt.fromCash ? '#FF3B3B' : '#00E676';
                return (
                  <p className="font-bold text-sm" style={{ color }}>
                    -{fmt(debt.amount, currency)}
                  </p>
                );
              })();

              const topMiddleBadges = (() => {
                if (item.kind === 'daily') {
                  const dayType = (daily.dayType || 'normal') as string;
                  return (
                    <div className="flex items-center gap-6 flex-1 ml-2">
                      {dayType === 'normal' && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400 text-xs">{fmt(daily.revenue, currency)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400 text-xs">{fmt(dailyExpTotal + dailyBdTotal, currency)}</span>
                          </div>
                        </>
                      )}

                      {daily.breakdowns.length > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255,59,59,0.1)',
                            color: '#FF3B3B',
                            border: '1px solid rgba(255,59,59,0.2)',
                          }}
                        >
                          {daily.breakdowns.length} panne(s)
                        </span>
                      )}
                    </div>
                  );
                }

                if (item.kind === 'maintenanceTx') {
                  const isDeduct = String(maint.type).includes('deduct');
                  const badge = (() => {
                    if (maint.type === 'add_from_cash') return { label: 'Depuis caisse', color: '#FF3B3B', bg: 'rgba(255,59,59,0.1)', border: 'rgba(255,59,59,0.25)' };
                    if (maint.type === 'add_personal') return { label: 'Fonds propres', color: '#00E676', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.25)' };
                    if (maint.type === 'deduct_from_daily') return { label: 'Depuis activité', color: '#FFC107', bg: 'rgba(255,193,7,0.10)', border: 'rgba(255,193,7,0.25)' };
                    return { label: 'Dépense', color: '#FF3B3B', bg: 'rgba(255,59,59,0.10)', border: 'rgba(255,59,59,0.22)' };
                  })();

                  return (
                    <div className="flex items-center gap-6 flex-1 ml-2">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
                        style={{
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </div>

                      {maint.linkedDailyEntryDate && (
                        <span className="text-xs text-slate-500">
                          lié au {maint.linkedDailyEntryDate}
                        </span>
                      )}

                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: isDeduct ? 'rgba(255,59,59,0.08)' : 'rgba(0,230,118,0.08)',
                          color: isDeduct ? '#FF3B3B' : '#00E676',
                          border: `1px solid ${isDeduct ? 'rgba(255,59,59,0.2)' : 'rgba(0,230,118,0.2)'}`,
                        }}
                      >
                        Fonds maintenance
                      </span>
                    </div>
                  );
                }

                // debtPayment
                const color = debt.fromCash ? '#FF3B3B' : '#00E676';
                return (
                  <div className="flex items-center gap-6 flex-1 ml-2">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
                      style={{
                        background: debt.fromCash ? 'rgba(255,59,59,0.1)' : 'rgba(0,230,118,0.1)',
                        border: `1px solid ${debt.fromCash ? 'rgba(255,59,59,0.25)' : 'rgba(0,230,118,0.25)'}`,
                        color,
                      }}
                    >
                      {debt.fromCash ? 'Depuis caisse' : 'Fonds propres'}
                    </div>

                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      Paiement dette
                    </span>
                  </div>
                );
              })();

              const mainTitle = (() => {
                if (item.kind === 'daily') return null; // daily garde son propre layout (date + badge + metrics)
                // Pour maintenance/dette, on affiche le "titre" dans la zone metrics/détails (sans casser design)
                return null;
              })();

              // Point couleur (gauche)
              const dotColor = (() => {
                if (item.kind === 'daily') return typeConfig.color;
                if (item.kind === 'maintenanceTx') {
                  const isDeduct = String(maint.type).includes('deduct');
                  return isDeduct ? '#FF3B3B' : '#00E676';
                }
                // debtPayment
                return debt.fromCash ? '#FF3B3B' : '#00E676';
              })();

              // Préparation delete confirm
              const buildConfirmDelete = (): ConfirmDelete => {
                if (item.kind === 'daily') {
                  return { kind: 'daily', id: daily.id, date: daily.date, title: 'Activité journalière' };
                }
                if (item.kind === 'maintenanceTx') {
                  return { kind: 'maintenanceTx', id: maint.id, date: maint.date, title: maint.label || 'Opération maintenance' };
                }
                return { kind: 'debtPayment', id: debt.id, date: debt.date, title: `${debt.supplier} — ${debt.part}` };
              };

              return (
                <div
                  key={item.uid}
                  className="rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    background: isOpen ? 'rgba(15,20,40,0.9)' : 'rgba(10,14,26,0.8)',
                    border: `1px solid ${isOpen ? typeConfig.color + '25' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {/* Ligne principale */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />

                    <button
                      onClick={() => setOpenId(isOpen ? null : item.uid)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="flex-shrink-0 w-36">
                        <p className="text-white text-sm font-semibold">
                          {new Date(item.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>

                        {/* petite ligne secondaire pour maintenance/dettes (sans casser le design) */}
                        {item.kind !== 'daily' && (
                          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                            {item.title}
                          </p>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{
                          background: typeConfig.bg,
                          border: `1px solid ${typeConfig.color}25`,
                        }}
                      >
                        <TypeIcon className="w-3 h-3" style={{ color: typeConfig.color }} />
                        <span className="text-xs font-medium" style={{ color: typeConfig.color }}>
                          {typeConfig.label}
                        </span>
                      </div>

                      {topMiddleBadges}

                      <div className="text-right flex-shrink-0 mr-2">{mainRightValue}</div>

                      <ChevronDown
                        className="w-4 h-4 text-slate-600 flex-shrink-0 transition-transform duration-300"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(buildConfirmDelete());
                      }}
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ml-2"
                      style={{
                        background: 'rgba(255,59,59,0.06)',
                        border: '1px solid rgba(255,59,59,0.15)',
                      }}
                      title="Supprimer cet enregistrement"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,59,0.15)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,59,59,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,59,0.06)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,59,59,0.15)';
                      }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#FF3B3B' }} />
                    </button>
                  </div>

                  {/* Détail expandable */}
                  <div
                    style={{
                      maxHeight: isOpen ? '600px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.35s ease',
                    }}
                  >
                    <div className="px-5 pb-5">
                      <div
                        className="h-px mb-4"
                        style={{
                          background: `linear-gradient(90deg, ${typeConfig.color}30, transparent)`,
                        }}
                      />

                      {/* ─────────────────────────────────────────────
                          DAILY (identique à ton design existant)
                         ───────────────────────────────────────────── */}
                      {item.kind === 'daily' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                              className="p-4 rounded-2xl space-y-3"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Résumé financier</p>
                              {(daily.dayType || 'normal') === 'normal' && (
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Recette brute</span>
                                    <span className="text-white font-semibold text-sm">{fmt(daily.revenue, currency)}</span>
                                  </div>
                                  {dailyExpTotal > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 text-sm">Charges ({daily.expenses.length})</span>
                                      <span className="text-orange-400 text-sm">- {fmt(dailyExpTotal, currency)}</span>
                                    </div>
                                  )}
                                  {dailyBdTotal > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 text-sm">Pannes ({daily.breakdowns.length})</span>
                                      <span className="text-red-400 text-sm">- {fmt(dailyBdTotal, currency)}</span>
                                    </div>
                                  )}
                                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                  <div className="flex justify-between">
                                    <span className="text-white font-semibold text-sm">Net</span>
                                    <span
                                      className="font-bold text-sm"
                                      style={{ color: daily.netRevenue >= 0 ? '#00E676' : '#FF3B3B' }}
                                    >
                                      {fmt(daily.netRevenue, currency)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {(daily.dayType || 'normal') !== 'normal' && (
                                <div className="space-y-2">
                                  {dailyExpTotal > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 text-sm">Charges</span>
                                      <span className="text-orange-400 text-sm">{fmt(dailyExpTotal, currency)}</span>
                                    </div>
                                  )}
                                  <p className="text-slate-500 text-sm italic">
                                    {(daily.dayType || 'normal') === 'maintenance'
                                      ? "Journée d'entretien — pas de recettes"
                                      : 'Journée sans activité'}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              {daily.expenses.length > 0 && (
                                <div
                                  className="p-4 rounded-2xl"
                                  style={{
                                    background: 'rgba(255,152,0,0.04)',
                                    border: '1px solid rgba(255,152,0,0.1)',
                                  }}
                                >
                                  <p className="text-xs font-bold uppercase tracking-wider text-orange-400/70 mb-2">Charges</p>
                                  <div className="space-y-1.5">
                                    {daily.expenses.slice(0, 4).map((exp: any) => (
                                      <div key={exp.id} className="flex justify-between">
                                        <span className="text-slate-400 text-xs capitalize">
                                          {String(exp.category).replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-white text-xs">{fmt(exp.amount, currency)}</span>
                                      </div>
                                    ))}
                                    {daily.expenses.length > 4 && (
                                      <p className="text-slate-600 text-xs">+{daily.expenses.length - 4} autres...</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {daily.breakdowns.length > 0 && (
                                <div
                                  className="p-4 rounded-2xl"
                                  style={{
                                    background: 'rgba(255,59,59,0.04)',
                                    border: '1px solid rgba(255,59,59,0.1)',
                                  }}
                                >
                                  <p className="text-xs font-bold uppercase tracking-wider text-red-400/70 mb-2">Pannes</p>
                                  <div className="space-y-1.5">
                                    {daily.breakdowns.map((bd: any) => (
                                      <div key={bd.id} className="flex justify-between">
                                        <span className="text-slate-400 text-xs">
                                          {bd.category}
                                          {bd.partChanged ? ` — ${bd.partChanged}` : ''}
                                        </span>
                                        <span className="text-red-400 text-xs">{fmt(bd.amount, currency)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {daily.comment && (
                            <div
                              className="mt-3 p-3 rounded-xl"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <p className="text-slate-500 text-xs">💬 {daily.comment}</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* ─────────────────────────────────────────────
                          MAINTENANCE TX (même structure/design)
                         ───────────────────────────────────────────── */}
                      {item.kind === 'maintenanceTx' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                              className="p-4 rounded-2xl space-y-3"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Résumé</p>

                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Libellé</span>
                                  <span className="text-white font-semibold text-sm">{maint.label}</span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Type</span>
                                  <span className="text-white text-sm">
                                    {maint.type === 'add_from_cash'
                                      ? 'Ajout depuis caisse'
                                      : maint.type === 'add_personal'
                                      ? 'Ajout fonds propres'
                                      : maint.type === 'deduct_from_daily'
                                      ? 'Déduit depuis activité'
                                      : 'Dépense'}
                                  </span>
                                </div>

                                {maint.linkedDailyEntryDate && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Lien</span>
                                    <span className="text-white text-sm">lié au {maint.linkedDailyEntryDate}</span>
                                  </div>
                                )}

                                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                                <div className="flex justify-between">
                                  <span className="text-white font-semibold text-sm">Montant</span>
                                  <span
                                    className="font-bold text-sm"
                                    style={{ color: String(maint.type).includes('deduct') ? '#FF3B3B' : '#00E676' }}
                                  >
                                    {String(maint.type).includes('deduct') ? '-' : '+'}
                                    {fmt(maint.amount, currency)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div
                                className="p-4 rounded-2xl"
                                style={{
                                  background: 'rgba(255,193,7,0.04)',
                                  border: '1px solid rgba(255,193,7,0.1)',
                                }}
                              >
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-400/70 mb-2">
                                  Détails
                                </p>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Catégorie</span>
                                    <span className="text-white text-xs">Fonds de maintenance</span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Impact</span>
                                    <span
                                      className="text-xs"
                                      style={{ color: String(maint.type).includes('deduct') ? '#FF3B3B' : '#00E676' }}
                                    >
                                      {String(maint.type).includes('deduct') ? 'Sortie' : 'Entrée'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Optionnel : "note" style commentaire */}
                              {maint.label && (
                                <div
                                  className="p-3 rounded-xl"
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                  }}
                                >
                                  <p className="text-slate-500 text-xs">💬 {maint.label}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ─────────────────────────────────────────────
                          DEBT PAYMENT (même structure/design)
                         ───────────────────────────────────────────── */}
                      {item.kind === 'debtPayment' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                              className="p-4 rounded-2xl space-y-3"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Résumé</p>

                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Fournisseur</span>
                                  <span className="text-white font-semibold text-sm">{debt.supplier}</span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Pièce</span>
                                  <span className="text-white text-sm">{debt.part}</span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Source</span>
                                  <span className="text-white text-sm">{debt.fromCash ? 'Caisse' : 'Fonds propres'}</span>
                                </div>

                                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                                <div className="flex justify-between">
                                  <span className="text-white font-semibold text-sm">Paiement</span>
                                  <span
                                    className="font-bold text-sm"
                                    style={{ color: debt.fromCash ? '#FF3B3B' : '#00E676' }}
                                  >
                                    -{fmt(debt.amount, currency)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div
                                className="p-4 rounded-2xl"
                                style={{
                                  background: 'rgba(0,230,118,0.04)',
                                  border: '1px solid rgba(0,230,118,0.1)',
                                }}
                              >
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/70 mb-2">
                                  Détails
                                </p>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Type</span>
                                    <span className="text-white text-xs">Paiement de dette</span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Impact</span>
                                    <span className="text-xs" style={{ color: debt.fromCash ? '#FF3B3B' : '#00E676' }}>
                                      Sortie ({debt.fromCash ? 'caisse' : 'fonds propres'})
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Référence</span>
                                    <span className="text-white text-xs">ID dette: {debt.debtId}</span>
                                  </div>
                                </div>
                              </div>

                              <div
                                className="p-3 rounded-xl"
                                style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid rgba(255,255,255,0.05)',
                                }}
                              >
                                <p className="text-slate-500 text-xs">💬 {debt.supplier} — {debt.part}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {mainTitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}