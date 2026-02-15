import { api } from "./client"

interface Payment {
  id: string
  player: string
  tournament: string
  amount: number
  status: string
  registeredAt: string
  reference: string | null
}

export async function fetchPayments(params?: {
  status?: string
  clubId?: string
}) {
  return api.get<Payment[]>("/payments", params)
}

export async function confirmPayment(id: string, action: "confirm" | "reject", reference?: string) {
  return api.put(`/payments/${id}/confirm`, { action, reference })
}
