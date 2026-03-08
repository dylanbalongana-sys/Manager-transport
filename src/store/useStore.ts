import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DailyEntry,
  Debt,
  ProvisionalDebt,
  Automation,
  Objective,
  Settings,
  Part,
  PartStudy,
  StoredDocument,
  DashboardOverrides,
} from '../types';

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type MaintenanceTxType = 'add_personal' | 'add_from_cash' | 'deduct' | 'deduct_from_daily';

export interface MaintenanceTransaction {
  id: string;
  type: MaintenanceTxType;
  amount: number;
  label: string;
  date: string;
  linkedDailyEntryDate?: string;
}

interface StoreState {
  dailyEntries: DailyEntry[];
  debts: Debt[];
  provisionalDebts: ProvisionalDebt[];
  automations: Automation[];
  objectives: Objective[];
  cashBalance: number;
  maintenanceFund: number;
  cashDeductions: number;
  settings: Settings;
  parts: Part[];
  partStudies: PartStudy[];
  debtPayments: {
    id: string;
    debtId: string;
    supplier: string;
    part: string;
    amount: number;
    fromCash: boolean;
    date: string;
  }[];
  lastAccountingDate: string | null;

  maintenanceTransactions: MaintenanceTransaction[];

  /** ✅ Documents (PDF + Images) */
  documents: StoredDocument[];

  addMaintenanceTransaction: (tx: Omit<MaintenanceTransaction, 'id'>) => void;
  setMaintenanceTransactions: (txs: MaintenanceTransaction[]) => void;

  // ✅ suppression HISTORIQUE uniquement
  deleteMaintenanceTransaction: (id: string) => void;
  deleteDebtPayment: (id: string) => void;

  addDailyEntry: (entry: DailyEntry) => void;
  updateDailyEntry: (id: string, entry: DailyEntry) => void;

  // ✅ suppression HISTORIQUE uniquement (AUCUN recalcul)
  deleteDailyEntry: (id: string) => void;

  setDailyEntries: (entries: DailyEntry[]) => void;

  addDebt: (debt: Debt) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  setDebts: (debts: Debt[]) => void;
  payDebt: (id: string, amount: number, fromCash: boolean) => void;

  addProvisionalDebt: (pd: ProvisionalDebt) => void;
  updateProvisionalDebt: (id: string, pd: Partial<ProvisionalDebt>) => void;
  deleteProvisionalDebt: (id: string) => void;
  setProvisionalDebts: (pds: ProvisionalDebt[]) => void;

  addAutomation: (automation: Automation) => void;
  updateAutomation: (id: string, automation: Partial<Automation>) => void;
  deleteAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  setAutomations: (automations: Automation[]) => void;

