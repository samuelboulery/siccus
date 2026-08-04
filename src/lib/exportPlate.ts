import { renderToStaticMarkup } from 'react-dom/server'
import { PlateSvg } from '../components/plate/PlateSvg'
import { SHEET } from '../components/plate/layout'
import type { PlateText } from './plateText'
import type { Plate, Variant } from './types'

import cormorantNormal from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2?url'
import cormorantItalic from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2?url'
import loraNormal from '@fontsource/lora/files/lora-latin-400-normal.woff2?url'
import loraItalic from '@fontsource/lora/files/lora-latin-400-italic.woff2?url'
import petitFormalScript from '@fontsource/petit-formal-script/files/petit-formal-script-latin-400-normal.woff2?url'
import cedarvilleCursive from '@fontsource/cedarville-cursive/files/cedarville-cursive-latin-400-normal.woff2?url'

/** Facteur de sur-échantillonnage du PNG. Un rendu à la taille CSS est inutilisable à l'impression. */
const PNG_SCALE = 4

type FontFace = { family: string; style: 'normal' | 'italic'; url: string }

const FONT_FACES: readonly FontFace[] = [
  { family: 'Cormorant Garamond', style: 'normal', url: cormorantNormal },
  { family: 'Cormorant Garamond', style: 'italic', url: cormorantItalic },
  { family: 'Lora', style: 'normal', url: loraNormal },
  { family: 'Lora', style: 'italic', url: loraItalic },
  { family: 'Petit Formal Script', style: 'normal', url: petitFormalScript },
  { family: 'Cedarville Cursive', style: 'normal', url: cedarvilleCursive },
]

/** Les polices ne changent jamais : on ne les encode qu'une fois par session. */
let fontCssPromise: Promise<string> | null = null

async function toBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Police introuvable : ${url} (${response.status})`)
  const bytes = new Uint8Array(await response.arrayBuffer())

  /* `btoa` ne prend que du binaire en chaîne : on convertit par tranches pour ne
     pas dépasser la limite d'arguments de `String.fromCharCode` sur 100 Ko. */
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * Construit les `@font-face` en base64 à injecter dans le fichier exporté.
 *
 * Sans eux le SVG s'ouvre en serif système chez l'imprimeur, et le PNG — qui
 * passe par une `Image` détachée du document — n'a aucun moyen de charger quoi
 * que ce soit depuis le réseau.
 */
async function embeddedFontCss(): Promise<string> {
  fontCssPromise ??= Promise.all(
    FONT_FACES.map(async (face) => {
      const data = await toBase64(face.url)
      return [
        '@font-face{',
        `font-family:'${face.family}';`,
        `font-style:${face.style};`,
        'font-weight:400;',
        'font-display:block;',
        `src:url(data:font/woff2;base64,${data}) format('woff2');`,
        '}',
      ].join('')
    }),
  ).then((faces) => faces.join(''))

  return fontCssPromise
}

export type ExportInput = {
  plate: Plate
  /** Texte résolu : le fichier exporté porte les surcharges de l'écran. */
  text: PlateText
  variant: Variant
}

/**
 * Sérialise la planche depuis un rendu statique dédié, et non en clonant le SVG
 * affiché.
 *
 * Cloner le DOM vivant obligeait à effacer à la main les animations et les
 * opacités, et exporter avant la fin de la croissance produisait une planche
 * sans texture. Ici l'export ne dépend d'aucun état d'animation : `animated`
 * est faux, `textured` est vrai, toujours.
 */
export async function plateToSvgString({ plate, text, variant }: ExportInput): Promise<string> {
  const fontCss = await embeddedFontCss()
  const markup = renderToStaticMarkup(
    PlateSvg({
      plate,
      text,
      variant,
      animated: false,
      textured: true,
      width: `${SHEET.w}mm`,
      height: `${SHEET.h}mm`,
      fontCss,
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`
}

/**
 * `siccus-lycospina-contorta-4471.svg`
 *
 * Le nom suit le bin\u00f4me AFFICH\u00c9 : renommer le sp\u00e9cimen dans le panneau renomme
 * le fichier. Un bin\u00f4me vid\u00e9 retombe sur celui du tirage, jamais sur du vide.
 */
export function plateFileName(
  plate: Plate,
  text: PlateText,
  extension: 'svg' | 'png',
): string {
  const slugify = (value: string): string =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const slug = slugify(text.latin) || slugify(plate.latin) || 'specimen'
  return `siccus-${slug}-${plate.specimen}.${extension}`
}

function download(url: string, name: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function exportSvg(input: ExportInput): Promise<void> {
  const svg = await plateToSvgString(input)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    download(url, plateFileName(input.plate, input.text, 'svg'))
  } finally {
    /* Révocation différée : Safari lit le blob après le clic. */
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }
}

export async function exportPng(input: ExportInput): Promise<void> {
  const svg = await plateToSvgString(input)
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))

  try {
    const image = await loadImage(svgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = SHEET.w * PNG_SCALE
    canvas.height = SHEET.h * PNG_SCALE

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Contexte 2D indisponible.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Encodage PNG impossible.')

    const pngUrl = URL.createObjectURL(blob)
    download(pngUrl, plateFileName(input.plate, input.text, 'png'))
    setTimeout(() => URL.revokeObjectURL(pngUrl), 4000)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Le SVG n’a pas pu être rasterisé.'))
    image.src = url
  })
}
