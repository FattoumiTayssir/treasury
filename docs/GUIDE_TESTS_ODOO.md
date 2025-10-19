# Guide de Tests Manuels Odoo - ETL Treasury

## 📋 Objectif

Ce document liste tous les scénarios de test à effectuer manuellement dans l'interface Odoo pour valider le bon fonctionnement des ETL (Extract, Transform, Load) du système de trésorerie.

**Convention** : Après chaque test, cochez ☑️ si réussi, notez ❌ si échec avec commentaire.

---

## 🔧 Prérequis avant les tests

- [ ] Accès administrateur à Odoo
- [ ] Environnement de test/staging disponible
- [ ] Base de données sauvegardée avant les tests
- [ ] Accès à l'application Treasury pour vérifier les résultats
- [ ] ETL configuré et opérationnel

---

## 1️⃣ ACHAT IMPORTATION

**Source Odoo** : _Comptabilité → Fournisseurs → Factures/Avoirs_

### 1.1 Cas Normaux (Mouvements Automatiques)

#### 1.1.1 Facture d'importation standard - Brouillon

- [ ] **Test 1.1.1a** : Créer une facture fournisseur en mode **Brouillon**
  - Type : Facture fournisseur (`in_invoice`)
  - Numéro de DA : `CE2025/001` (commence par "CE")
  - Date d'échéance : **Future** (ex: aujourd'hui + 30 jours)
  - Montant : 10,000 TND
  - Taux de change (custom_rate) : **3.2**
  - État de paiement : **Non payé**
  - **Résultat attendu** : Mouvement créé dans Treasury avec montant et taux de change

#### 1.1.1b Facture d'importation standard - Confirmée

- [ ] **Test 1.1.1b** : Créer une facture fournisseur **Confirmée** (posted)
  - Type : Facture fournisseur (`in_invoice`)
  - Numéro de DA : `CE2025/002`
  - Date d'échéance : **Future** (ex: aujourd'hui + 45 jours)
  - Montant : 25,000 TND
  - Taux de change (custom_rate) : **3.4**
  - État de paiement : **Non payé**
  - **Résultat attendu** : Mouvement créé dans Treasury

#### 1.1.2 Avoir d'importation

- [ ] **Test 1.1.2** : Créer un avoir fournisseur
  - Type : Avoir fournisseur (`in_refund`)
  - Numéro de DA : `CE2025/003`
  - Date d'échéance : **Future**
  - Montant : 5,000 TND
  - Taux de change (custom_rate) : **3.3**
  - État de paiement : **Non payé**
  - **Résultat attendu** : Mouvement créé avec signe "Entrée"

#### 1.1.3 Différents taux de change

- [ ] **Test 1.1.3a** : Facture avec taux de change faible (2.8)
- [ ] **Test 1.1.3b** : Facture avec taux de change élevé (3.8)
- [ ] **Test 1.1.3c** : Facture avec taux de change décimal (3.142857)

### 1.2 Exceptions - Date d'échéance

#### 1.2.1 Échéance passée

- [ ] **Test 1.2.1a** : Facture avec date d'échéance **hier**
  - Type : Facture fournisseur
  - Numéro de DA : `CE2025/010`
  - Date d'échéance : Hier (J-1)
  - Montant : 15,000 TND
  - Taux de change : 3.2
  - **Résultat attendu** : Exception "Échéance passée (< aujourd'hui)"

- [ ] **Test 1.2.1b** : Facture avec date d'échéance **la semaine dernière**
  - Date d'échéance : J-7
  - **Résultat attendu** : Exception "Échéance passée"

- [ ] **Test 1.2.1c** : Facture avec date d'échéance **le mois dernier**
  - Date d'échéance : J-30
  - **Résultat attendu** : Exception "Échéance passée"

#### 1.2.2 Échéance = aujourd'hui

- [ ] **Test 1.2.2** : Facture avec date d'échéance **aujourd'hui**
  - Numéro de DA : `CE2025/011`
  - Date d'échéance : Aujourd'hui
  - Taux de change : 3.2
  - **Résultat attendu** : Mouvement normal (≥ date système)

### 1.3 Exceptions - Taux de change

#### 1.3.1 Taux de change manquant

- [ ] **Test 1.3.1a** : Facture **sans** champ custom_rate (NULL)
  - Numéro de DA : `CE2025/020`
  - Date d'échéance : Future
  - Montant : 20,000 TND
  - custom_rate : **NULL/vide**
  - **Résultat attendu** : Exception "Taux de change manquant ou invalide (custom_rate)"

- [ ] **Test 1.3.1b** : Facture avec custom_rate = **0**
  - Numéro de DA : `CE2025/021`
  - custom_rate : **0**
  - **Résultat attendu** : Exception "Taux de change manquant ou invalide"

