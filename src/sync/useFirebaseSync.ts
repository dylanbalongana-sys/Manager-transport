import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store/useStore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
type Role = 'admin' | 'collaborator' | null;

/**
 * Supprime récursivement toutes les valeurs undefined
 * pour éviter l'erreur Firestore :
 * Unsupported field value: undefined
 */
function removeUndefinedDeep(value: any): any {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};

    Object.entries(value).forEach(([key, val]) => {
      const cleanedVal = removeUndefinedDeep(val);
      if (cleanedVal !== undefined) {
        cleaned[key] = cleanedVal;
      }
    });

    return cleaned;
  }

  return value;
}

export function useFirebaseSync(enabled: boolean, role: Role) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const isApplyingRemoteRef = useRef(false);
  const uploadTimerRef = useRef<number | null>(null);

  // ✅ nouveau : on attend la toute première lecture Firebase
  const hasCheckedRemoteRef = useRef(false);
  const remoteDocExistsRef = useRef(false);

  const store = useStore();

  const localPayload = useMemo(() => {
    if (!enabled) return null;

    const safeSettings: any = { ...(store.settings || {}) };

    if (role === 'collaborator') {
      delete safeSettings.adminPin;
    }

    const rawData: any = {
      dailyEntries: store.dailyEntries || [],
      debts: store.debts || [],
      provisionalDebts: store.provisionalDebts || [],
      automations: store.automations || [],
      objectives: store.objectives || [],

      cashBalance: store.cashBalance ?? 0,
      maintenanceFund: store.maintenanceFund ?? 0,
      cashDeductions: store.cashDeductions ?? 0,

      debtPayments: store.debtPayments || [],
      lastAccountingDate: store.lastAccountingDate ?? null,

      parts: store.parts || [],
      partStudies: store.partStudies || [],

      maintenanceTransactions: (store as any).maintenanceTransactions || [],
      documents: (store as any).documents || [],

      settings: safeSettings,

      updatedAt: new Date().toISOString(),
      updatedByRole: role || 'unknown',
    };

    return removeUndefinedDeep(rawData);
  }, [
    enabled,
    role,
    store.dailyEntries,
    store.debts,
    store.provisionalDebts,
    store.automations,
    store.objectives,
    store.cashBalance,
    store.maintenanceFund,
    store.cashDeductions,
    store.debtPayments,
    store.lastAccountingDate,
    store.parts,
    store.partStudies,
    (store as any).maintenanceTransactions,
    (store as any).documents,
    store.settings,
  ]);

  const uploadToCloud = async () => {
    if (!enabled) return;
    if (!localPayload) return;
    if (!role) return;

    try {
      setStatus('syncing');
      await setDoc(doc(db, 'shared', 'hiace-data'), localPayload, { merge: true });
      setStatus('synced');
      setLastSync(new Date());
    } catch (e) {
      console.error('Firebase upload error', e);
      setStatus('error');
    }
  };

  // ✅ Écoute Firebase d'abord
  useEffect(() => {
    if (!enabled) return;
    if (!role) return;

    setStatus('syncing');
    hasCheckedRemoteRef.current = false;

    const unsubscribe = onSnapshot(
      doc(db, 'shared', 'hiace-data'),
      (snapshot) => {
        hasCheckedRemoteRef.current = true;

        if (!snapshot.exists()) {
          remoteDocExistsRef.current = false;
          setStatus('idle');
          return;
        }

        remoteDocExistsRef.current = true;

        const data: any = snapshot.data() || {};
        isApplyingRemoteRef.current = true;

        try {
          if (data.dailyEntries) store.setDailyEntries(data.dailyEntries);
          if (data.debts) store.setDebts(data.debts);
          if (data.provisionalDebts) store.setProvisionalDebts(data.provisionalDebts);
          if (data.automations) store.setAutomations(data.automations);
          if (data.objectives) store.setObjectives(data.objectives);

          if (typeof data.cashBalance === 'number') store.setCashBalance(data.cashBalance);
          if (typeof data.maintenanceFund === 'number') store.setMaintenanceFund(data.maintenanceFund);

          if (typeof data.cashDeductions === 'number') {
            useStore.setState({ cashDeductions: data.cashDeductions });
          }

          if (data.debtPayments) {
            useStore.setState({ debtPayments: data.debtPayments });
          }

          if ('lastAccountingDate' in data) {
            useStore.setState({ lastAccountingDate: data.lastAccountingDate ?? null });
          }

          if (data.parts) store.setParts(data.parts);
          if (data.partStudies) store.setPartStudies(data.partStudies);

          if (data.maintenanceTransactions) {
            const setMaintenanceTransactions = (store as any).setMaintenanceTransactions;
            if (typeof setMaintenanceTransactions === 'function') {
              setMaintenanceTransactions(data.maintenanceTransactions);
            } else {
              useStore.setState({ maintenanceTransactions: data.maintenanceTransactions });
            }
          }

          if (data.documents) {
            const setDocuments = (store as any).setDocuments;
            if (typeof setDocuments === 'function') {
              setDocuments(data.documents);
            } else {
              useStore.setState({ documents: data.documents });
            }
          }

          if (data.settings) {
            const currentLocalSettings: any = { ...(useStore.getState().settings || {}) };
            const incomingSettings: any = { ...data.settings };

            if (role === 'collaborator') {
              delete incomingSettings.adminPin;
            }

            // ✅ on garde la valeur locale de syncEnabled
            incomingSettings.syncEnabled = currentLocalSettings.syncEnabled;

            store.updateSettings(incomingSettings);
          }

          setStatus('synced');
          setLastSync(new Date());
        } catch (e) {
          console.error('Firebase apply error', e);
          setStatus('error');
        } finally {
          window.setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 350);
        }
      },
      (error) => {
        console.error('Firebase sync error', error);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [enabled, role]);

  // ✅ Upload seulement APRÈS la première lecture Firebase
  useEffect(() => {
    if (!enabled) return;
    if (!role) return;
    if (!localPayload) return;

    // on attend la première réponse du cloud
    if (!hasCheckedRemoteRef.current) return;

    // si on applique une donnée venant de Firebase, pas d'upload
    if (isApplyingRemoteRef.current) return;

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
    }

    uploadTimerRef.current = window.setTimeout(() => {
      uploadToCloud();
    }, 550);

    return () => {
      if (uploadTimerRef.current) window.clearTimeout(uploadTimerRef.current);
      uploadTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, role, localPayload]);

  return { status, lastSync, uploadToCloud };
}