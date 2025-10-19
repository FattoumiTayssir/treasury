# 📚 Index de la Documentation Treasury

## Vue d'ensemble

Ce dossier contient toute la documentation du système de trésorerie (Treasury), incluant les spécifications techniques, les guides de test, et la documentation de suivi.

---

## 📋 Documentation Principale

### Spécifications & Architecture

| Document | Description | Audience | Dernière MAJ |
|----------|-------------|----------|--------------|
| **[spec-odoo.md](./spec-odoo.md)** | Spécification technique complète des ETL Odoo → Treasury | Dev, QA, PO | 2025-10-19 |
| **[spec-odoo-changelog.md](./spec-odoo-changelog.md)** | Historique de tous les changements de la spécification | Tous | 2025-10-19 |
| **[ETL_README.md](./ETL_README.md)** | Documentation des processus ETL | Dev, Ops | - |

---

## 🧪 Documentation de Tests

### Guides de Test Manuels

| Document | Type | Durée | Utilisation | Public |
|----------|------|-------|-------------|--------|
| **[README_TESTS.md](./README_TESTS.md)** | Guide principal | - | Introduction aux tests | QA, nouveaux testeurs |
| **[GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md)** | Tests exhaustifs | 3-5h | Tests complets, release | QA, Dev |
| **[CHECKLIST_TESTS_RAPIDE.md](./CHECKLIST_TESTS_RAPIDE.md)** | Checklist rapide | 30-45min | Tests quotidiens, smoke tests | QA, Dev |
| **[SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md)** | Tableau de bord | - | Suivi et coordination | QA Lead, Managers |

#### 📖 Commencer par où ?

1. **Nouveau testeur ?** → Lire [README_TESTS.md](./README_TESTS.md) puis [spec-odoo.md](./spec-odoo.md)
2. **Test après déploiement ?** → Utiliser [CHECKLIST_TESTS_RAPIDE.md](./CHECKLIST_TESTS_RAPIDE.md)
3. **Release majeure ?** → Suivre [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md)
4. **Coordination équipe ?** → Consulter [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md)

---

## 🔧 Documentation Technique

### ETL & Processus

| Document | Description | Audience |
|----------|-------------|----------|
| **[ETL_README.md](./ETL_README.md)** | Vue d'ensemble des ETL | Dev, Ops |
| **[ETL_DELETE_INSERT_SUMMARY.md](./ETL_DELETE_INSERT_SUMMARY.md)** | Stratégie delete/insert | Dev |
| **[CHANGELOG_ETL.md](./CHANGELOG_ETL.md)** | Historique des modifications ETL | Dev, QA |

### Corrections & Fixes

| Document | Description | Audience |
|----------|-------------|----------|
| **[FIXES_APPLIED.md](./FIXES_APPLIED.md)** | Correctifs appliqués | Dev, Ops |

---

## 📊 Structure des Tests par Module

### 1️⃣ Achat Importation
**Source** : Odoo → Fournisseurs → Factures (DA commence par "CE")

**Tests couverts** :
- ✅ Factures normales (brouillon/confirmée) avec taux de change
- ✅ Exceptions : échéance passée
- ✅ Exceptions : taux de change manquant ou invalide
- ✅ Exclusion des factures payées
- ✅ Différents formats de taux de change

