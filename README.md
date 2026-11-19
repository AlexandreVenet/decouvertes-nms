# Notes

## 🚀 19-11-2026

Première version fonctionnelle. 🥳


## 🧾Fichiers d'aide

Notes *Obsidian* à compléter.  
Une fois prêts, les placer dans un dossier du projet pour référence.


## 🧐 Evolution : multi-outils dans station spatiale

Ajouter des informations sur les 2 multi-outils (photo, inventaire, stats, niveau...) ?


## 🧐 Evolution : cargo dans les particularités

Ajouter des informations sur un éventuel vaisseau capital (photo, inventaire, stats, niveau...) ?


## 🧐 Evolution : environnement déduit automatiquement

Ajouter au référentiel **toutes les désignations** de caractéristiques planétaires de façon en déduire **programmatiquement** les catégories environnementales (fonctionnement exclusivement par `id`).

Autoriser néanmoins la saisie libre en cas d'erreur (idem classe spectrale par exemple).


## 🧐 Evolution : éditer les données

Ajouter un écran permettant de saisir les informations d'un système de façon à en obtenir le fichier de données JSON correspondant.


## 🤔 Evolution : index en langage glyphique

Remplacer le chiffre de l'index par le glyphe correspondant ?

Problème : le chiffre est un index, donc un glyphe, et pourtant les objets d'espace profond n'ont pas d'inex, donc pas de glyphe.


## 🤔 Evolution : corps d'espace profond

Ajouter les types de **corps d'espace profond** de la mise à jour Cosmos ? Dont les bases personnelles ?

Problème : les corps sont triés par index par rapport au centre du système et pourtant il semble que les nouveaux objets stellaires n'aient pas d'index (puisqu'ils n'ont pas d'adresse de portail).

Voir avec l'évolution concernant l'index en langage glyphique.


## 💬 Type de terrain

Ajouter une donnée pour le type de *terrain* d'une planète ou lune ? Actuellement **non** car sans donnée explicite, l'observation seule reste subjective et discutable.

Sources
- https://nomanssky.fandom.com/wiki/Biome#Terrain_Variations
- https://nomanssky.fandom.com/wiki/Terrain_Archetype


## 💬 Bloc spécial

Le bloc *Special* est-il utile ? Pour le moment, il est **désactivé**.


## 💬 Systèmes inexplorés

Il existe les *uncharted systems*, différents des *abandoned*. Ces systèmes n'ont pas d'information de race, économie ou conflit. Or, au niveau de la galaxie, les filtres peuvent indiquer une économie et un niveau de conflit. En tenir compte ? Actuellement **non** et cette information n'est pas fournie en accueil.

Sources
- https://nomanssky.fandom.com/wiki/Abandoned_System
- https://nomanssky.fandom.com/wiki/Uncharted_System


## 💬 Economie de système abandonné

Dans `Main.renseignerEconomie()`, garder les puces pour les systèmes abandonnés même si le niveau d'économie est toujours `1` ? Actuellement **non** et cette information est fournie en accueil.


