# Spec TabTré – Révision 2025‑07‑

## Description

Rapport technique sur le calcul automatique des métriques financières depuis **Odoo** vers
**Power BI / Power Apps**.

_Cette version intègre les décisions et clarifications issues des derniers échanges du 27 juin 2025._

## Objectif général

Extraire les données de la base **Odoo** afin de calculer automatiquement certaines métriques financières
dans **Power BI**. Les cas non automatisables seront gérés manuellement via une application **Power Apps** (et
donc signalés comme **Exceptions** ).

## Liste finale des métriques à calculer

```
 #  Métrique Statut
 1  Achat Importation Automatique + Exceptions
```
```
 2  Ventes locales Automatique + Exceptions
```
```
 3  Achats locaux avec échéance Automatique + Exceptions
```
```
⚠️ Élimination  : Charges fiscales (TVA), Achats récurrents et Transport Swift sortent du périmètre
automatisé et seront traités 100 % manuellement dans Power Apps.
```
## 1. Achat Importation

**Source Odoo :** _Fournisseurs → Factures/Avoirs_

### 1.1 Sélection

```
Factures à l'état "brouillon" ou "confirmée" ayant une date d'échéance future (≥ date système).
Numéro de demande d'achat commençant obligatoirement par « CE » (importation).
Exclure les factures déjà payées (payment_state = "paid").
```
### 1.2 Exceptions (traitement manuel)

```
Facture (brouillon ou confirmée) dont la date d'échéance est < date système.
```



## 2. Ventes locales

**Cycle Odoo :** Commande → BL → Facture → Règlements.

### 2.1 Règles générales

```
Une commande peut générer plusieurs BL ; chaque BL génère une seule facture.
Une facture peut être liée à plusieurs règlements (N : N).
```
### 2.2 Cas Factures absentes

```
Estimer le montant à partir des BL (prix × quantité).
Date d’échéance estimée = Date Prévue (BL) + Délais de paiement (par défaut).
Exception  : somme des BL ≠ montant initial de la commande.
```
### 2.3 Cas Factures présentes – Statut Reg. Non Reçu

```
Extraction normale : montant + date d’échéance depuis la facture.
Exceptions  :
Date d’échéance antérieure à la date système.
Date d’échéance = Date de facturation.
```
### 2.4 Autres statuts

```
Statut Règle Action
En paiement / Extourné /
Hist. facturation / Reg. Impayé
Non automatisable Exception
```
```
Reg. Reçu
Date d’échéance > date système → normal,
sinon exceptions ci‑dessus
Automatique
```
```
Reg. Partiel Reçu Part payé → traitement comme Reg. Reçu ;
reste → Exception
```
### 2.5 Décision urgente sur les dates (BL)

```
Toujours prendre la Date d’échéance.
Exception   : si Date d’échéance < Date Prévue → lever une Exception pour analyse.
```
## 3. Achats locaux avec échéance

```
Factures hors importation (numéro de DA ≠ « CE » ).
Date d’échéance future.
Exclure les factures déjà payées (payment_state = "paid").
Exceptions identiques au point 1.2.
```
#### • • • • • • • • • • • • • •


## 4. Gestion des Exceptions

Toute transaction classée _Exception_ doit « remonter » automatiquement dans l’interface **Power Apps** pour
correction manuelle par l’équipe Finance. Les motifs d’exception doivent être affichés (raison précise).

_Document préparé le 01/07/2025._


