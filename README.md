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

### Une rupture, datée

Le **4 août 2026**, le générateur est passé au moteur d'axes à nœuds et au rendu de
taille-douce. Toutes les plantes antérieures ont changé d'aspect. C'était délibéré :
l'application n'était pas publiée, aucune planche n'avait été offerte. Les empreintes de
`determinism.fixtures.json` repartent de cette date, et le contrat « même mot = même
planche » court à partir de là. Il n'y aura pas de seconde rupture sans versionner le
générateur.

---

## Changer les textes

### Dans l'app — le panneau « Contenu de la planche »

Chaque texte de la feuille est modifiable en place, y compris le binôme latin, la
station de récolte et le numéro d'herbier. Le champ affiche la valeur tirée en
invite, et une flèche ⟲ y ramène.

Deux portées, définies par `scope` dans `PLATE_TEXT_FIELDS` (`src/lib/plateText.ts`) :

| Portée | Exemples | Durée de vie |
|---|---|---|
| `global` | récolteur, en-têtes, étiquettes latines, tampon, mention de pied | `localStorage`, suit tous les mots |
| `specimen` | binôme, famille, station, altitude, notes, folio | mémoire seule, revient au tirage au mot suivant |

Rien de tout cela n'entre dans le calcul du dessin : la planche est décidée avant, et
le texte se pose par-dessus. C'est ce qui permet d'ouvrir même le binôme à l'édition
sans abîmer le déterminisme — `determinism.test.ts` vérifie qu'une surcharge ne
déplace pas un trait. Les exports emportent les surcharges, nom de fichier compris.

### Dans le code — les valeurs par défaut

Tout le texte visible — interface et planche — vit dans deux fichiers :

```
src/content/fr.ts
src/content/en.ts
```

Un texte à corriger = une ligne à éditer. Les chaînes qui contiennent `{quelquechose}`
sont des gabarits remplis par `fill()` : les noms entre accolades ne se traduisent pas.

`src/lib/plateText.ts` est le point unique où chaque chaîne réellement imprimée est
calculée. Les composants n'appellent jamais `fill()` : ils affichent `text.locus`.
Ajouter un texte à la planche, c'est ajouter une entrée à `PLATE_TEXT_FIELDS` — et le
typage exige alors son libellé dans `editor.fields` des deux langues.

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
│   ├── geometry.ts        tracés lissés, tiges, rubans, traits de burin
│   ├── axis.ts            ⚠ le moteur d'axes à nœuds — voir plus bas
│   ├── light.ts           source unique, densité du tramé, côté d'ombre
│   ├── leaf.ts            organes foliaires, raccourci, plis de presse
│   ├── genome.ts          ⚠ ordre de consommation figé
│   ├── ports.ts           cinq jeux de réglages du moteur d'axes
│   ├── roots.ts           racines fibreuses ou pivotantes, même moteur
│   ├── framing.ts         bounding box calculée APRÈS génération
│   ├── nomenclature.ts    binôme latin, n° de spécimen
│   └── buildPlate.ts      orchestration → Plate
├── content/       fr.ts · en.ts · types · détection de langue
├── components/    écran unique, panneau de contenu, composition de la planche A3
│   └── plate/
│       ├── leaders.ts     filets de renvoi, pointes orientées sur la tangente
│       ├── anchors.ts     ce que chaque flèche désigne, sans tirage
│       ├── HatchPatterns  les quatre tramés partagés
│       └── DetailPlates   les figures ① ② : feuille, coupe, graine, ombelle
└── lib/
    ├── plateText.ts     point unique de résolution du texte imprimé
    ├── useOverrides.ts  surcharges globales et liées au spécimen
    ├── exportPlate.ts   SVG et PNG, polices inlinées
    ├── fonts.ts
    └── types.ts
