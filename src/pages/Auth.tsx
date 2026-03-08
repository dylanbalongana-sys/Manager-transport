import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface AuthProps {
  onLogin: (role: 'admin' | 'collaborator') => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const { settings } = useStore();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const adminPin = settings.adminPin || '1234';
  const collabPin = settings.collaboratorPin || '0000';

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    if (newPin.every((d) => d !== '')) {
      const entered = newPin.join('');
      setTimeout(() => checkPin(entered), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
    }
  };

  const checkPin = (entered: string) => {
    if (entered === adminPin) {
      onLogin('admin');
    } else if (entered === collabPin) {
      onLogin('collaborator');
    } else {
      setShake(true);
      setError('Code PIN incorrect');
      setTimeout(() => {
        setShake(false);
        setPin(['', '', '', '']);
        inputs.current[0]?.focus();
      }, 600);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#05070D' }}
    >
      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.07, filter: 'blur(3px)' }}
        alt=""
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,230,118,0.08) 0%, transparent 70%)' }} />

      {/* Grid */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      {/* Particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 3 + 1.5,
            height: Math.random() * 3 + 1.5,
            background: i % 3 === 0 ? '#00E676' : i % 3 === 1 ? '#FFC107' : '#FF3B3B',
            boxShadow: `0 0 8px ${i % 3 === 0 ? '#00E676' : i % 3 === 1 ? '#FFC107' : '#FF3B3B'}`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: Math.random() * 4 + 3, delay: Math.random() * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: 'rgba(10,14,26,0.92)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
        >
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-3xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.4), transparent)' }} />

          {/* Logo */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.2), rgba(255,193,7,0.1))', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <span className="text-4xl">🚌</span>
            <div className="absolute -inset-1 rounded-3xl" style={{ background: 'rgba(0,230,118,0.08)', filter: 'blur(8px)' }} />
          </motion.div>

          <h1 className="text-2xl font-extrabold text-white mb-1">Hiace Congo</h1>
          <p className="text-slate-400 text-sm mb-8">Entrez votre code PIN pour accéder</p>

          {/* PIN inputs */}
          <motion.div
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-4 mb-6"
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-bold text-white rounded-2xl focus:outline-none transition-all"
                style={{
                  background: 'rgba(15,20,40,0.9)',
                  border: digit ? '2px solid rgba(0,230,118,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: digit ? '0 0 15px rgba(0,230,118,0.2)' : 'none',
                }}
              />
            ))}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm mb-4"
                style={{ color: '#FF3B3B' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Hint */}
          <p className="text-slate-600 text-xs">Administrateur ou Collaborateur</p>

          {/* Congo bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-3xl" style={{ background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)' }} />
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-8 text-slate-600 text-xs"
      >
        Hiace Congo · Smart Mobility Brazzaville
      </motion.p>
    </div>
  );
}
