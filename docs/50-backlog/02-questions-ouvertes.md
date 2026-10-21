# Questions ouvertes

> Statut : **Brouillon** · Ordre de traitement : [feuille de route](01-roadmap.md)
>
> Arbitrages produit à trancher avant le lot qui en dépend. Une question tranchée est retirée
> d'ici et sa réponse va dans la spec concernée.

## Avant le lot 4 — Propriétés et mise en forme

- **Les diapositives suivent-elles le thème clair / sombre du spectateur ?** Aujourd'hui le
  texte des éléments utilise `--app-text-color` : un participant en thème sombre ne voit pas la
  même diapositive que l'hôte. Couleurs propres à la diapositive (arrière-plan et texte choisis
  par l'auteur), indépendantes du thème de l'application ?

## Avant le lot 6 — Séance en direct

- **Qui peut rejoindre ?** Participant anonyme avec un pseudo, ou compte obligatoire (rôle
  `Client`) ? Conditionne la route `/seance/:code`, les gardes et le RGPD.
- **Le participant peut-il naviguer seul** dans les diapositives déjà vues, ou reste-t-il
  toujours calé sur l'hôte ?
- **Plusieurs séances simultanées** d'une même présentation ? Une séance peut-elle être
  reprise après l'avoir terminée ?
- **Que garde-t-on après la séance ?** Liste des participants, durée, rien ?

## Avant le lot 7 — QCM

- **Réponse unique ou multiple ?** Minuteur ?
- **Résultats nominatifs ou anonymes** pour l'hôte ? Conservés après la séance (suivi de
  l'élève) ou perdus ?
- Le participant voit-il la répartition des réponses après la révélation ?