```

Une planche est décidée **en une passe**, avant l'affichage. L'animation ne fait que
révéler une planche déjà entièrement décidée ; aucun calcul pendant la croissance.

---

## Comment une plante pousse

Une plante ne se ramifie pas n'importe où : un nœud porte une feuille, et c'est à
**l'aisselle** de cette feuille qu'un bourgeon peut débourrer en rameau. C'est le même
événement. `axis.ts` construit donc un axe entre-nœud par entre-nœud :

```
roll += angle phyllotaxique       137,5° alterne · 90° décussé · 120° verticillé
poser la ou les feuilles du nœud, orientées par roll
évaluer le bourgeon axillaire
s'il débourre, lancer un axe fille DANS l'aisselle
```

L'axe est son propre continuateur : la **dominance apicale** n'est pas simulée, elle
tombe de la structure. Trois autres lois font le reste :

| Loi | Ce qu'elle empêche |
|---|---|
| **Modèle du tuyau** — `w_parent^2.4 = Σ w_fille^2.4`, plus un amincissement propre | qu'un tronc ne porte pas visuellement sa ramure, et qu'un axe peu ramifié reste un tuyau |
| **Tropismes** — axe fondateur orthotrope, filles plagiotropes avec mémoire de leur direction de départ | que chaque rameau se redresse à la verticale et que la plante devienne une colonne |
| **Gradient d'entre-nœuds** — court, long, court | la régularité de peigne |

Les cinq ports sont **cinq jeux de réglages du même moteur** : l'arbustif est basitone
(plusieurs troncs depuis la souche, donc un buisson et non un arbre miniature), le
grimpant plagiotrope à fort affaissement, la fougère un éventail de frondes à crosse.
Les racines pivotantes réutilisent le moteur en miroir.

Chaque feuille porte son `roll` et un **raccourci** dérivé de `cos(roll)` : une feuille
qui pointe vers l'observateur se voit courte et étroite. Une ligne de trigonométrie, et
le feuillage cesse d'être une planche d'autocollants.

---

## Comment une planche est gravée

Registre : **taille-douce sur acier, XIXe** — Köhler, *Medizinal-Pflanzen*.

**Le trait.** Un `stroke` SVG a une épaisseur constante et des bouts arrondis ; un burin
gonfle au milieu et sort en pointe. Les axes sont donc des contours fermés remplis
(`nib`, `nibVarying` dans `geometry.ts`), **un seul par axe** — découpés par entre-nœud
ils montraient une encoche à chaque jointure. Le tremblé va dans la médiane, jamais dans
le contour extrudé : nudger les deux flancs les fait diverger et hérisse le trait.
Sous 0,4 unité on reste en `stroke` — un ruban y serait invisible et deux fois plus lourd.

**Le volume.** Au-delà de 2,2 unités un axe n'est plus rempli mais **modelé** : contour
vide, hachures transversales du côté de l'ombre, bande de papier laissée nue du côté
éclairé. C'est ce reflet qui fait tourner un cylindre.

**Le tramé.** Une gravure n'a pas d'aplat. Mais une plante dense porte plus de mille
feuilles, et douze hachures dans chacune feraient exploser le fichier. D'où quatre
`<pattern>` définis une fois et référencés par toutes les feuilles
(`HatchPatterns.tsx`). `patternUnits="userSpaceOnUse"` : le motif hérite de la rotation
du groupe de la feuille, donc les hachures courent selon l'axe de l'organe — comme les
pose un graveur. **Mille feuilles partagent quatre motifs**, et le poids du pire cas est
passé de 2,4 Mo à 566 Ko.

**La lumière.** `light.ts` fixe une source unique en haut à gauche. Elle décide de la
densité du tramé de chaque organe et du côté d'où partent ses hachures. C'est la
cohérence de cet éclairage, plus que la finesse du trait, qui fait qu'un feuillage se
lit comme un volume.

**La presse.** Un limbe sur huit se replie et montre sa face inférieure — plus pâle,
arête marquée. Le rabat est la portion du contour située après le pli, réfléchie : c'est
exactement la forme qui manque.

**Le procédé.** Marque de cuvette en creux à 6,5 mm du bord — l'empreinte de la plaque
de cuivre, qu'aucune autre technique ne produit. Grain de papier en `feTurbulence`, et
un filtre d'encre volontairement discret : l'irrégularité doit venir du trait, pas d'un
tremblement d'ensemble.

### Les renvois

Chaque figure agrandie est reliée à l'endroit du sujet dont elle est tirée, et un
chiffre jumeau est posé sur la cible. Sans ce renvoi les figures flottent : rien ne
dit d'où elles viennent.

La pointe est bâtie **sur la tangente terminale** du filet (`leaders.ts`). L'ancienne
était un triangle écrit en dur : elle regardait toujours en bas à droite, quelle que
soit l'arrivée de la courbe. Le filet s'arrête à 1,8 unité de sa cible — une flèche
gravée effleure, elle ne pique pas le dessin — et il enfle vers la pointe comme tout
trait de burin. Les deux filets de figures bombent en sens contraire pour ne pas se
croiser quand leurs cibles sont dans l'ordre inverse de leurs encadrés.

`anchors.ts` choisit ce que chaque flèche désigne **sans consommer un seul tirage** :
tout se déduit de `Plate`. Une coupe de tige se prélève au collet, une graine au
sommet, la feuille agrandie est l'organe le mieux offert du sujet. La note de terrain
en désigne délibérément un autre — deux flèches convergentes se recouvrent et ne
désignent plus rien.

### Animer une forme remplie

`stroke-dashoffset` ne s'applique pas à un remplissage. La croissance passe donc par un
`<mask>` par vague, construit sur la **médiane** des traits — elle, animable — qui révèle
les rubans le long de leur propre longueur. Les masques n'existent que dans le rendu
animé : l'export passe `animated={false}` et n'en émet aucun, le fichier n'enfle pas.
Mesuré à 60 fps sur le cas dense (18 masques, 1212 chemins).

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

| Cas | SVG, polices comprises |
|---|---|
| graminée | ~240 Ko |
| rosette, grimpant | 290 – 300 Ko |
| fougère | 330 – 350 Ko |
| mot long, port arbustif dense | 530 – 580 Ko |

Les polices inlinées pèsent 185 Ko à elles seules. Le tramé par `<pattern>` a divisé le
pire cas par quatre : il ne reste que le cas le plus dense à dépasser légèrement la
cible de 500 Ko.

---

## Origine

Ce dépôt est né d'une ébauche Claude Design, conservée intacte dans `_legacy/`.
La logique générative a été transposée module par module, puis **vérifiée par diff
octet à octet** contre l'ébauche : sur treize mots couvrant les cinq ports et 3,6 Mo
de géométrie, branches, positions et tailles de feuilles, cadrage et nomenclature sont
identiques. `shots/` garde les captures de référence.
