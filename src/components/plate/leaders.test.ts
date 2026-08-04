import { describe, expect, test } from 'vitest'
import { buildLeader } from './leaders'
import type { Point } from '../../lib/types'

/**
 * Les filets de renvoi.
 *
 * L'ancienne pointe était un triangle écrit en dur : elle regardait toujours en
 * bas à droite, quelle que soit l'arrivée de la courbe. C'est exactement ce que
 * ces tests interdisent de revoir.
 */

/** Trente couples départ/cible, sur tout le tour. */
const CASES: { from: Point; to: Point }[] = Array.from({ length: 30 }, (_, i) => {
  const a = (i / 30) * Math.PI * 2
  const r = 25 + (i % 5) * 18
  return { from: [148, 210], to: [148 + Math.cos(a) * r, 210 + Math.sin(a) * r] }
})

/** Les trois sommets du triangle de pointe, lus dans son `d`. */
function headPoints(head: string): Point[] {
  const nums = head.match(/-?\d+(\.\d+)?/g) ?? []
  const pts: Point[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([+nums[i]!, +nums[i + 1]!])
  return pts
}

describe('pointe', () => {
  test.each(CASES)('orientée sur la tangente d’arrivée · %#', ({ from, to }) => {
    const { head, direction, shaft } = buildLeader({ from, to })
    expect(shaft).not.toBe('')

    const [apex, left, right] = headPoints(head)
    expect(apex && left && right).toBeTruthy()

    /* Axe de la pointe : du milieu de sa base vers son sommet. */
    const baseMid: Point = [(left![0] + right![0]) / 2, (left![1] + right![1]) / 2]
    const ax = apex![0] - baseMid[0]
    const ay = apex![1] - baseMid[1]
    const am = Math.hypot(ax, ay)
    expect(am).toBeGreaterThan(0.5)

    const dot = (ax / am) * direction[0] + (ay / am) * direction[1]
    /* Colinéaires à un degré près. Un triangle figé donnerait n'importe quoi. */
    expect(Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI)).toBeLessThan(1)
  })

  test.each(CASES)('s’arrête avant la cible sans la piquer · %#', ({ from, to }) => {
    const gap = 1.8
    const { tip } = buildLeader({ from, to, gap })
    const left = Math.hypot(to[0] - tip[0], to[1] - tip[1])
    expect(left).toBeCloseTo(gap, 5)
  })

  test('la pointe est mince — une flèche gravée n’est pas un fanion', () => {
    const { head } = buildLeader({ from: [0, 0], to: [60, 0] })
    const [apex, left, right] = headPoints(head)
    const width = Math.hypot(left![0] - right![0], left![1] - right![1])
    const length = Math.hypot(apex![0] - (left![0] + right![0]) / 2, apex![1] - (left![1] + right![1]) / 2)
    expect(length / width).toBeGreaterThan(1.5)
  })
})

describe('dégénérescences', () => {
  test('départ confondu avec la cible : rien, et surtout pas de NaN', () => {
    const { shaft, head } = buildLeader({ from: [50, 50], to: [50, 50] })
    expect(shaft).toBe('')
    expect(head).toBe('')
  })

  test('cible plus proche que la pointe n’est longue : le renvoi disparaît', () => {
    expect(buildLeader({ from: [0, 0], to: [3, 0] }).shaft).toBe('')
  })

  test.each(CASES)('aucun NaN dans les chemins produits · %#', ({ from, to }) => {
    const { shaft, head } = buildLeader({ from, to })
    expect(shaft).not.toMatch(/NaN|Infinity/)
    expect(head).not.toMatch(/NaN|Infinity/)
  })

  test('une courbure nulle reste valide', () => {
    const { shaft, head } = buildLeader({ from: [0, 0], to: [80, 40], bow: 0 })
    expect(shaft).not.toMatch(/NaN/)
    expect(head).not.toMatch(/NaN/)
  })
})
