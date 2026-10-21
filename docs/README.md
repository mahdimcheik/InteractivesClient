# Documentation InteractivesClient (front)

Le client web d'un « PowerPoint interactif » : l'hôte construit et lance une présentation, les
participants la suivent en direct sur leur propre écran. Tout désaccord entre le code et ces
documents est un bug — de l'un ou de l'autre — et doit être tranché explicitement.

Le modèle de données côté serveur est décrit dans le dépôt `InteractivesAPI`
(`Modele-donnees-presentations.md`).

## Index

### 20 — Spécifications fonctionnelles

- [Maquettes](20-specs-fonctionnelles/maquettes/) — pages HTML statiques (accueil, éditeur,
  inscription) servant de référence visuelle ; ni importées ni construites.

### 30 — Spécifications techniques

- [Éléments de diapositive](30-specs-techniques/01-elements-diapositive.md) — contrat commun,
  registre, ajouter un élément.

### 50 — Backlog

- [Feuille de route](50-backlog/01-roadmap.md) — les chantiers, regroupés en lots.
- [Questions ouvertes](50-backlog/02-questions-ouvertes.md) — arbitrages produit en attente.
- [Dette technique](50-backlog/03-dette-technique.md) — écarts connus, codés et rattachés à un
  lot.

## Conventions

- Documents en français ; statut en tête de document.
- Liens plutôt que reformulations ; liens vers le code sans numéro de ligne.
- **Mise à jour :** un lot livré, un écart corrigé ou une question tranchée est reporté
  **dans la même contribution** que le code qui le change.
