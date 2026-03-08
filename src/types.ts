export type DayType = 'normal' | 'maintenance' | 'inactive';

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  liters?: number;
  comment?: string;
  isAutomated?: boolean;
  automationId?: string;
}

export interface BreakdownItem {
  id: string;
  category: string;
  partChanged?: string;
  cause?: string;
  amount: number;
}

export interface DailyEntry {
  id: string;
  date: string;
  dayType?: DayType;
  deductFrom?: 'cash' | 'maintenance';
  revenue: number;
  expenses: ExpenseItem[];
  breakdowns: BreakdownItem[];
  netRevenue: number;
  comment: string;
}

export interface Debt {
  id: string;
  supplier: string;
  supplierType: 'mechanic' | 'wholesaler' | 'other';
  part: string;
  amount: number;
  remainingAmount: number;
  dateCreated: string;
  dateDue?: string;
  status: 'pending' | 'partial' | 'paid';
  notes?: string;
}

export interface ProvisionalDebt {
  id: string;
  label: string;
  originalDebtId?: string;
  amount: number;
  dateCreated: string;
  status: 'provisional' | 'confirmed' | 'cancelled';
  notes?: string;
}

export interface Automation {
  id: string;
  name: string;
  category: string;
  amount: number;
  liters?: number;
  comment?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  amount?: number;
  status: 'pending' | 'completed' | 'late';
  reminderDays?: number;
}

export type AutomationTask = Automation;

export interface Part {
  id: string;
  name: string;
  installedDate: string;
  knownDurationDays?: number;
}

export interface PartStudyCycle {
  id: string;
  purchaseDate: string;
  degradationDate: string;
  durationDays: number;
  notes?: string;
}

export interface PartStudy {
  id: string;
  partName: string;
  cycles: PartStudyCycle[];
  averageDurationDays: number;
}

/** ✅ Documents uploadés (pièces, reçus, etc.) */
export type DocumentScope = 'staff' | 'admin';
export type StaffPerson = 'collaborator' | 'driver' | 'controller';

export interface StoredDocument {
  id: string;
  scope: DocumentScope;
  person?: StaffPerson;     // seulement si scope === 'staff'
  category: string;         // ex: "Assurance", "Taxes", "Pièce ID", etc.
  title: string;            // nom visible
  date: string;             // YYYY-MM-DD
  note?: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;          // base64 (image/pdf)
}

/** ✅ Corrections Dashboard (ne change PAS les pages de données) */
export interface DashboardOverrides {
  cashBalance?: number | null;
  maintenanceFund?: number | null;
  todayRevenueBrut?: number | null;
  todayNet?: number | null;
  monthRevenueBrut?: number | null;
  monthNet?: number | null;
  totalDebt?: number | null;
  totalExpenses?: number | null;
  totalBreakdowns?: number | null;
  unpaidDebtCount?: number | null;
}

export interface Settings {
  currency: string;
  vehicleName: string;
  vehiclePlate: string;

  adminPin?: string;
  collaboratorPin?: string;

  syncEnabled?: boolean;
  maxMaintenanceFund?: number;

  staff: {
    collaboratorName: string;
    collaboratorPhone?: string;
    driverName?: string;
    driverPhone?: string;
    controllerName?: string;
    controllerPhone?: string;
  };

  /** ✅ affichage Dashboard corrigé si besoin */
  dashboardOverrides?: DashboardOverrides;
}