  addObjective: (objective: Objective) => void;
  updateObjective: (id: string, objective: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  setObjectives: (objectives: Objective[]) => void;

  addPart: (part: Part) => void;
  updatePart: (id: string, part: Partial<Part>) => void;
  deletePart: (id: string) => void;
  setParts: (parts: Part[]) => void;

  addPartStudy: (study: PartStudy) => void;
  updatePartStudy: (id: string, study: Partial<PartStudy>) => void;
  deletePartStudy: (id: string) => void;
  setPartStudies: (studies: PartStudy[]) => void;

  closeAccounting: () => void;
  setCashBalance: (amount: number) => void;
  setMaintenanceFund: (amount: number) => void;

  addToMaintenanceFund: (amount: number, fromCash: boolean, label?: string) => void;
  deductFromMaintenanceFund: (amount: number, label?: string, linkedDailyEntryDate?: string) => void;
  deductFromCash: (amount: number) => void;

  updateSettings: (settings: Partial<Settings>) => void;

  /** ✅ Corrections KPI Dashboard */
  setDashboardOverrides: (overrides: DashboardOverrides) => void;
  clearDashboardOverrides: () => void;

  /** ✅ Documents */
  addDocument: (doc: Omit<StoredDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;
  setDocuments: (docs: StoredDocument[]) => void;
}

/* ─── Helpers ─────────────────────────────────────────────── */
function calcNormalNet(entries: DailyEntry[]): number {
  return entries
    .filter(e => (e.dayType || 'normal') === 'normal')
    .reduce((sum, e) => sum + (e.netRevenue || 0), 0);
}

function calcAllMaintenanceCashCost(entries: DailyEntry[]): number {
  return entries
    .filter(e => e.dayType === 'maintenance' && (e as any).deductFrom === 'cash')
    .reduce((sum, e) => {
      return (
        sum +
        e.expenses.reduce((s, ex) => s + (ex.amount || 0), 0) +
        e.breakdowns.reduce((s, b) => s + (b.amount || 0), 0)
      );
    }, 0);
}

function computeDebtStatus(debt: any) {
  const amount = typeof debt.amount === 'number' ? debt.amount : 0;
  const remaining = typeof debt.remainingAmount === 'number' ? debt.remainingAmount : 0;
  if (remaining <= 0) return 'paid';
  if (amount > 0 && remaining >= amount) return 'pending';
  return 'partial';
}

/* ─── Store ───────────────────────────────────────────────── */
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      dailyEntries: [],
      debts: [],
      provisionalDebts: [],
      automations: [],
      objectives: [],
      cashBalance: 0,
      maintenanceFund: 0,
      cashDeductions: 0,
      maintenanceTransactions: [],
      documents: [],

      settings: {
        currency: 'FC',
        vehicleName: 'Hiace Congo BZV',
        vehiclePlate: 'BZV-4821-A',
        adminPin: '1234',
        collaboratorPin: '0000',
        syncEnabled: false,
        maxMaintenanceFund: 150000,
        staff: {
          collaboratorName: 'Collaborateur',
          collaboratorPhone: '',
          driverName: '',
          driverPhone: '',
          controllerName: '',
          controllerPhone: '',
        },
        dashboardOverrides: {},
      },

      parts: [],
      partStudies: [],
      debtPayments: [],
      lastAccountingDate: null,

      /* ─ Maintenance transactions ─ */
      addMaintenanceTransaction: (tx) =>
        set((s) => ({
          maintenanceTransactions: [{ id: uid(), ...tx }, ...s.maintenanceTransactions],
        })),

      setMaintenanceTransactions: (txs) => set({ maintenanceTransactions: txs }),

      // ✅ SUPPRESSION HISTORIQUE UNIQUEMENT
      deleteMaintenanceTransaction: (id) =>
        set((s) => ({
          maintenanceTransactions: (s.maintenanceTransactions || []).filter((tx) => tx.id !== id),
        })),

      // ✅ SUPPRESSION HISTORIQUE UNIQUEMENT
      deleteDebtPayment: (id) =>
        set((s) => ({
          debtPayments: (s.debtPayments || []).filter((p) => p.id !== id),
        })),

      /* ─ Daily ─ */
      addDailyEntry: (entry) =>
        set((s) => {
          const newEntries = [entry, ...s.dailyEntries];

          // ✅ Cash recalcul (comme avant)
          const normalNet = calcNormalNet(newEntries);
          const maintenanceCash = calcAllMaintenanceCashCost(newEntries);
          const newCash = normalNet - s.cashDeductions - maintenanceCash;

          return { dailyEntries: newEntries, cashBalance: newCash };
        }),

      updateDailyEntry: (id, entry) =>
        set((s) => {
          const newEntries = s.dailyEntries.map((e) => (e.id === id ? entry : e));

          const normalNet = calcNormalNet(newEntries);
          const maintenanceCash = calcAllMaintenanceCashCost(newEntries);
          const newCash = normalNet - s.cashDeductions - maintenanceCash;

          return { dailyEntries: newEntries, cashBalance: newCash };
        }),

      // ✅ IMPORTANT : suppression HISTORIQUE UNIQUEMENT (AUCUN recalcul)
      deleteDailyEntry: (id) =>
        set((s) => ({
          dailyEntries: s.dailyEntries.filter((e) => e.id !== id),
        })),

      setDailyEntries: (entries) => set({ dailyEntries: entries }),

      /* ─ Debts ─ */
      addDebt: (debt) => set((s) => ({ debts: [...s.debts, debt] })),
      updateDebt: (id, debt) => set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...debt } : d)) })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      setDebts: (debts) => set({ debts }),

      payDebt: (id: string, amount: number, fromCash: boolean) =>
        set((s) => {
          const debt: any = s.debts.find((d) => d.id === id);
          if (!debt) return s;

          const newRemaining = Math.max(0, (debt.remainingAmount || 0) - amount);
          const newStatus: 'paid' | 'partial' = newRemaining === 0 ? 'paid' : 'partial';

          const newDebts = s.debts.map((d) =>
            d.id === id ? ({ ...(d as any), remainingAmount: newRemaining, status: newStatus } as any) : d
          );

          const payment = {
            id: uid(),
            debtId: id,
            supplier: (debt as any).supplier,
            part: (debt as any).part,
            amount,
            fromCash,
            date: new Date().toISOString().split('T')[0],
          };

          const newPayments = [...(s.debtPayments || []), payment];

          if (fromCash) {
            const newDeductions = s.cashDeductions + amount;
            const normalNet = calcNormalNet(s.dailyEntries);
            const maintenanceCash = calcAllMaintenanceCashCost(s.dailyEntries);

            return {
              debts: newDebts,
              cashDeductions: newDeductions,
              cashBalance: normalNet - newDeductions - maintenanceCash,
              debtPayments: newPayments,
            };
          }

          return { debts: newDebts, debtPayments: newPayments };
        }),

      /* ─ Provisional debts ─ */
      addProvisionalDebt: (pd) => set((s) => ({ provisionalDebts: [...s.provisionalDebts, pd] })),
      updateProvisionalDebt: (id, pd) => set((s) => ({ provisionalDebts: s.provisionalDebts.map((p) => (p.id === id ? { ...p, ...pd } : p)) })),

      deleteProvisionalDebt: (id) =>
        set((s) => {
          const pd = s.provisionalDebts.find((p) => p.id === id);
          if (!pd) return s;

          let newDebts = s.debts;

          if (pd.originalDebtId) {
            newDebts = s.debts.map((d: any) => {
              if (d.id !== pd.originalDebtId) return d;

              const originalAmount = typeof d.amount === 'number' ? d.amount : 0;
              const currentRemaining = typeof d.remainingAmount === 'number' ? d.remainingAmount : 0;

              const restoredRemaining = Math.min(originalAmount, currentRemaining + pd.amount);
              const updated = { ...d, remainingAmount: restoredRemaining };
              return { ...updated, status: computeDebtStatus(updated) };
            });
          }

          return {
            provisionalDebts: s.provisionalDebts.filter((p) => p.id !== id),
            debts: newDebts,
          };
        }),

      setProvisionalDebts: (pds) => set({ provisionalDebts: pds }),

      /* ─ Automations ─ */
      addAutomation: (automation) => set((s) => ({ automations: [...s.automations, automation] })),
      updateAutomation: (id, automation) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, ...automation } : a)) })),
      deleteAutomation: (id) => set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })),
      toggleAutomation: (id) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)) })),
      setAutomations: (automations) => set({ automations }),

      /* ─ Objectives ─ */
      addObjective: (objective) => set((s) => ({ objectives: [...s.objectives, objective] })),
      updateObjective: (id, objective) => set((s) => ({ objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...objective } : o)) })),
      deleteObjective: (id) => set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) })),
      setObjectives: (objectives) => set({ objectives }),

      /* ─ Parts ─ */
      addPart: (part) => set((s) => ({ parts: [...s.parts, part] })),
      updatePart: (id, part) => set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, ...part } : p)) })),
      deletePart: (id) => set((s) => ({ parts: s.parts.filter((p) => p.id !== id) })),
      setParts: (parts) => set({ parts }),

      /* ─ Part studies ─ */
      addPartStudy: (study) => set((s) => ({ partStudies: [...s.partStudies, study] })),
      updatePartStudy: (id, study) => set((s) => ({ partStudies: s.partStudies.map((ps) => (ps.id === id ? { ...ps, ...study } : ps)) })),
      deletePartStudy: (id) => set((s) => ({ partStudies: s.partStudies.filter((ps) => ps.id !== id) })),
      setPartStudies: (studies) => set({ partStudies: studies }),

      /* ─ Funds ─ */
      setCashBalance: (amount) => set({ cashBalance: amount }),
      setMaintenanceFund: (amount) => set({ maintenanceFund: amount }),

      addToMaintenanceFund: (amount, fromCash, label) =>
        set((s) => {
          const MAX = s.settings.maxMaintenanceFund || 150000;

          if (s.maintenanceFund + amount > MAX) {
            alert(`Le fonds maintenance ne peut pas dépasser ${MAX} ${s.settings.currency || 'FC'}`);
            return s;
          }

          const today = new Date().toISOString().split('T')[0];

          const newDeductions = fromCash ? s.cashDeductions + amount : s.cashDeductions;
          const normalNet = calcNormalNet(s.dailyEntries);
          const maintenanceCash = calcAllMaintenanceCashCost(s.dailyEntries);

          const newCash = fromCash ? normalNet - newDeductions - maintenanceCash : s.cashBalance;

          const tx = {
            id: uid(),
            type: fromCash ? 'add_from_cash' : 'add_personal',
            amount,
            label: label || (fromCash ? 'Depuis la caisse' : 'Ajout personnel'),
            date: today,
          };

          return {
            maintenanceFund: s.maintenanceFund + amount,
            cashBalance: newCash,
            cashDeductions: newDeductions,
            maintenanceTransactions: [tx, ...s.maintenanceTransactions],
          };
        }),

      deductFromMaintenanceFund: (amount, label, linkedDailyEntryDate) =>
        set((s) => {
          if (s.maintenanceFund - amount < 0) {
            alert('Fonds maintenance insuffisants');
            return s;
          }

          const today = new Date().toISOString().split('T')[0];

          const tx = {
            id: uid(),
            type: linkedDailyEntryDate ? 'deduct_from_daily' : 'deduct',
            amount,
            label: label || 'Dépense maintenance',
            date: today,
            linkedDailyEntryDate,
          };

          return {
            maintenanceFund: s.maintenanceFund - amount,
            maintenanceTransactions: [tx, ...s.maintenanceTransactions],
          };
        }),

      deductFromCash: (amount) =>
        set((s) => {
          const newDeductions = s.cashDeductions + amount;
          const normalNet = calcNormalNet(s.dailyEntries);
          const maintenanceCash = calcAllMaintenanceCashCost(s.dailyEntries);

          return {
            cashBalance: normalNet - newDeductions - maintenanceCash,
            cashDeductions: newDeductions,
          };
        }),

      closeAccounting: () => set({ lastAccountingDate: new Date().toISOString().split('T')[0] }),

      updateSettings: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),

      /* ─ KPI Overrides ─ */
      setDashboardOverrides: (overrides: DashboardOverrides) =>
        set((s) => ({
          settings: {
            ...s.settings,
            dashboardOverrides: {
              ...(s.settings.dashboardOverrides || {}),
              ...overrides,
            },
          },
        })),

      clearDashboardOverrides: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            dashboardOverrides: {},
          },
        })),

      /* ─ Documents ─ */
      addDocument: (doc) =>
        set((s) => ({
          documents: [{ id: uid(), ...doc }, ...(s.documents || [])],
        })),

      deleteDocument: (id) =>
        set((s) => ({
          documents: (s.documents || []).filter((d) => d.id !== id),
        })),

      setDocuments: (docs) => set({ documents: docs }),

      _get: get,
    }),
    { name: 'hiace-congo-store' }
  )
);