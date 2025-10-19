# Changelog - Spécification Odoo (spec-odoo.md)

Ce fichier documente tous les changements apportés à la spécification Odoo.

---

## [2025-10-19] - Création de la documentation de tests

### Nouveaux Documents

#### GUIDE_TESTS_ODOO.md
- **Type** : Guide exhaustif de tests manuels
- **Contenu** : Plus de 80 scénarios de test détaillés avec cases à cocher
- **Sections** :
  - Tests Achat Importation (15+ scénarios)
  - Tests Ventes Locales (25+ scénarios)
  - Tests Achats Locaux (10+ scénarios)
  - Tests Gestion des Exceptions (10+ scénarios)
  - Tests de volumétrie et performance
  - Tests de robustesse
  - Tests de filtrage par compagnie
- **Objectif** : Fournir une checklist complète pour valider tous les cas d'usage des ETL

#### CHECKLIST_TESTS_RAPIDE.md
- **Type** : Checklist de tests essentiels
- **Contenu** : 20-30 tests critiques prioritaires
- **Utilisation** : Tests quotidiens, smoke tests après déploiement
- **Durée estimée** : 30-45 minutes

#### README_TESTS.md
- **Type** : Guide d'utilisation de la documentation de tests
- **Contenu** :
  - Vue d'ensemble des documents
  - Instructions d'utilisation selon le contexte
  - Bonnes pratiques de test
  - Scénarios par priorité (P0 à P3)
  - Modèle de rapport de test
- **Objectif** : Aider l'équipe à naviguer et utiliser efficacement les guides de test

#### SUIVI_TESTS_EQUIPE.md
- **Type** : Tableau de bord de suivi des tests
- **Contenu** :
  - Planning des sessions de test
  - Suivi par module (Achat Import, Ventes, Achats Locaux)
  - Registre des bugs actifs et résolus
  - Métriques de qualité et couverture
  - Attribution des tests par testeur
  - Checklist avant déploiement production
- **Objectif** : Coordonner les efforts de test de l'équipe et suivre la qualité

### Raison de Création

Ces documents ont été créés pour :
1. **Standardiser** les processus de test manuel dans Odoo
2. **Couvrir** tous les scénarios définis dans spec-odoo.md
3. **Faciliter** l'onboarding des nouveaux testeurs
4. **Assurer** la qualité avant chaque déploiement
5. **Tracer** l'historique des tests et bugs

### Impact

- Amélioration de la couverture de tests
- Réduction du temps de formation des testeurs
- Meilleure coordination de l'équipe QA
- Documentation des cas limites et edge cases
- Base pour l'automatisation future des tests

---

## [2025-10-19] - Ajout du taux de change pour les achats d'importation

### Changements

#### Section 1.2 - Achat Importation - Taux de change (NOUVELLE SECTION)
- **Ajout** : Nouvelle section décrivant la gestion du taux de change
- **Champ Odoo** : `custom_rate` (type: float, readonly) dans l'objet `account.move`
- **Raison** : Les achats d'importation nécessitent l'application d'un taux de change pour calculer le montant final en devise locale

#### Section 1.3 - Achat Importation - Exceptions (anciennement 1.2)
- **Ajout** : Nouvelle exception "Facture d'importation sans taux de change (custom_rate manquant ou = 0)"
- **Raison** : Les factures d'importation doivent obligatoirement avoir un taux de change valide. En absence de taux, elles doivent être traitées manuellement

### Impact
Ces changements affectent :
- `etl_jobs/achat_importation_upsert.py` - doit récupérer et appliquer le champ `custom_rate`
- Table `Movement` - ajout d'une colonne `exchange_rate` pour stocker le taux de change
- Logique métier - création d'exceptions pour les factures sans taux de change

---

## [2025-10-18] - Exclusion des factures payées

### Changements

#### Section 1.1 - Achat Importation - Sélection
- **Ajout** : Exclure les factures déjà payées (payment_state = "paid")
- **Raison** : Éviter de traiter des factures qui sont déjà réglées

#### Section 1.2 - Achat Importation - Exceptions
- **Suppression** : Retrait de l'exception "Facture dont la date d'échéance = date système mais déjà marquée « payée »"
- **Raison** : Cette exception n'est plus nécessaire puisque les factures payées sont maintenant exclues dès la sélection

#### Section 3 - Achats locaux avec échéance
- **Ajout** : Exclure les factures déjà payées (payment_state = "paid")
- **Raison** : Appliquer la même logique que pour les achats d'importation

### Impact
Ces changements affectent la logique ETL suivante :
- `etl_jobs/achat_importation_upsert.py`
- `etl_jobs/achats_locaux_echeance_upsert.py`

---