- [ ] **Test 1.3.1c** : Facture avec custom_rate négatif (si possible)
  - custom_rate : **-3.2**
  - **Résultat attendu** : Exception ou erreur de validation

### 1.4 Exceptions - Combinaisons

- [ ] **Test 1.4.1** : Facture avec échéance passée **ET** taux manquant
  - Date d'échéance : J-5
  - custom_rate : NULL
  - **Résultat attendu** : Exception (vérifier quelle exception est prioritaire)

### 1.5 Cas Exclus (Ne doivent PAS apparaître)

#### 1.5.1 Factures payées

- [ ] **Test 1.5.1a** : Facture d'importation **entièrement payée**
  - Numéro de DA : `CE2025/030`
  - Date d'échéance : Future
  - Taux de change : 3.2
  - État de paiement : **Payé** (paid)
  - **Résultat attendu** : **NE DOIT PAS** apparaître dans Treasury

- [ ] **Test 1.5.1b** : Facture payée avec échéance passée
  - État de paiement : **Payé**
  - **Résultat attendu** : **NE DOIT PAS** apparaître

#### 1.5.2 Factures non-importation

- [ ] **Test 1.5.2** : Facture fournisseur normale (DA ne commence pas par "CE")
  - Numéro de DA : `DA2025/001` (sans "CE")
  - **Résultat attendu** : **NE DOIT PAS** apparaître dans Achat Importation (doit être dans Achats Locaux)

---

## 2️⃣ VENTES LOCALES

**Source Odoo** : _Ventes → Commandes → BL → Factures → Règlements_

### 2.1 Cas Normal - Cycle complet

- [ ] **Test 2.1.1** : Cycle complet : Commande → BL → Facture → Règlement
  1. Créer une commande client : 50,000 TND
  2. Confirmer la commande
  3. Créer et valider un BL (Date prévue : J+15)
  4. Créer une facture depuis le BL
  5. Date d'échéance de la facture : J+30
  6. Statut : **Reg. Non Reçu**
  - **Résultat attendu** : Mouvement avec montant et date d'échéance correcte

### 2.2 Cas Factures Absentes - Estimation via BL

#### 2.2.1 BL sans facture - Montant correspondant

- [ ] **Test 2.2.1** : Commande avec BL validé **sans** facture
  - Commande : 30,000 TND
  - BL validé : 30,000 TND (Date prévue : J+20)
  - **Pas de facture créée**
  - Délai de paiement par défaut : 30 jours
  - **Résultat attendu** : 
    - Mouvement créé
    - Montant estimé depuis BL : 30,000 TND
    - Date d'échéance estimée : Date Prévue BL + 30 jours

#### 2.2.2 BL sans facture - Exception montant différent

- [ ] **Test 2.2.2** : Somme des BL ≠ montant commande
  - Commande : 40,000 TND
  - BL 1 : 20,000 TND
  - BL 2 : 15,000 TND
  - **Total BL : 35,000 ≠ 40,000**
  - Pas de facture
  - **Résultat attendu** : Exception "Somme des BL ≠ montant commande"

#### 2.2.3 Plusieurs BL pour une commande

- [ ] **Test 2.2.3** : Commande avec plusieurs BL sans facture
  - Commande : 100,000 TND
  - BL 1 : 40,000 TND (Date prévue : J+10)
  - BL 2 : 30,000 TND (Date prévue : J+15)
  - BL 3 : 30,000 TND (Date prévue : J+20)
  - Total = 100,000 ✓
  - **Résultat attendu** : Mouvements créés pour chaque BL avec dates estimées

### 2.3 Factures Présentes - Statut "Reg. Non Reçu"

#### 2.3.1 Facture normale - Échéance future

- [ ] **Test 2.3.1** : Facture avec statut **Reg. Non Reçu**
  - Montant : 25,000 TND
  - Date de facturation : Aujourd'hui
  - Date d'échéance : J+30 (future)
  - **Résultat attendu** : Mouvement normal

#### 2.3.2 Exception - Échéance passée

- [ ] **Test 2.3.2** : Facture avec échéance **antérieure à la date système**
  - Statut : Reg. Non Reçu
  - Date d'échéance : J-5
  - **Résultat attendu** : Exception "Date d'échéance antérieure à la date système"

#### 2.3.3 Exception - Échéance = Date facturation

- [ ] **Test 2.3.3** : Facture où **Date d'échéance = Date de facturation**
  - Date facturation : 01/10/2025
  - Date d'échéance : 01/10/2025 (même date)
  - **Résultat attendu** : Exception "Date d'échéance = Date de facturation"

