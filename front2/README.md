# Tabtré App - Application de Gestion de Trésorerie

Application React moderne pour la gestion et la prévision de trésorerie sur 6 mois pour le groupe Universal.

## 🚀 Fonctionnalités

- **Dashboard BI** : Visualisation de la trésorerie prévisionnelle
- **Mouvements Financiers** : Consultation des entrées/sorties d'argent avec filtres avancés
- **Entrées Manuelles** : Ajout et gestion de mouvements financiers manuels
- **Exceptions** : Suivi des anomalies détectées lors du traitement
- **Gestion Multi-entreprises** : Support de plusieurs sociétés
- **Authentification** : Système de connexion avec rôles (Admin/Gestionnaire)

## 📋 Prérequis

- Node.js >= 18.0.0
- npm ou yarn

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement dans .env
# VITE_API_URL=http://localhost:8000
# VITE_ODOO_API_URL=https://your-odoo-instance.com
```

## 💻 Développement

```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera disponible sur http://localhost:3000
```

## 🏗️ Build

```bash
# Créer le build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 🧪 Linting

```bash
# Vérifier le code
npm run lint
```

## 📁 Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants UI de base (shadcn/ui)
│   ├── layout/         # Composants de mise en page
│   ├── movements/      # Composants pour les mouvements
│   ├── manual-entries/ # Composants pour les entrées manuelles
│   ├── exceptions/     # Composants pour les exceptions
│   └── shared/         # Composants partagés
├── pages/              # Pages de l'application
├── services/           # Services API
├── store/              # Gestion d'état (Zustand)
├── types/              # Définitions TypeScript
├── utils/              # Fonctions utilitaires
└── hooks/              # Hooks React personnalisés
```

## 🎨 Stack Technique

- **React 18** : Framework UI
- **TypeScript** : Typage statique
- **Vite** : Build tool et dev server
- **TailwindCSS** : Styling
- **Radix UI** : Composants UI accessibles
- **Lucide React** : Icônes
- **Zustand** : Gestion d'état
- **Axios** : Requêtes HTTP
- **React Router** : Navigation
- **date-fns** : Manipulation de dates
- **Recharts** : Graphiques

## 🔐 Authentification

L'application utilise un système d'authentification basé sur JWT. Les tokens sont stockés dans le localStorage et ajoutés automatiquement aux requêtes API.

## 🌐 API Backend

L'application nécessite un backend API REST compatible. Configurer l'URL dans le fichier `.env`:

```
VITE_API_URL=http://localhost:8000
```

### Endpoints attendus:

- `POST /api/auth/login` - Connexion
- `GET /api/movements` - Liste des mouvements
- `GET /api/manual-entries` - Liste des entrées manuelles
- `GET /api/exceptions` - Liste des exceptions
- `POST /api/dashboard/refresh` - Rafraîchir le dashboard
- etc.

## 👥 Rôles Utilisateurs

- **Admin** : Tous les droits + gestion des utilisateurs
- **Gestionnaire** : Accès aux données selon les entreprises autorisées

## 📝 Filtres

Tous les écrans de liste supportent:
- Filtres multiples combinables
- Logique ET/OU configurable
- Recherche par texte
- Filtres par dates, montants, catégories, etc.

## 🔄 Rafraîchissement des Données

- Affichage de la date du dernier rafraîchissement
- Dialogue de confirmation avant rafraîchissement
- Mise à jour automatique de l'état des références Odoo

## 📦 Build et Déploiement

```bash
# Build de production
npm run build

# Les fichiers sont générés dans le dossier dist/
# Déployer le contenu du dossier dist/ sur votre serveur web
```

## 🤝 Contribution

Ce projet suit les meilleures pratiques React et TypeScript:
- Composants modulaires et réutilisables
- Typage strict TypeScript
- Convention de nommage cohérente
- Séparation des responsabilités

## 📄 Licence

Propriétaire - Universal Group

## 📧 Support

Pour toute question ou problème, contactez l'équipe de développement.
