# Séance en direct

> Statut : **Livré (lot 6), à vérifier dans le navigateur** · Feuille de route :
> [lot 6](../50-backlog/01-roadmap.md)

L'hôte diffuse sa présentation ; chaque participant la suit sur son propre écran. Seul l'index
de la diapositive courante circule : chaque client rend lui-même la diapositive avec les
composants partagés (`src/app/shared/slides/`) en mode `Client`.

## Décisions produit (lot 6)

- **Compte obligatoire** pour rejoindre : `/seance` et `/seance/:code` sont protégées par
  `authGuard`, qui renvoie vers `/connexion?returnUrl=…` puis revient sur la séance.
- Le participant reste **calé sur l'hôte** : aucune navigation propre.
- **Une seule séance à la fois** par présentation : « Démarrer en direct » reprend la séance
  active (même code). Une séance terminée ne se rouvre pas ; on en démarre une nouvelle.
- **Rien n'est conservé** après la séance : l'état vit en mémoire dans l'API.

## Côté API (`InteractivesAPI`)

| Élément                                  | Rôle                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `POST /live-sessions`                    | démarrer ou reprendre (créateur de la présentation) → `LiveSessionDetails`        |
| `GET /live-sessions/{code}`              | état de la séance (tout utilisateur connecté)                                     |
| `GET /live-sessions/{code}/presentation` | contenu de la présentation, tant que la séance est active                         |
| `DELETE /live-sessions/{code}`           | terminer (hôte) ; diffuse `SessionEnded`                                          |
| hub `/hubs/live-session` (`[Authorize]`) | `JoinAsHost(code)`, `Join(code)` → index courant, `GoToSlide(code, index)` (hôte) |
| événements                               | `SlideChanged(index)`, `ParticipantCountChanged(n)` (hôte seul), `SessionEnded()` |

Le jeton JWT est lu dans la chaîne de requête (`access_token`) pour les chemins `/hubs`, le
navigateur ne pouvant pas poser d'en-tête sur un WebSocket. Les participants sont comptés par
utilisateur (deux onglets comptent une fois) ; l'hôte n'est pas compté. L'état
(`LiveSessionStore`, singleton) est perdu au redémarrage de l'API : à ce stade c'est accepté.

## Côté client

- `LiveSessionsMirrorService` — les routes REST, sans cache (la présentation d'un participant
  n'est pas la sienne et n'entre pas dans le cache de l'éditeur).
- `LiveSessionConnection` — la connexion SignalR, **une instance par écran** (dans `providers`
  du composant), ouverte une fois et fermée à la destruction. `@microsoft/signalr` est chargé à
  la demande (`import()`), hors du bundle initial. Le jeton est relu à chaque (re)connexion ;
  après une reconnexion, la connexion rejoint de nouveau la séance : le participant reprend sur
  la diapositive courante, l'hôte réaligne la séance sur celle qu'il affiche.
- Hôte (`PresentationEditor`) : « Démarrer en direct » ouvre le lecteur avec le lien, le code et
  le nombre de participants ; chaque changement de diapositive est envoyé par `GoToSlide`.
  Quitter le lecteur ne termine pas la séance : l'en-tête affiche « En direct », « Reprendre le
  direct » et « Terminer la séance » (avec confirmation).
- Participant (`features/live-session/`) : `/seance` pour saisir un code, `/seance/:code` pour
  suivre la séance (états : connexion, en direct, reconnexion, introuvable, terminée).

## Limites connues

- Un jeton d'accès expiré pendant la séance fait échouer la reconnexion : il faudra renouveler
  la session avant de se reconnecter.
- Au lot QCM, `GET /live-sessions/{code}/presentation` devra expurger les bonnes réponses.
