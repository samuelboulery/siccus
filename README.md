# Siccus

Un mot devient une planche d'herbier. Le même mot rend toujours le même spécimen.

> *Siccus* — de *hortus siccus*, « jardin sec ». Le nom latin historique de l'herbier :
> une collection de plantes séchées, montées sur planches et annotées.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | typecheck puis build de production dans `dist/` |
| `npm run test` | déterminisme, contenu, cadrage |
| `npm run lint` | ESLint — refuse `Math.random()` |
| `npm run typecheck` | `tsc --noEmit` |

---

## La règle qui tient tout

**`Math.random()` est interdit dans tout le projet.** Chaque valeur dérive de
`xmur3(normalize(mot))` → `mulberry32(seed)`, et l'instance `rng` est passée en
paramètre à toute fonction qui en a besoin — jamais de singleton global.

Deux garde-fous : la règle ESLint `no-restricted-properties`, et
`src/lib/determinismGuard.test.ts`, qui relit les sources et ne peut pas être
neutralisé par un commentaire.

### ⚠ L'ordre de consommation est un contrat

Les appels à `rng()` alimentent des paramètres précis, dans un ordre figé :

```
1. génome (13 tirages)   src/generator/genome.ts
2. partie aérienne       src/generator/ports.ts
3. système racinaire     src/generator/roots.ts
4. nomenclature (9)      src/generator/nomenclature.ts
```

Insérer un tirage **au milieu** de cette chaîne décale tout ce qui suit et change
rétroactivement toutes les plantes déjà générées — sans la moindre erreur visible.
Un prénom offert il y a six mois ne rendrait plus la même planche.

**Tout nouveau paramètre s'ajoute à la fin.** `src/generator/determinism.test.ts`
fait tomber la build sinon.

---

## Changer les textes

Tout le texte visible — interface et planche — vit dans deux fichiers :

```
src/content/fr.ts
src/content/en.ts
```

Un texte à corriger = une ligne à éditer. Les chaînes qui contiennent `{quelquechose}`
sont des gabarits remplis par `fill()` : les noms entre accolades ne se traduisent pas.

### Ajouter une langue

1. Copier `fr.ts` en `xx.ts`, traduire.
2. L'ajouter à `CONTENT` et `LOCALES` dans `src/content/index.ts`.

Le type `Content` impose des **tuples de longueur fixe** pour `loci` (7) et `notes` (8) :
le seed tire un index dans ces listes, donc une traduction qui en compterait une de
moins ne compile pas.

La langue **n'entre jamais dans le calcul de la planche**. `buildPlate()` ne renvoie
que des identifiants et des index (`portId`, `noteIndex`, `locusIndex`…) ; la couche de
rendu va chercher la chaîne dans `content`. Basculer FR ↔ EN ne déplace pas un trait :
la géométrie, la palette, le binôme latin et le n° de spécimen sont identiques.

La langue initiale suit `navigator.language`, puis le choix est retenu en `localStorage`.

---

## Structure

```
src/
├── generator/     100 % pur, aucune dépendance React — c'est ce qui le rend testable
│   ├── rng.ts             normalize · xmur3 · mulberry32
│   ├── geometry.ts        tracés lissés, tiges, rubans, vrilles
│   ├── leaf.ts            organes foliaires
│   ├── genome.ts          ⚠ ordre de consommation figé
│   ├── ports.ts           arbustif · rosette · graminée · grimpant · fougère
│   ├── roots.ts           racines fibreuses ou pivotantes
│   ├── framing.ts         bounding box calculée APRÈS génération
│   ├── nomenclature.ts    binôme latin, n° de spécimen
│   └── buildPlate.ts      orchestration → Plate
├── content/       fr.ts · en.ts · types · détection de langue
├── components/    écran unique + composition de la planche A3
└── lib/           types, polices, export SVG/PNG
```

Une planche est décidée **en une passe**, avant l'affichage. L'animation ne fait que
révéler une planche déjà entièrement décidée ; aucun calcul pendant la croissance.

---

## Exports

L'export ne clone pas le SVG affiché : il rend un `PlateSvg` statique dédié
(`animated: false`, `textured: true`). Exporter pendant la croissance donne donc le
même fichier qu'après.

Les quatre polices sont **inlinées en base64** dans le fichier produit (~185 Ko). Sans
cela le SVG s'ouvre en serif système chez l'imprimeur, et le PNG — rasterisé depuis une
`Image` détachée du document — ne peut charger aucune police.

- **SVG** — A3, `297mm × 420mm`, coordonnées à 2 décimales.
- **PNG** — 1188 × 1680 px (×4).
- Nom de fichier : `siccus-anthepogon-robusta-8088.svg`

### Poids des fichiers

La résolution d'écriture des feuilles est proportionnelle à leur taille
(`emission()` dans `leaf.ts`) : une feuille de canopée fait ~3 mm sur la planche et
n'a pas besoin de 46 points de contour. **Ce réglage n'intervient qu'à l'émission** —
tous les points sont calculés, donc tous les tirages `rng` ont lieu, et alléger un
organe ne déplace pas une branche.

| Cas | SVG |
|---|---|
| mot court, rosette / graminée | 260 – 290 Ko |
| grimpant, fougère | 370 – 420 Ko |
| mot long, port arbustif dense (>1000 feuilles) | 1,7 – 2,4 Mo |

Le dernier cas dépasse la cible de 500 Ko : un arbre de 1500 feuilles individuellement
tremblées ne tient pas sous cette barre sans réduire le nombre de feuilles ou réutiliser
un jeu de formes via `<use>`. Les deux changeraient le dessin.

---

## Origine

Ce dépôt est né d'une ébauche Claude Design, conservée intacte dans `_legacy/`.
La logique générative a été transposée module par module, puis **vérifiée par diff
octet à octet** contre l'ébauche : sur treize mots couvrant les cinq ports et 3,6 Mo
de géométrie, branches, positions et tailles de feuilles, cadrage et nomenclature sont
identiques. `shots/` garde les captures de référence.
