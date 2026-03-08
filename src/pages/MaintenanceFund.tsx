import { useState } from 'react';
import { Wrench, ArrowLeftRight, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

function fmt(n: number, currency = 'FC') {
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

type Tab = 'add_personal' | 'add_from_cash' | 'deduct';

export default function MaintenanceFund() {
  const {
    maintenanceFund,
    cashBalance,
    addToMaintenanceFund,
    deductFromMaintenanceFund,
    settings,
    maintenanceTransactions,
  } = useStore();

  const currency = settings.currency || 'FC';
  const maxFund = 150000;

  const [tab, setTab] = useState<Tab>('add_personal');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [saved, setSaved] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);

  const pct = Math.min(100, Math.round((maintenanceFund / maxFund) * 100));
  const gaugeColor = pct >= 60 ? '#00E676' : pct >= 30 ? '#FFC107' : '#FF3B3B';

  const openConfirm = (text: string, action: () => void) => {
    setConfirmText(text);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmText('');
    setConfirmAction(null);
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    const desc = (label || '').trim();

    if (tab === 'add_personal') {
      const newTotal = maintenanceFund + amt;
      if (newTotal > maxFund) return alert(`Le fonds ne peut pas dépasser ${fmt(maxFund, currency)}`);

      const text =
        `Vous allez AJOUTER ${fmt(amt, currency)} au fonds de maintenance.\n\n` +
        `Source : Fonds propres\n` +
        `Description : ${desc || 'Ajout personnel'}\n\n` +
        `Confirmer ?`;

      return openConfirm(text, () => {
        addToMaintenanceFund(amt, false, desc || 'Ajout personnel');
        setAmount('');
        setLabel('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        closeConfirm();
      });
    }

    if (tab === 'add_from_cash') {
      if (cashBalance < amt) return alert('Montant supérieur à la caisse disponible');

      const newTotal = maintenanceFund + amt;
      if (newTotal > maxFund) return alert(`Le fonds ne peut pas dépasser ${fmt(maxFund, currency)}`);

      const text =
        `Vous allez AJOUTER ${fmt(amt, currency)} au fonds de maintenance.\n\n` +
        `Source : Caisse actuelle\n` +
        `Description : ${desc || 'Depuis la caisse'}\n\n` +
        `Confirmer ?`;

      return openConfirm(text, () => {
        addToMaintenanceFund(amt, true, desc || 'Depuis la caisse');
        setAmount('');
        setLabel('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        closeConfirm();
      });
    }

    if (amt > maintenanceFund) return alert('Fonds insuffisants (le fonds maintenance ne peut pas être négatif)');

    const text =
      `Vous allez RETIRER ${fmt(amt, currency)} du fonds de maintenance.\n\n` +
      `Description : ${desc || 'Dépense maintenance'}\n\n` +
      `Confirmer ?`;

    return openConfirm(text, () => {
      deductFromMaintenanceFund(amt, desc || 'Dépense maintenance');
      setAmount('');
      setLabel('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      closeConfirm();
    });
  };

  const tabBtnStyle = (active: boolean, color: string) => ({
    background: active ? `${color}22` : 'transparent',
    border: `1px solid ${active ? `${color}66` : 'rgba(255,255,255,0.08)'}`,
    color: active ? color : '#9AA4B2',
  });

  return (
    <div className="min-h-screen relative" style={{ background: '#0D0A06' }}>
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-md w-full rounded-3xl p-7"
              style={{ background: 'rgba(26,18,8,0.95)', border: '1px solid rgba(184,115,51,0.25)' }}
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
            >
              <h3 className="text-white font-extrabold text-lg mb-3">Confirmation</h3>
              <pre className="whitespace-pre-wrap text-sm mb-6" style={{ color: '#9AA4B2' }}>
                {confirmText}
              </pre>
              <div className="flex gap-3">
                <button
                  onClick={closeConfirm}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#9AA4B2' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => confirmAction && confirmAction()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(184,115,51,0.22)', border: '1px solid rgba(184,115,51,0.40)', color: '#fff' }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div
          className="mb-10 rounded-3xl p-8 relative overflow-hidden"
          style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(184,115,51,0.2)' }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(184,115,51,0.2)', border: '1px solid rgba(184,115,51,0.3)' }}
                >
                  <Wrench className="w-6 h-6" style={{ color: '#B87333' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white">Frais de Maintenance</h1>
                  <p className="text-sm" style={{ color: '#9AA4B2' }}>
                    Caisse dédiée à l&apos;entretien du véhicule
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: gaugeColor }} />
              <span className="text-sm font-medium" style={{ color: gaugeColor }}>
                {pct >= 60 ? 'Fonds suffisant' : pct >= 30 ? 'Fonds moyen' : 'Fonds critique'}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>
                  Disponible
                </p>
                <p className="text-4xl font-extrabold" style={{ color: gaugeColor }}>
                  {fmt(maintenanceFund, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs mb-1" style={{ color: '#9AA4B2' }}>
                  Maximum
                </p>
                <p className="text-xl font-bold text-white">{fmt(maxFund, currency)}</p>
              </div>
            </div>
          </div>

          <div
            className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <ArrowLeftRight className="w-4 h-4" style={{ color: '#9AA4B2' }} />
            <p className="text-sm" style={{ color: '#9AA4B2' }}>
              Caisse actuelle disponible : <span className="font-bold text-white">{fmt(cashBalance, currency)}</span>
            </p>
          </div>
        </div>

        <div
          className="mb-8 rounded-3xl p-8"
          style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(184,115,51,0.15)' }}
        >
          <h2 className="text-lg font-bold text-white mb-6">Opération sur le fonds</h2>

          <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => setTab('add_personal')}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={tabBtnStyle(tab === 'add_personal', '#00E676')}
            >
              + Argent personnel
            </button>
            <button
              onClick={() => setTab('add_from_cash')}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={tabBtnStyle(tab === 'add_from_cash', '#FFC107')}
            >
              + Depuis caisse
            </button>
            <button
              onClick={() => setTab('deduct')}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={tabBtnStyle(tab === 'deduct', '#FF3B3B')}
            >
              - Dépense
            </button>
          </div>

          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Montant"
            className="w-full mb-3 px-4 py-3 rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />

          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Description"
            className="w-full mb-4 px-4 py-3 rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{
              background: saved ? 'rgba(0,230,118,0.20)' : 'rgba(184,115,51,0.22)',
              border: saved ? '1px solid rgba(0,230,118,0.45)' : '1px solid rgba(184,115,51,0.35)',
              color: '#fff',
            }}
          >
            {saved ? '✓ Enregistré' : 'Confirmer'}
          </button>
        </div>

        {maintenanceTransactions.length > 0 && (
          <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(184,115,51,0.15)' }}>
            <div className="px-6 py-4 flex items-center gap-2">
              <History className="w-4 h-4" style={{ color: '#B87333' }} />
              <h3 className="text-white font-semibold text-sm">Historique des opérations</h3>
            </div>

            <div>
              {maintenanceTransactions.map(tx => (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{tx.label}</p>
                    <p className="text-xs" style={{ color: '#9AA4B2' }}>{tx.date}</p>
                  </div>

                  <p
                    className="font-bold text-sm"
                    style={{ color: tx.type.includes('deduct') ? '#FF3B3B' : '#00E676' }}
                  >
                    {tx.type.includes('deduct') ? '-' : '+'}{fmt(tx.amount, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}