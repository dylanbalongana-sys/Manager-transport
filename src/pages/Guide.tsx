import { useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Receipt, CreditCard,
  ClipboardList, Zap, Target, BarChart3, Wrench, Settings2,
  ChevronRight, Sparkles, BookOpen, History
} from 'lucide-react';

interface Module {
  id: string;
  icon: React.ElementType;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  border: string;
  steps: string[];
  tip?: string;
}

const MODULES: Module[] = [
  {
    id: 'dashboard', icon: LayoutDashboard, emoji: '📊',
    title: 'Tableau de bord', subtitle: 'Vue d\'ensemble en temps réel',
    color: '#00E676', bg: 'rgba(0,230,118,0.06)', border: 'rgba(0,230,118,0.15)',
    steps: [
      'Consultez la caisse actuelle et la recette du jour dès l\'ouverture',
      'Le résultat net global s\'adapte selon vos données saisies',
      'Activez "Avec déduction dettes" pour voir votre solde réel',
      'Les objectifs en retard apparaissent en rouge automatiquement',
    ],
    tip: 'Le tableau de bord se met à jour à chaque nouvelle saisie.',
  },
  {
    id: 'daily', icon: CalendarDays, emoji: '📅',
    title: 'Activité Journalière', subtitle: 'Saisir les recettes et charges du jour',
    color: '#FFC107', bg: 'rgba(255,193,7,0.06)', border: 'rgba(255,193,7,0.15)',
    steps: [
      'Choisissez le type de journée : Normale, Maintenance ou Inactive',
      'Saisissez la recette brute encaissée dans le champ vert',
      'Ajoutez chaque charge avec sa catégorie et son montant',
      'Pour "Autre", un champ apparaît pour préciser la nature de la charge',
      'Enregistrez — les données apparaissent immédiatement sur le dashboard',
    ],
    tip: 'Les tâches automatisées actives s\'ajoutent seules aux charges.',
  },
  {
    id: 'charges', icon: Receipt, emoji: '💸',
    title: 'Frais & Charges', subtitle: 'Analyse détaillée des dépenses',
    color: '#FF9800', bg: 'rgba(255,152,0,0.06)', border: 'rgba(255,152,0,0.15)',
    steps: [
      'Page de lecture — les données viennent des activités journalières',
      'Les charges sont groupées : Carburants, Réglementaires, Salaires, Autres',
      'Cliquez sur un groupe pour voir le détail de chaque catégorie',
      'Les pannes sont listées séparément en bas de page',
    ],
  },
  {
    id: 'debts', icon: CreditCard, emoji: '💳',
    title: 'Gestion des Dettes', subtitle: 'Suivre les dettes fournisseurs',
    color: '#FF3B3B', bg: 'rgba(255,59,59,0.06)', border: 'rgba(255,59,59,0.15)',
    steps: [
      'Cliquez sur "+ Nouvelle dette" pour enregistrer une dette',
      'Renseignez le fournisseur, la pièce, le montant total et restant',
      'Pour "Autre" type de fournisseur, précisez dans le champ qui apparaît',
      'Bouton ✓ pour marquer une dette comme entièrement payée',
      'Cliquez sur une ligne pour voir les détails et les actions',
    ],
  },
  {
    id: 'provisional', icon: ClipboardList, emoji: '📋',
    title: 'Dettes Prévisionnelles', subtitle: 'Anticiper les dépenses futures',
    color: '#FF9800', bg: 'rgba(255,152,0,0.06)', border: 'rgba(255,152,0,0.15)',
    steps: [
      'Une dette prévisionnelle = une somme mise de côté sur le papier',
      'Créez une entrée avec libellé, montant et date',
      'Optionnel : liez-la à une dette réelle existante',
      'Bouton "Confirmer" pour passer en statut confirmé',
    ],
    tip: 'Utile pour anticiper une révision ou un achat de pièce.',
  },
  {
    id: 'automation', icon: Zap, emoji: '⚡',
    title: 'Automatisation', subtitle: 'Charges récurrentes automatiques',
    color: '#00BCD4', bg: 'rgba(0,188,212,0.06)', border: 'rgba(0,188,212,0.15)',
    steps: [
      'Créez une tâche automatisée : catégorie, fréquence, montant',
      'Fréquences disponibles : Quotidien, Hebdomadaire, Mensuel',
      'Toggle pour activer ou désactiver une tâche instantanément',
      'Les tâches actives s\'ajoutent automatiquement lors de la saisie journalière',
    ],
    tip: 'Le carburant quotidien est parfait pour l\'automatisation.',
  },
  {
    id: 'objectives', icon: Target, emoji: '🎯',
    title: 'Objectifs', subtitle: 'Définir et suivre vos objectifs',
    color: '#9C27B0', bg: 'rgba(156,39,176,0.06)', border: 'rgba(156,39,176,0.15)',
    steps: [
      'Créez un objectif avec titre, date cible et budget estimé',
      'Les objectifs dépassés passent automatiquement en "En retard"',
      'Bouton ✓ pour marquer un objectif comme réalisé',
      'Les alertes de retard apparaissent dans les notifications',
    ],
  },
  {
    id: 'bilan', icon: BarChart3, emoji: '📈',
    title: 'Bilan & Analyse', subtitle: 'Rapport complet de performances',
    color: '#7C3AED', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)',
    steps: [
      'Filtrez par période : 7 jours, ce mois ou toute la durée',
      'Le score de santé sur 100 évalue votre situation globale',
      'Cliquez sur chaque section pour l\'ouvrir et voir les détails',
      'Les recommandations sont personnalisées selon vos vraies données',
    ],
    tip: 'Plus vous avez de données saisies, plus les analyses sont précises.',
  },
  {
    id: 'parts', icon: Wrench, emoji: '🔧',
    title: 'Suivi des Pièces', subtitle: 'Durée de vie et alertes de remplacement',
    color: '#B87333', bg: 'rgba(184,115,51,0.06)', border: 'rgba(184,115,51,0.15)',
    steps: [
      'Études : enregistrez les cycles achat → dégradation pour calculer une moyenne',
      'Données : renseignez les durées connues ou utilisez les moyennes calculées',
      'Amortissement : la jauge avance selon les jours réellement travaillés',
      'La date de changement recommandée inclut une marge de sécurité automatique',
      'La jauge passe au rouge quand la pièce approche de sa limite',
    ],
    tip: 'Plus vous enregistrez de cycles, plus la moyenne est précise.',
  },
  {
    id: 'history', icon: History, emoji: '📜',
    title: 'Historique', subtitle: 'Toutes les activités enregistrées',
    color: '#64B5F6', bg: 'rgba(100,181,246,0.06)', border: 'rgba(100,181,246,0.15)',
    steps: [
      'Consultez toutes les journées enregistrées par ordre chronologique',
      'Filtrez par type : Normale, Maintenance ou Inactive',
      'Cliquez sur une ligne pour voir le détail complet de la journée',
      'Recherchez une date spécifique dans la barre de recherche',
    ],
  },
  {
    id: 'settings', icon: Settings2, emoji: '⚙️',
    title: 'Paramètres', subtitle: 'Configuration de l\'application',
    color: '#607D8B', bg: 'rgba(96,125,139,0.06)', border: 'rgba(96,125,139,0.15)',
    steps: [
      'Admin : modifiez le véhicule, la devise, les PINs et la caisse',
      'Collaborateur : modifiez vos infos, le chauffeur, le contrôleur et la caisse',
      'Exportez les données en JSON pour les envoyer via WhatsApp',
      'Importez les données reçues pour synchroniser les informations',
    ],
    tip: 'PIN Admin par défaut : 1234 — PIN Collaborateur : 0000. Changez-les dès la première connexion !',
  },
];

