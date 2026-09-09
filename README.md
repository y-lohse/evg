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

Les scores sont calculés à partir de l’historique brut de `data/event.json`. Les contenus marqués comme démonstration sont fictifs et destinés au prototype.
