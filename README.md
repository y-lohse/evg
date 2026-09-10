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

Les scores sont calculés à partir de l’historique brut de `data/event.json`. Les tendances comparent le classement actuel à celui précédant les trois résultats les plus récents (triés chronologiquement). Les contenus marqués comme démonstration sont fictifs et destinés au prototype.

Le programme est éditable dans `data/programme.json`. Les sessions officielles utilisent un tableau `games` composé d’un `title` et de `formats` (`FFA`, `2v2v2v2`, `4v4` ou `FORMAT LIBRE`) ; les entrées de jeu libre peuvent omettre `formats`. Dans `data/event.json`, les équipes sont uniquement des groupes de joueurs avec un résultat ou une place : aucun nom d’équipe n’est demandé. Tous les chemins restent relatifs pour un déploiement GitHub Pages sous un sous-répertoire.