export default function Guide() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="relative min-h-screen" style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #05070D 50%, #0d0a1a 100%)' }}>

      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.04) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,193,7,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{
            background: 'rgba(0,230,118,0.08)',
            border: '1px solid rgba(0,230,118,0.2)',
          }}>
            <Sparkles className="w-4 h-4" style={{ color: '#00E676' }} />
            <span className="text-sm font-medium" style={{ color: '#00E676' }}>Guide complet</span>
          </div>

          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Comment utiliser<br />
            <span style={{
              background: 'linear-gradient(135deg, #00E676, #FFC107, #FF3B3B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Hiace Congo</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Cliquez sur chaque module pour découvrir comment l'utiliser
          </p>

          {/* Barre Congo */}
          <div className="w-32 h-1 mx-auto mt-6 rounded-full" style={{
            background: 'linear-gradient(90deg, #00E676, #FFC107, #FF3B3B)',
          }} />
        </div>

        {/* Grille de modules */}
        <div className="space-y-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isOpen = openId === mod.id;
            const isHovered = hovered === mod.id;

            return (
              <div
                key={mod.id}
                style={{
                  background: isOpen ? mod.bg : 'rgba(10,14,26,0.7)',
                  border: `1px solid ${isOpen ? mod.border : isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  transform: isHovered && !isOpen ? 'translateX(4px)' : 'translateX(0)',
                }}
                onMouseEnter={() => setHovered(mod.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Header cliquable */}
                <button
                  onClick={() => toggle(mod.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <div className="flex items-center gap-5">
                    {/* Emoji grand */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl" style={{
                      background: mod.bg,
                      border: `1px solid ${mod.border}`,
                    }}>
                      {mod.emoji}
                    </div>

                    {/* Infos */}
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-white font-bold text-base">{mod.title}</p>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: mod.color, opacity: isOpen ? 1 : 0.4 }} />
                      </div>
                      <p className="text-slate-500 text-sm mt-0.5">{mod.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Icon className="w-4 h-4" style={{ color: isOpen ? mod.color : 'rgba(255,255,255,0.2)' }} />
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isOpen ? mod.bg : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isOpen ? mod.border : 'rgba(255,255,255,0.08)'}`,
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: isOpen ? mod.color : 'rgba(255,255,255,0.3)' }} />
                    </div>
                  </div>
                </button>

                {/* Contenu accordéon CSS pur */}
                <div style={{
                  maxHeight: isOpen ? '600px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s ease',
                }}>
                  <div className="px-6 pb-6">

                    {/* Séparateur */}
                    <div className="h-px mb-5" style={{
                      background: `linear-gradient(90deg, ${mod.color}40, transparent)`,
                    }} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Étapes */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: mod.color }}>
                          Comment ça marche
                        </p>
                        {mod.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{ background: mod.bg, color: mod.color, border: `1px solid ${mod.border}` }}
                            >
                              {i + 1}
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>

                      {/* Conseil + illustration */}
                      <div className="flex flex-col justify-between gap-4">
                        {mod.tip && (
                          <div className="p-4 rounded-2xl" style={{
                            background: mod.bg,
                            border: `1px solid ${mod.border}`,
                          }}>
                            <p className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: mod.color }}>
                              <Sparkles className="w-3.5 h-3.5" /> Conseil
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed">{mod.tip}</p>
                          </div>
                        )}

                        {/* Illustration */}
                        <div className="flex-1 flex items-center justify-center p-6 rounded-2xl" style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <div className="text-center">
                            <div className="text-6xl mb-3">{mod.emoji}</div>
                            <p className="text-slate-600 text-xs">{mod.title}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badge "Accéder" */}
                    <div className="mt-5 flex justify-end">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold" style={{
                        background: mod.bg,
                        border: `1px solid ${mod.border}`,
                        color: mod.color,
                      }}>
                        <BookOpen className="w-3.5 h-3.5" />
                        Accédez via la barre de navigation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 p-6 rounded-3xl text-center" style={{
          background: 'rgba(10,14,26,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p className="text-2xl mb-2">🇨🇬</p>
          <p className="text-white font-bold">Hiace Congo — Smart Mobility</p>
          <p className="text-slate-500 text-sm mt-1">Brazzaville · République du Congo</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-6 h-1 rounded-full bg-emerald-500" />
            <div className="w-6 h-1 rounded-full bg-amber-400" />
            <div className="w-6 h-1 rounded-full bg-red-500" />
          </div>
        </div>

      </div>
    </div>
  );
}
