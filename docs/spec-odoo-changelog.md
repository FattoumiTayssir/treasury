# Changelog - Spécification Odoo (spec-odoo.md)

Ce fichier documente tous les changements apportés à la spécification Odoo.

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
