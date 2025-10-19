# ✅ Checklist Rapide - Tests ETL Treasury

## 📌 Tests Essentiels à Effectuer Régulièrement

_Cocher après chaque test réussi | Date : ___________  Testeur : ___________

---

## 🔥 Tests Critiques (À faire à chaque déploiement)

### Achat Importation
- [ ] Facture CE brouillon, échéance future, avec taux de change → OK
- [ ] Facture CE avec échéance passée → Exception
- [ ] Facture CE sans taux de change → Exception
- [ ] Facture CE payée → N'apparaît PAS

### Ventes Locales
- [ ] Cycle complet : Commande → BL → Facture → Mouvement OK
- [ ] BL sans facture → Estimation automatique
- [ ] Facture Reg. Non Reçu échéance future → OK
- [ ] Facture échéance passée → Exception

### Achats Locaux
- [ ] Facture DA (non-CE) échéance future → OK
- [ ] Facture DA échéance passée → Exception
- [ ] Facture DA payée → N'apparaît PAS

### Général
- [ ] Exceptions visibles dans l'interface
- [ ] Notification bell affiche le bon nombre
- [ ] Liens Odoo fonctionnent
- [ ] Filtrage par compagnie fonctionne

---

## 🎯 Tests de Non-Régression (Hebdomadaire)

### Taux de change
- [ ] Taux décimal complexe (3.142857)
- [ ] Taux = 0 → Exception
- [ ] Taux manquant → Exception

### Dates
- [ ] Échéance = Aujourd'hui → OK
- [ ] Échéance = Date facturation → Exception
- [ ] Date BL < Échéance facture → Exception

### Statuts Ventes
- [ ] Reg. Reçu → Automatique
- [ ] Reg. Partiel → Partiel auto + Exception
- [ ] En paiement → Exception
- [ ] Extourné → Exception

### Volumétrie
- [ ] 50+ factures en une fois
- [ ] Rafraîchissement après modification Odoo

---

## 📋 Données de Test Suggérées

### Commandes Rapides à Créer

**Import 1** (Normal) :
- DA : `CE2025/TEST001`
- Montant : 10,000 TND
- Échéance : J+30
- Taux : 3.2

**Import 2** (Exception taux) :
- DA : `CE2025/TEST002`
- Montant : 15,000 TND
- Échéance : J+30
- Taux : **0 ou vide**

**Import 3** (Exception échéance) :
- DA : `CE2025/TEST003`
- Montant : 8,000 TND
- Échéance : **J-10**
- Taux : 3.3

**Local 1** (Normal) :
- DA : `DA2025/TEST001`
- Montant : 5,000 TND
- Échéance : J+30

**Vente 1** (Normal) :
- Commande : 20,000 TND
- BL : 20,000 TND (Date prévue J+15)
- Facture : 20,000 TND (Échéance J+30)

---

## 🐛 Bugs Connus à Vérifier

- [ ] [Bug #1] : Description
- [ ] [Bug #2] : Description

---

**Temps estimé** : 30-45 minutes pour tests essentiels  
**Fréquence recommandée** : Après chaque déploiement + 1x/semaine
