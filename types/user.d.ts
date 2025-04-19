export interface User {
  userId: string
  username: string
  email: string
  number: string
  password: string
  role: Role
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
