# 📚 Documentation des Tests ETL Treasury

## Vue d'ensemble

Ce dossier contient la documentation complète pour tester manuellement les ETL (Extract, Transform, Load) du système de trésorerie à partir d'Odoo.

## 📄 Documents disponibles

### 1. GUIDE_TESTS_ODOO.md
**Guide exhaustif de tests manuels**

- ✅ **Quand l'utiliser** : Tests complets avant mise en production, tests de régression majeurs
- 📊 **Contenu** : Plus de 80 scénarios de test détaillés avec cases à cocher
- ⏱️ **Durée estimée** : 3-5 heures pour l'ensemble des tests
- 🎯 **Public cible** : QA, développeurs, chefs de projet

**Sections principales** :
- Achat Importation (15+ tests)
- Ventes Locales (25+ tests)
- Achats Locaux (10+ tests)
- Gestion des Exceptions (10+ tests)
- Tests de volumétrie et performance
- Tests de robustesse
- Récapitulatif et statistiques

### 2. CHECKLIST_TESTS_RAPIDE.md
**Checklist de tests essentiels**

- ✅ **Quand l'utiliser** : Tests quotidiens, après chaque déploiement, smoke tests
- 📊 **Contenu** : 20-30 tests critiques prioritaires
- ⏱️ **Durée estimée** : 30-45 minutes
- 🎯 **Public cible** : Équipe de développement, testeurs

**Tests inclus** :
- Tests critiques obligatoires
- Tests de non-régression hebdomadaires
- Données de test pré-configurées
- Bugs connus à vérifier

### 3. spec-odoo.md
**Spécification technique**

- Document de référence décrivant les règles métier
- Base pour la création des tests

## 🚀 Comment utiliser ces guides

### Pour un nouveau testeur

1. **Lire** `spec-odoo.md` pour comprendre les règles métier
2. **Commencer** par `CHECKLIST_TESTS_RAPIDE.md` pour se familiariser
3. **Approfondir** avec `GUIDE_TESTS_ODOO.md` pour les tests complets

### Pour un test après déploiement

1. **Utiliser** `CHECKLIST_TESTS_RAPIDE.md`
2. Se concentrer sur la section "Tests Critiques"
3. Durée : ~30 minutes

### Pour une release majeure

1. **Utiliser** `GUIDE_TESTS_ODOO.md` complet
2. Remplir toutes les sections
3. Documenter les issues dans la section dédiée
4. Compiler les statistiques finales

### Pour un test de régression

1. **Choisir** les sections pertinentes de `GUIDE_TESTS_ODOO.md`
2. Ajouter les tests spécifiques aux bugs corrigés
3. Vérifier la section "Tests de robustesse"

## 📝 Bonnes pratiques

### Avant de commencer les tests

- [ ] Sauvegarder la base de données
- [ ] Utiliser un environnement de test/staging
- [ ] Vérifier que l'ETL est configuré et opérationnel
- [ ] Avoir accès admin à Odoo
- [ ] Avoir accès à l'application Treasury

### Pendant les tests

- ✅ Cocher chaque test réussi
- ❌ Noter les échecs avec détails
- 📝 Prendre des captures d'écran si nécessaire
- ⚠️ Documenter tout comportement inattendu
- 🔗 Vérifier TOUS les liens Odoo

### Après les tests

- 📊 Compiler les statistiques
- 🐛 Créer des tickets pour les bugs trouvés
- 📄 Archiver le document de test avec date et version
- 🔄 Mettre à jour la section "Bugs connus"

## 🎯 Scénarios de test par priorité

### Priorité CRITIQUE (P0) ⚠️
Tests qui DOIVENT passer pour la mise en production :

1. Facture import normale → Mouvement OK
2. Facture import sans taux → Exception
3. Facture payée → N'apparaît PAS
4. Filtrage par compagnie fonctionne
5. Exceptions visibles dans l'interface

### Priorité HAUTE (P1) 🔥
Tests importants pour la qualité :

1. Tous les types d'exceptions détectées
2. Cycle complet ventes locales
3. Différenciation Import/Local
4. Liens Odoo fonctionnels
5. Rafraîchissement après modification

### Priorité MOYENNE (P2) 📋
Tests de confort et edge cases :

1. Volumétrie (50+ factures)
2. Cas limites (montants extrêmes)
3. Données invalides
4. Performance interface

### Priorité BASSE (P3) 💡
Tests optionnels, amélioration continue :

1. Caractères spéciaux
2. Très anciens enregistrements
3. Tests UI/UX avancés

## 📊 Modèle de rapport de test

```markdown
# Rapport de Test ETL Treasury

**Date** : [JJ/MM/AAAA]
**Testeur** : [Nom]
**Version** : [Treasury v1.2.3 / Odoo v16.0]
**Environnement** : [Production/Staging/Dev]
**Type de test** : [Complet/Rapide/Régression]

## Résumé Exécutif
- Tests effectués : X / Y
- Tests réussis : X (XX%)
- Tests échoués : Y (YY%)
- Bloquants : Z

## Détails par Module
[Copier depuis GUIDE_TESTS_ODOO.md section Récapitulatif]

## Issues identifiées
1. [Titre] - Sévérité: [Critique/Majeure/Mineure]
   - Description : ...
   - Steps to reproduce : ...
   - Résultat attendu : ...
   - Résultat obtenu : ...

## Recommandations
- [ ] Peut être déployé en production
- [ ] Nécessite corrections avant déploiement
- [ ] Tests supplémentaires requis

## Annexes
- Captures d'écran
- Logs
- Données de test utilisées
```

## 🔄 Mise à jour des documents

### Quand mettre à jour ?

- ✏️ Nouveau scénario identifié
- 🐛 Bug trouvé nécessitant un test
- 📝 Règle métier modifiée
- ⚙️ Changement dans Odoo ou Treasury

### Comment mettre à jour ?

1. Modifier le document approprié
2. Mettre à jour la date de dernière modification
3. Ajouter une note dans `spec-odoo-changelog.md` si règle métier
4. Informer l'équipe du changement

## 🆘 Support

En cas de questions ou problèmes avec les tests :

1. **Référence** : Consulter `spec-odoo.md` pour les règles métier
2. **Issues connues** : Vérifier la section "Bugs connus"
3. **Équipe technique** : Contacter l'équipe de développement
4. **Documentation Odoo** : [Lien vers doc Odoo si disponible]

## 📈 Historique des versions

| Date | Version | Changements |
|------|---------|-------------|
| 2025-10-19 | 1.0 | Création initiale des guides de test |
| | | Ajout taux de change pour importations |

---

**Maintenu par** : Équipe Treasury  
**Dernière mise à jour** : 2025-10-19
