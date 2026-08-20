import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pkgPath = fileURLToPath(new URL('../../package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

describe('package.json — engines', () => {
  it('déclare le plancher Node exigé par pnpm 11.21.0 (>=22.13)', () => {
    expect(pkg.engines?.node).toBe('>=22.13')
  })
})