### 2.4 Autres Statuts de Règlement

#### 2.4.1 Statut "Reg. Reçu"

- [ ] **Test 2.4.1a** : Facture **Reg. Reçu** avec échéance future
  - Date d'échéance : J+15
  - **Résultat attendu** : Mouvement normal (automatique)

- [ ] **Test 2.4.1b** : Facture **Reg. Reçu** avec échéance passée
  - Date d'échéance : J-5
  - **Résultat attendu** : Exception

#### 2.4.2 Statut "Reg. Partiel Reçu"

- [ ] **Test 2.4.2** : Facture **Reg. Partiel Reçu**
  - Montant facture : 50,000 TND
  - Montant payé : 20,000 TND
  - **Résultat attendu** : 
    - Part payée (20,000) : Traitement comme Reg. Reçu
    - Reste (30,000) : Exception

#### 2.4.3 Statuts Non Automatisables - Exceptions

- [ ] **Test 2.4.3a** : Facture statut **En paiement**
  - **Résultat attendu** : Exception "Non automatisable"

- [ ] **Test 2.4.3b** : Facture statut **Extourné**
  - **Résultat attendu** : Exception "Non automatisable"

- [ ] **Test 2.4.3c** : Facture statut **Hist. facturation**
  - **Résultat attendu** : Exception "Non automatisable"

- [ ] **Test 2.4.3d** : Facture statut **Reg. Impayé**
  - **Résultat attendu** : Exception "Non automatisable"

### 2.5 Exceptions - Dates BL vs Facture

- [ ] **Test 2.5.1** : Date d'échéance < Date Prévue (BL)
  - BL Date Prévue : 15/11/2025
  - Facture Date d'échéance : 10/11/2025
  - **Échéance < Date Prévue !**
  - **Résultat attendu** : Exception "Date d'échéance < Date Prévue BL"

### 2.6 Cas Complexes - Combinaisons

- [ ] **Test 2.6.1** : Commande → 2 BL → 2 Factures
  - Commande : 60,000 TND
  - BL 1 : 30,000 → Facture 1 : 30,000
  - BL 2 : 30,000 → Facture 2 : 30,000
  - **Résultat attendu** : 2 mouvements distincts

- [ ] **Test 2.6.2** : Commande avec BL partiel + Facture partielle
  - Commande : 80,000 TND
  - BL : 50,000 TND
  - Facture : 50,000 TND
  - Reste : 30,000 (non livré/facturé)
  - **Résultat attendu** : Mouvement pour 50,000 + Exception pour écart ?

---

## 3️⃣ ACHATS LOCAUX AVEC ÉCHÉANCE

**Source Odoo** : _Comptabilité → Fournisseurs → Factures (hors importation)_

### 3.1 Cas Normaux

#### 3.1.1 Facture locale standard

- [ ] **Test 3.1.1a** : Facture fournisseur local - Brouillon
  - Type : Facture fournisseur
  - Numéro de DA : `DA2025/101` (**ne commence PAS par "CE"**)
  - Date d'échéance : J+30 (future)
  - Montant : 12,000 TND
  - État de paiement : Non payé
  - **Résultat attendu** : Mouvement créé dans Achats Locaux

- [ ] **Test 3.1.1b** : Facture fournisseur local - Confirmée
  - Numéro de DA : `DA2025/102`
  - Date d'échéance : J+45
  - **Résultat attendu** : Mouvement créé

#### 3.1.2 Avoir local

- [ ] **Test 3.1.2** : Avoir fournisseur local
  - Type : Avoir fournisseur
  - Numéro de DA : `DA2025/103`
  - Date d'échéance : Future
  - Montant : 3,000 TND
  - **Résultat attendu** : Mouvement avec signe "Entrée"

### 3.2 Exceptions - Date d'échéance

- [ ] **Test 3.2.1a** : Facture locale avec échéance **passée**
  - Numéro de DA : `DA2025/110`
  - Date d'échéance : J-10
  - **Résultat attendu** : Exception "Échéance passée (< aujourd'hui)"

- [ ] **Test 3.2.1b** : Facture locale avec échéance = **aujourd'hui**
  - Date d'échéance : Aujourd'hui
  - **Résultat attendu** : Mouvement normal (≥ date système)

### 3.3 Cas Exclus

- [ ] **Test 3.3.1** : Facture locale **entièrement payée**
  - Numéro de DA : `DA2025/120`
  - Date d'échéance : Future
  - État de paiement : **Payé**
  - **Résultat attendu** : **NE DOIT PAS** apparaître dans Treasury

### 3.4 Différenciation Importation vs Local

