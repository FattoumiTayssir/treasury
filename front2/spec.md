# Spec Application Power App

# Tabtré App

**Contexte**
Ce document sert de référence pour le développement d’une application Power App **Tabtré App**
pour le groupe de sociétés Universal permettant de prévoir la trésorerie de ces entreprises à
hauteur des 6 prochains mois.

**Exigences métier**
L’application **Tabtré App** doit permettre les fonctionnalités suivantes :

**1. Affichage du Dashboard**
    Afficher un Dashboard BI **Tabtré Dashboard** (développé à part hors périmètre de cette spec)
**2. MAJ du dashboard**
    Mettre à jour le Dashboard à la demande (par un simple appui sur un bouton **Mettre à jour**
    au sein de l’application.
    Au cas où il y a une erreur, elle doit être affichée
**3. Affichage des mouvements financiers prévisionnels**
    Consulter toutes les données qui correspondent au tableau de trésorerie qui sont des
    mouvements financiers prévisionnels d’entrées / sorties d’argent. Ces données permettent
    d’expliquer ce qui est affiché dans le Dashboard.

```
Avant d’afficher les mouvements financiers, l’application doit demander s’il faut rafraîchir
les données en précisant la dernière date de rafraîchissement
```
```
Chaque mouvement correspond à :
```
- Une catégorie : RH, Achat, Vente, Compta ou “Autre”
- Un type (Ex : CNSS, Importation, Achat local, Vente, TVA, Salaires, ...)
- Un montant (valeur absolu)
- Signe : Entrée / Sortie
- Une date précise : Jour/Mois/Années
- Type de la Référence : Facture/Avoir de vente, Facture/Avoir d’achat, BL de vente,
    Commande client, Commande Fournisseur
- Référence : Simple chaîne de caractères qui représente par exemple le numéro de
    facture, de BL, etc.
- Etat de référence : exemple “Reg. Reçu” qui représente par exemple l’état de la
    facture, BL, etc.
- Source : “Odoo”, “Entrée manuelle”
- Note : texte optionnel (uniquement pour les entrées manuelle)


- Visibilité : Tout / Hors simulation / Simulation privée (uniquement pour les entrées
    manuelle)
    Seule mes simulations privées s’affichent pas celles des autres. Ils ne seront pas pris
    en compte
- Statut --> Actif / Désactivé / Tout

```
Un filtre de recherche doit permettre de filtrer les données par
```
- Catégorie
- Type
- Dates (min/max)
- Signe : c'est-à-dire **Entrée** ou **Sortie** d’argent en fonction du signe du montant.
    Montant positif → Entrée, Montant négatif → Sortie
- Montant (min/max) → ici il faut raisonner en valeur absolue
- Source (Odoo, Entrée manuelle, Tout), par défaut : Tout
    _Voir les prochains paragraphes pour plus d’infos sur ce filtre_
- Type de Référence, par défaut : Tout
- Référence
- Etat de référence
- Visibilité : Par défaut “Tout”
- Statut --> Actif / Désactivé / Tout --> Par défaut : Actif
Avant d’afficher les mouvements, l’application doit demander s’il faut rafraîchir les données
en précisant la dernière date de rafraîchissement
Dans chaque affichage, on doit systématiquement mettre à jour l’état de référence (chaque
facture, BL, etc.) quand c’est une entrée manuelle.
**4. Ajout d’entrées manuelles**
Définir des mouvements financiers additionnels d’une façon manuelle. Ces mouvements
seront appelés **entrées manuelles** dans cette spec
Pour chaque entrée manuelle, il est nécessaire de définir les éléments suivants :
- Catégorie : RH, Achat, Vente, Compta ou “Autre”
- Type (par exemple : Salaires, Internet, impôts, TVA, ...)
- Référence (Optionnel): Simple chaîne de caractères qui peut représenter par
exemple le numéro d’une facture etc.
- Type de la Référence (Optionnel): Facture/Avoir de vente, Facture/Avoir d’achat, BL
de vente, Commande client, Commande Fournisseur
- Montant en valeur absolue
- Signe : (Entrée / Sortie)
- Fréquence : une seule fois, mensuel, annuel
- Date(s): selon la fréquence
Une seule fois → Date exacte : Jour/Mois/Années
Mensuel → Tous les X de chaque mois (Ex : Tous les 20 du mois)
Annuel → Tous les X du mois Y (Ex : tous les 1er Janvier)
Il doit être possible de définir plusieurs dates pour la même entrée manuelle (c-à-d
une liste de dates) si la fréquence est mensuelle ou annuelle


```
Ex : Tout le 1er janvier et tous les 15 février
```
- Note (Optionnelle : description sous forme de texte)
- Visibilité :
    - Public : Tout le monde pourra voir cette entrée manuelle
    - Simulation privée : Seul l’utilisateur qui a ajouté cette entrée manuelle peut
       la voir
    - Tout (par défaut) : cela groupe les deux visibilités précédentes
- SI la référence existe déjà, c’est un conflit
o Soit la référence existe dans une autre entrée manuelle --> Warning non bloquant
- Soit la référence existe mais dans une entrée automatique (source Odoo), dans ce
cas, on propose de désactiver l’entrée automatique (optionnel)

L’application doit ajouter automatiquement les données suivantes :

- L’utilisateur qui a fait l’ajout de l’entrée manuelle
- La date d’ajout de l’entrée manuelle
- L'État de référence actuel dans Odoo (si la référence a été renseignée par
    l’utilisateur et si elle existe vraiment dans Odoo → nécessite l’appel à une API. Si la
    référence n’est pas trouvée, mettre dans l'État de référence “Erreur”. Et l’utilisateur
    doit être notifié (on doit attirer son attention)
**5. Affichage des entrées manuelles**
L’application doit permettre de lister les entrées manuelles avec deux vues différentes
1. Telles qu’elles ont été entrées dans le formulaire de création d’une entrée manuelle
(avec en automatiquement plus l’information ajoutée par le système)
Il doit être possible de filtrer selon les filtres suivants :
- Utilisateur : celui qui a ajouté l’entrée manuelle
- Date de dernière mise à jour (min / max)
- Catégorie : RH, Achat, Vente, Compta ou “Autre”
- Type (Ex: CNSS, Importation, Vente, TVA, Salaires, ...)
- Signe : c'est-à-dire **Entrée** ou **Sortie** d’argent en fonction du signe du
montant. Montant positif → Entrée, Montant négatif → Sortie
- Montant (min/max)
- Fréquence : Une seule fois, mensuel, annuel
- Visibilité
- Type de référence
- Référence
- Etat de référence : par défaut Tout
- Recherche par mots clés dans la note ( substring insensible à la casse)
2. Sous forme éclatée en mouvements financiers --> Liste des mouvements avec filtre
sur les entrées manuelles (paragraphe 3)
A chaque affichage, l’état actuel de référence doit être mis à jour --> appel à une API
**6. Modification des entrées manuelles**


```
Il doit être possible de modifier une entrée manuelle. Le système doit traquer
(automatiquement, sans demander l’information) l’utilisateur qui a fait la modification et la
date de mise à jour
L’état de référence doit également être mis à jour (Appel API)
Il doit être possible d’activer ou désactiver une entrée manuelle
```
**7. Suppression d’entrées manuelles**
    Il doit être possible de sélectionner un certain nombre d’entrées manuelles et les supprimer
    d’une façon groupée. L’application doit d’abord demander confirmation
**8. Affichage de la liste des exceptions**
    La base de données qui sera utilisée par l’application contint des données sur les exceptions
    qui ont été constatés lors de l’ajout des mouvements en provenance d’odoo
    L'application Tabtré App doit pouvoir afficher ces exceptions. Pour chaque exception les
    champs affichés sont les suivants :
       - Catégorie : RH, Achat, Vente, Compta ou “Autre”
       - Type de (Ex : CNSS, Importation, Vente, TVA, Salaires, ...)
       - Type d'exception : “Mouvements ajoutés automatiquement”, “Mouvements non
          traités à ajouter manuellement”, “Mouvements partiellement ajoutés : à compléter”
       - Criticité : Critique, Majeure, Warning
       - Description : Simple chaîne de caractères qui décrit l’exception
       - Montant (En valeur absolue)
       - Signe (Entrée / Sortie)
       - Type de la Référence: Facture/Avoir de vente, Facture/Avoir d’achat, BL de vente,
          Ref de Paiement Client, Ref de Paiement Fournisseur, Commande client, Commande
          Fournisseur, Paiement Fournisseur, Paiement Client
       - Référence : Simple chaîne de caractères qui représente le numéro de BL,
          Commande, ...
       - Etat de référence : exemple “Reg. Partiellement Reçu”
       - Lien vers Odoo
       - Etat de l’exception : Visible / Cachée

Il doit être possible de filtrer selon les critères suivants :

- Catégorie
- Type de Mouvement
- Type d'Exception
- Criticité
- Type de référence
- Référence
- Etat de référence
- Montant (min/max)
- Signe : Entrée / Sortie / Tout (Par défaut Tout)
- Recherche par mots clés dans la description ( substring insensible à la casse)


- Etat de l’exception : Visible / Cachée / Tout (par défaut: Tout)

```
Avant d’afficher les exceptions, l’application doit demander s’il faut rafraîchir les données en
précisant la dernière date de rafraîchissement
```
```
L’état de référence (facture, BL, ..) doit être automatiquement mis à jour.
```
```
Lors de l’affichage des exceptions, il doit être possible de marquer une liste d’exceptions
comme visibles ou cachées (ex: avec une icône qui représente un œil ou une coche/toggle)
```
**9. Désactivation / Activation d’un mouvement financier**
    Il doit être possible de désactiver ou réactiver un ou plusieurs mouvements financiers à
    partir de la liste des mouvements (par sélection), en précisant une raison
    Le système conserve l’information de qui a désactivé chaque mouvement et quand.

```
Affichage
Il doit être possible de filtrer sur les mouvements désactivés selon la date de désactivation
(min/max) et la personne qui a désactivé le mouvement. Il doit être possible également de
consulter la note associée à chaque mouvement désactivé pour savoir pourquoi il a été
désactivé
```
**10. Montant de trésorerie à une date de référence**

```
L’utilisateur doit préciser le montant de la trésorerie à la date d’aujourd’hui : comptes
bancaires + espèce
Les valeurs par défaut sont remplies à partir de Odoo
```
```
Si l’utilisateur ouvre l’application plus tard et que la date de référence (par rapport au solde)
est passée, un Warning sera affiché pour l’inciter à mettre à jour le montant de trésorerie de
référence en expliquant que sinon, les estimations peuvent être erronées
```
**Exigences fonctionnelles de la gestion des utilisateurs et des rôles et responsabilités**

- L’application Power App prévoit deux types d’utilisateurs : les Admins et les utilisateurs
    simples (les gestionnaires). Les admins se distinguent par la possibilité de créer les
    utilisateurs et modifier leurs profils. Le mot de passe est toujours celui de Microsoft 365.
- L’application doit permettre aux gestionnaires de gérer la trésorerie des entreprises
    auxquelles ils ont droit. Par exemple, si un gestionnaire a le droit de gérer Universal et non
    pas Palliser, alors l’application ne doit pas lui permettre de voir les données de Palliser. Si en
    revanche il a le droit de tout voir alors il verra les deux.


- Les données de plusieurs entreprises (ex: Universal, Avanza et Platinium) doivent pouvoir
    être groupées dans un même tableau de trésorerie en plus de la possibilité de les voir
    séparément (par défaut)

**Exigences fonctionnelles additionnelles (V1)**

- **Filtrage:**
    Partout où il y a des filtres, il doit être possible de les combiner avec une logique “ET” ou une
    logique “OU”
       - Logique “ET” → Tous les critères de recherche doivent être vérifiés simultanément
          (sauf les filtres non remplis)
       - Logique “OU” → Au moin un des critères de recherche doit être satisfait
    Par défaut la logique des filtre est une logique “ET” mais l’utilisateur pour choisir la logique
    “OU” s’il le souhaite