**Documents** : 
- Tests détaillés → [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md#1️⃣-achat-importation)
- Spec métier → [spec-odoo.md](./spec-odoo.md#1-achat-importation)

### 2️⃣ Ventes Locales
**Source** : Odoo → Ventes → Commandes → BL → Factures

**Tests couverts** :
- ✅ Cycle complet Commande → BL → Facture
- ✅ BL sans facture (estimation)
- ✅ Exceptions : somme BL ≠ montant commande
- ✅ Différents statuts de règlement
- ✅ Règlement partiel
- ✅ Exceptions : dates incohérentes

**Documents** :
- Tests détaillés → [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md#2️⃣-ventes-locales)
- Spec métier → [spec-odoo.md](./spec-odoo.md#2-ventes-locales)

### 3️⃣ Achats Locaux avec Échéance
**Source** : Odoo → Fournisseurs → Factures (DA ne commence PAS par "CE")

**Tests couverts** :
- ✅ Factures locales normales
- ✅ Exceptions : échéance passée
- ✅ Exclusion des factures payées
- ✅ Différenciation Import/Local

**Documents** :
- Tests détaillés → [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md#3️⃣-achats-locaux-avec-échéance)
- Spec métier → [spec-odoo.md](./spec-odoo.md#3-achats-locaux-avec-échéance)

### 4️⃣ Gestion des Exceptions
**Source** : Interface Treasury

**Tests couverts** :
- ✅ Affichage des exceptions dans l'interface
- ✅ Notification bell avec compteur
- ✅ Liens Odoo fonctionnels
- ✅ États des exceptions (Actif/Désactivé)
- ✅ Filtrage par compagnie

**Documents** :
- Tests détaillés → [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md#4️⃣-gestion-des-exceptions---vérification-globale)
- Spec métier → [spec-odoo.md](./spec-odoo.md#4-gestion-des-exceptions)

---

## 🎯 Scénarios de Test par Priorité

### Priorité Critique (P0) ⚠️
Must-have avant production
- [ ] Facture import normale → Mouvement créé
- [ ] Exception taux de change détectée
- [ ] Factures payées exclues
- [ ] Filtrage par compagnie fonctionne
- [ ] Exceptions visibles dans interface

### Priorité Haute (P1) 🔥
Important pour la qualité
- [ ] Tous types d'exceptions détectées
- [ ] Cycle complet ventes locales
- [ ] Différenciation Import/Local
- [ ] Liens Odoo fonctionnels
- [ ] Rafraîchissement données

### Priorité Moyenne (P2) 📋
Confort & edge cases
- [ ] Tests de volumétrie
- [ ] Cas limites (montants extrêmes)
- [ ] Données invalides
- [ ] Performance interface

### Priorité Basse (P3) 💡
Nice-to-have
- [ ] Caractères spéciaux
- [ ] Anciens enregistrements
- [ ] Tests UI/UX avancés

---

## 📈 Métriques & Suivi

### Couverture de Tests

```
Total scénarios identifiés : 80+
Achat Importation : 15+ tests
Ventes Locales    : 25+ tests
Achats Locaux     : 10+ tests
Exceptions        : 10+ tests
Performance       : 10+ tests
Robustesse        : 10+ tests
```

### Documents de Suivi
- **Planning** → [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md#-planning-des-tests)
- **Bugs** → [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md#-registre-des-bugs)
- **Métriques** → [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md#-métriques-de-qualité)

---

## 🔍 Navigation Rapide

### Par Rôle

**Je suis Testeur QA** :
1. [README_TESTS.md](./README_TESTS.md) - Guide d'utilisation
2. [CHECKLIST_TESTS_RAPIDE.md](./CHECKLIST_TESTS_RAPIDE.md) - Tests quotidiens
3. [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md) - Tests complets
4. [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md) - Coordination

**Je suis Développeur** :
1. [spec-odoo.md](./spec-odoo.md) - Règles métier
2. [ETL_README.md](./ETL_README.md) - Architecture ETL
3. [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md) - Cas d'usage
4. [spec-odoo-changelog.md](./spec-odoo-changelog.md) - Historique

**Je suis Chef de Projet** :
1. [README_TESTS.md](./README_TESTS.md) - Vue d'ensemble tests
2. [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md) - Métriques & planning
3. [spec-odoo.md](./spec-odoo.md) - Spécifications

**Je suis Nouveau dans l'Équipe** :
1. [INDEX.md](./INDEX.md) - Ce fichier
2. [spec-odoo.md](./spec-odoo.md) - Comprendre le système
3. [README_TESTS.md](./README_TESTS.md) - Introduction aux tests
4. [CHECKLIST_TESTS_RAPIDE.md](./CHECKLIST_TESTS_RAPIDE.md) - Premier test

### Par Activité

**Déploiement Production** :
1. [CHECKLIST_TESTS_RAPIDE.md](./CHECKLIST_TESTS_RAPIDE.md) - Tests critiques
2. [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md#-checklist-avant-déploiement-production) - Checklist déploiement

**Release Majeure** :
1. [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md) - Tests complets
2. [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md) - Coordination équipe

**Bug Signalé** :
1. [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md) - Test de régression
2. [SUIVI_TESTS_EQUIPE.md](./SUIVI_TESTS_EQUIPE.md#-registre-des-bugs) - Enregistrer le bug

**Modification Spec** :
1. [spec-odoo.md](./spec-odoo.md) - Modifier la spec
2. [spec-odoo-changelog.md](./spec-odoo-changelog.md) - Documenter le changement
3. [GUIDE_TESTS_ODOO.md](./GUIDE_TESTS_ODOO.md) - Ajouter/Modifier tests

---

## 🆕 Dernières Mises à Jour

| Date | Document | Changement |
|------|----------|------------|
| 2025-10-19 | Tous les docs de test | Création initiale de la documentation de tests |
| 2025-10-19 | spec-odoo.md | Ajout taux de change pour imports |
| 2025-10-19 | spec-odoo-changelog.md | Documentation des nouveaux docs de test |

---

## 📞 Support & Contact

- **Questions tests** : #treasury-testing sur Slack
- **Questions specs** : #treasury-dev sur Slack  
- **Bugs** : #treasury-bugs sur Slack
- **Documentation** : Contacter QA Lead

---

## 🎓 Ressources Additionnelles

### Formation
- Vidéo "Introduction ETL Treasury" : [Lien]
- Session d'onboarding testeurs : [Lien calendrier]
- Documentation Odoo officielle : [Lien]

### Outils
- Accès Odoo Staging : [Lien]
- Accès Treasury Staging : [Lien]
- Jira pour bugs : [Lien]

---

**Maintenu par** : Équipe Treasury  
**Dernière mise à jour** : 2025-10-19  
**Version** : 1.0
