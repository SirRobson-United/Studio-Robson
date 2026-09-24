# Studio Robson

Persoonlijke kracht- en hypertrofie-tracker. Installeerbare PWA, draait volledig
in de browser, geen server en geen account. Alle data staat in `localStorage` op
het toestel zelf.

## Bestanden

| Bestand | Rol |
|---|---|
| `index.html` | De hele app: markup, CSS en JS in één bestand |
| `sw.js` | Service worker — offline gebruik en automatische updates |
| `manifest.webmanifest` | Maakt "toevoegen aan beginscherm" een echte app |
| `logo.png`, `icon-*.png`, `apple-touch-icon.png` | Beeldmateriaal |

## Deployen

GitHub Pages serveert de map zoals hij is — er is geen buildstap.

```bash
git add -A && git commit -m "beschrijving" && git push
```

Een minuut later staat de nieuwe versie live. Op de gsm komt hij binnen bij het
eerstvolgende openen: de service worker haalt `index.html` altijd eerst van het
netwerk, ziet de nieuwe versie, en toont de knop **Vernieuwen**.

### Versienummer bij elke deploy ophogen

Twee plekken, altijd hetzelfde nummer:

- `index.html` → `const APP_VERSION = '2.0.0';`
- `sw.js` → `const VERSION = '2.0.0';`

Zonder die bump blijft de oude cache staan en ziet de gsm de wijziging niet.

## Het trainingsschema aanpassen

Alles zit in de `WORKOUTS`-array bovenaan het `<script>`-blok in `index.html`.
De rest van de app (vorige-keer-geheugen, PR's, volume, historiek) leest daaruit
en past zich vanzelf aan.

```js
{id:'gymA', name:'Basic Fit — Full body A', loc:'gym', icon:'🏋️', badge:'blue',
 focus:'korte omschrijving',
 exercises:[
   {name:'Leg press',        sets:3, reps:'10–12', w:true},              // kg × reps
   {name:'Pull-up (assist)', sets:3, reps:'8–10',  w:true, invert:true}, // lager = beter
   {name:'Push-ups',         sets:3, reps:'max',   w:false},             // alleen reps
 ]}
```

Een workout met een lege `exercises`-array is een **vrije sessie**: je stelt hem
tijdens het trainen zelf samen. In elke sessie — ook een vaste — kan je onderaan
oefeningen toevoegen; die komen in `draft.extra` en worden bij het afronden gewoon
mee opgeslagen. Nieuwe namen belanden in `state.customExercises` en duiken daarna
op in de suggestielijst.

- `loc: 'gym'` telt mee voor het Basic Fit-weekdoel, `'thuis'` voor het thuisdoel.
- `invert: true` voor assist-machines (pull-up, dip): minder gewicht is daar
  vooruitgang. Zulke oefeningen tellen niet mee in het volume — assistentie is
  geen getilde last.
- `id` nooit hergebruiken voor iets anders — gelogde sessies verwijzen ernaar.
- Oefeningen hernoemen breekt de koppeling met eerder gelogde sets (die blijven
  bestaan onder de oude naam, maar "vorige keer" begint opnieuw).

## Datamodel (`localStorage`, key `fittrack`)

```js
{
  sessions: [{ts, date, week, wid, name, loc, mins, sets:[{ex, kg, reps, w, inv, ts}]}],
  draft:    {wid, started, sets:[…], extra:[…]} | null,   // sessie die nu bezig is
  customExercises: [{name, w}],                // zelf toegevoegde oefeningen
  goals:    {gym, thuis, rowKm, eiwit},
  rowLog:   [{km, date, week}],
  weightLog:[{w, date}],
  profile:  {naam, gewicht, lengte},
  groceryDone, selectedRecipes, bestStreak,
  trainDone, repLog                            // archief van de oude app
}
```

`trainDone` en `repLog` komen uit de vorige versie (vast weekschema, losse reps).
Ze worden niet meer geschreven, alleen nog getoond in Historie en meegeteld in de
weekstatistieken, zodat oude data niet verdwijnt.

## Lokaal testen

```bash
node pad/naar/serve.js . 4173
```

Een service worker heeft `https` of `localhost` nodig — het bestand rechtstreeks
openen met `file://` werkt dus niet voor de offline- en updatefuncties.
