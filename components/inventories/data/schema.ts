import { z } from 'zod'

export const inventorySchema = z.object({
  inventoryId: z.string(),
  name: z.string(),
  quantity: z.coerce.number(),
  condition: z.string(),
  code: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
})

export type Inventory = z.infer<typeof inventorySchema>

export const condition = [
  'Available',
  'Out of Stock',
  'Reserved',
  'Damaged',
  'Discontinued',
]
