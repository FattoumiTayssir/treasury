# Changelog - Spécification Odoo (spec-odoo.md)

Ce fichier documente tous les changements apportés à la spécification Odoo.

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
