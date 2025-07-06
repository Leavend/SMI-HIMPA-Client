import { z } from 'zod'
import { Role } from '../../../types/role'

export const userSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string().email(),
  number: z.string(),
  password: z.string(),
  role: z.nativeEnum(Role),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type User = z.infer<typeof userSchema>

export const userRoles = Object.values(Role)

export const roles = userRoles.map((role) => {
  return {
    label: role === 'ADMIN' ? 'Admin' : 'Peminjam',
    value: role,
  }
})
