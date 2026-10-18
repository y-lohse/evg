# Clowrid Invitational — Live Monitor

Prototype statique GitHub Pages-ready, en HTML/CSS/JavaScript sans dépendance de production.

## Lancer localement

```sh
python3 -m http.server 8080
```

Ouvrir <http://localhost:8080>. L’accès direct en `file://` ne fonctionne pas car les données sont chargées avec `fetch`.

## Tests

```sh
npm test
npm run check
```

Les scores sont calculés à partir de l’historique brut de `data/event.json`. Les tendances comparent le classement actuel à celui précédant les trois résultats les plus récents (triés chronologiquement). Le fichier est alimenté pendant l’événement.

### Knight Squad 2 : résultats sans classement complet

- Le FFA spécial utilise `format: "ffa"`, `scoring: "knight-squad-ffa"`, les huit `participants` et deux `leaders` : le premier reçoit 4 points, le second 2, chacun des autres 1. Il ne s’agit pas d’un classement complet.
- Les duos utilisent `format: "2v2v2v2"`, `scoring: "winner-only"`, les huit `participants` et les deux `winners` : 3 points par gagnant, 1 par autre participant. Ne pas inventer les duos perdants ; leur composition reste inconnue tant qu’elle n’est pas fournie.
- Le 4v4 conserve son schéma habituel victoire/défaite (2/1 par joueur).
- Chaque résultat distribue 12 points. Les égalités de points de participation ne sont pas des places de podium. Pour les achievements, seuls les vainqueurs des résultats sans classement sont assurés d’un podium ; les alliances non renseignées ne sont pas déduites.


Le programme est éditable dans `data/programme.json`. Les sessions officielles utilisent un tableau `games` composé d’un `title` et de `formats` (`FFA`, `2v2v2v2`, `4v4` ou `FORMAT LIBRE`) ; les entrées de jeu libre peuvent omettre `formats`. Dans `data/event.json`, les équipes sont uniquement des groupes de joueurs avec un résultat ou une place : aucun nom d’équipe n’est demandé. Tous les chemins restent relatifs pour un déploiement GitHub Pages sous un sous-répertoire.