- [ ] **Test 3.4.1** : Vérifier séparation Import/Local
  - Créer 2 factures identiques :
    - Facture A : DA = `CE2025/500` (Import)
    - Facture B : DA = `DA2025/500` (Local)
  - **Résultat attendu** : 
    - Facture A dans Achat Importation
    - Facture B dans Achats Locaux

---

## 4️⃣ GESTION DES EXCEPTIONS - VÉRIFICATION GLOBALE

### 4.1 Affichage des Exceptions

- [ ] **Test 4.1.1** : Toutes les exceptions apparaissent dans l'interface Treasury
  - Page Exceptions
  - Dropdown notifications

- [ ] **Test 4.1.2** : Chaque exception affiche :
  - Type d'exception
  - Description/raison précise
  - Montant
  - Référence
  - Lien Odoo fonctionnel
  - Criticité

### 4.2 États des Exceptions

- [ ] **Test 4.2.1** : Exception en état "Actif"
  - **Résultat attendu** : Visible dans l'interface

- [ ] **Test 4.2.2** : Exception en état "Désactivé"
  - **Résultat attendu** : Non visible

### 4.3 Lien Odoo

- [ ] **Test 4.3.1** : Cliquer sur lien Odoo d'une exception
  - **Résultat attendu** : Ouvre la facture/BL correspondant dans Odoo

---

## 5️⃣ TESTS DE VOLUMÉTRIE ET PERFORMANCE

### 5.1 Grands volumes

- [ ] **Test 5.1.1** : Créer 100 factures d'importation valides
  - Vérifier temps de traitement ETL
  - Vérifier que toutes apparaissent

- [ ] **Test 5.1.2** : Créer 50 exceptions de types différents
  - Vérifier performance de l'interface

### 5.2 Rafraîchissement des données

- [ ] **Test 5.2.1** : Créer une facture dans Odoo
  - Lancer ETL
  - Vérifier apparition dans Treasury

- [ ] **Test 5.2.2** : Modifier une facture existante dans Odoo
  - Lancer ETL
  - Vérifier mise à jour dans Treasury

- [ ] **Test 5.2.3** : Supprimer/Annuler une facture dans Odoo
  - Lancer ETL
  - Vérifier disparition dans Treasury

---

## 6️⃣ TESTS DE ROBUSTESSE

### 6.1 Données invalides

- [ ] **Test 6.1.1** : Facture avec montant = 0
- [ ] **Test 6.1.2** : Facture avec montant négatif
- [ ] **Test 6.1.3** : Facture sans date
- [ ] **Test 6.1.4** : Facture avec caractères spéciaux dans référence

### 6.2 Cas limites

- [ ] **Test 6.2.1** : Facture avec montant très élevé (1,000,000+)
- [ ] **Test 6.2.2** : Facture avec montant décimal complexe (12,345.6789)
- [ ] **Test 6.2.3** : Date d'échéance très lointaine (dans 10 ans)
- [ ] **Test 6.2.4** : Facture très ancienne (créée il y a 5 ans)

---

## 7️⃣ TESTS DE FILTRAGE PAR COMPAGNIE

- [ ] **Test 7.1** : Créer des factures pour Compagnie A
  - Sélectionner Compagnie A dans Treasury
  - **Résultat attendu** : Voir uniquement données de Compagnie A

- [ ] **Test 7.2** : Créer des factures pour Compagnie B
  - Sélectionner Compagnie B
  - **Résultat attendu** : Voir uniquement données de Compagnie B

- [ ] **Test 7.3** : Aucune compagnie sélectionnée
  - **Résultat attendu** : Aucune donnée affichée

---

## 📊 RÉCAPITULATIF DES TESTS

### Statistiques

- **Total de tests** : _____ / _____
- **Tests réussis** : _____
- **Tests échoués** : _____
- **Tests bloqués** : _____

### Synthèse par Module

| Module | Total | ✅ Réussi | ❌ Échec | Taux |
|--------|-------|----------|----------|------|
| Achat Importation | | | | % |
| Ventes Locales | | | | % |
| Achats Locaux | | | | % |
| Exceptions | | | | % |
| Performance | | | | % |

### Issues identifiées

1. **Issue #1** : [Description]
   - Sévérité : Critique/Majeure/Mineure
   - Test concerné : [Numéro]
   - Action : [À corriger/À investiguer]

2. **Issue #2** : [Description]

---

## 📝 NOTES ET OBSERVATIONS

### Remarques générales

- 
- 
- 

### Points bloquants

- 
- 

### Améliorations suggérées

- 
- 

---

**Document créé le** : [Date]  
**Testeur** : [Nom]  
**Version Odoo** : [Version]  
**Version Treasury** : [Version]  
**Environnement** : Production / Staging / Développement
