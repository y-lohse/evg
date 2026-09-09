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

Le programme est éditable dans `data/programme.json`. Les sessions officielles utilisent un tableau `games` composé d’un `title` et de `formats` (`FFA`, `2 ÉQUIPES`, `4 ÉQUIPES` ou `FORMAT LIBRE`) ; les entrées de jeu libre peuvent omettre `formats`. Tous les chemins restent relatifs pour un déploiement GitHub Pages sous un sous-répertoire.
