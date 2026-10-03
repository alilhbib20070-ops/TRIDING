# Trading Backtest Dashboard

Version web du fichier `Backtest_Tracker_Final.xlsx` : un dashboard global et des journaux mensuels ajoutables et supprimables
(5 semaines × 4 jours), avec les mêmes règles de calcul que l'Excel.

## Utilisation
Ouvre `index.html` dans un navigateur : aucun serveur, aucune installation.
Les données sont enregistrées dans le navigateur (localStorage). Utilise **Exporter (JSON)** pour les sauvegarder
ou les déplacer vers un autre appareil, et **Importer (JSON)** pour les recharger.

## Structure
```
trading-dashboard/
├── index.html        Page unique : menu latéral + zone de contenu
├── css/style.css     Thème sombre (palette de l'Excel)
├── js/
│   ├── seed.js       Données d'exemple (Month 1 et Month 2 de l'Excel)
│   ├── store.js      Données + sauvegarde localStorage + import/export JSON
│   ├── stats.js      Calculs : Trades, Win rate, Win/Loss ratio
│   ├── charts.js     Graphiques en barres SVG
│   ├── views.js      Vues Dashboard et Month
│   ├── detail.js     Pages de détail (clic sur une carte du dashboard)
│   ├── calendar.js   Calendrier des performances en %
│   └── app.js        Navigation (#/ et #/month/N) et événements
└── README.md
```

## Règles de calcul (identiques à l'Excel)
- Trades = Wins + Losses (le NT est affiché mais pas compté)
- Win rate = Wins ÷ Trades
- Win / Loss ratio = Wins ÷ Losses

## Déploiement
Le site est statique : glisse le dossier sur GitHub Pages, Netlify ou Vercel.

## P&L et risque par trade
Le switch en haut à droite choisit le risque par trade (0,5 % ou 1 %). Avec un RR de 1:2 :
WIN = +risque × 2, LOSS = −risque, NT = 0, cumul simple. Le seuil de rentabilité du win rate est 1 ÷ (1 + RR) = 33,3 %.
Le choix est enregistré avec les données (et inclus dans l'export JSON).

## Pages de détail
Les cartes principales du dashboard (performance, courbe de capital, win rate, résultats) sont cliquables (`#/d/<carte>`) : grand graphique avec le switch de risque, indicateurs précis, analyse par mois, par jour de la semaine et par semaine du mois.

## Thèmes, dates et calendrier
- 3 thèmes (Aura, Clair, Violet) : pastilles en haut à droite.
- Risque par trade : 0,5 %, 1 % ou 2 %.
- Date du 1er jour : choisis-la une fois, les autres jours (lundi à jeudi) se remplissent automatiquement.
- Calendrier : un jour = un résultat en % (WIN, LOSS, NT) avec le total de la semaine.
- Graphiques : le curseur en croix affiche le jour et la valeur.
