import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importRows } from '../importService'
import type { ParsedRow } from '../importService'

const hoisted = vi.hoisted(() => {
  const where = vi.fn()
  const users = {
    where,
    toArray: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
  }
  return { users, where }
})

vi.mock('@/services/db/database', () => ({ db: { users: hoisted.users } }))

beforeEach(() => {
  hoisted.where.mockReset()
  hoisted.where.mockReturnValue({
    equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
  })
  hoisted.users.add.mockReset().mockResolvedValue('new-id')
  hoisted.users.put.mockReset().mockResolvedValue(undefined)
  hoisted.users.toArray.mockReset().mockResolvedValue([])
})

describe('importRows — users', () => {
  it('normalizes isActive to 0|1 (login queries where("isActive").equals(1))', async () => {
    const rows: ParsedRow[] = [
      {
        index: 2,
        data: {
          Email: 'ana@corp.com',
          Nombre: 'Ana',
          Rol: 'user',
          'Activo (true/false)': 'false',
        },
        errors: [],
      },
      {
        index: 3,
        data: {
          Email: 'bob@corp.com',
          Nombre: 'Bob',
          Rol: 'user',
          'Activo (true/false)': 'true',
        },
        errors: [],
      },
    ]

    const result = await importRows('users', rows)

    expect(result.successRows).toBe(2)
    expect(result.errorRows).toBe(0)
    const first = hoisted.users.add.mock.calls[0][0] as { isActive: unknown }
    const second = hoisted.users.add.mock.calls[1][0] as { isActive: unknown }
    expect(first.isActive).toBe(0)
    expect(second.isActive).toBe(1)
  })

  it('defaults isActive to 1 when the column is omitted', async () => {
    const rows: ParsedRow[] = [
      {
        index: 2,
        data: { Email: 'car@corp.com', Nombre: 'Carlos', Rol: 'user' },
        errors: [],
      },
    ]

    await importRows('users', rows)

    const entity = hoisted.users.add.mock.calls[0][0] as { isActive: unknown }
    expect(entity.isActive).toBe(1)
  })
})
