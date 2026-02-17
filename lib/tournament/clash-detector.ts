import { combineDateAndTime, slotsAdjacent, slotsOverlap } from "./time"

export type SlotLike = {
  date: Date
  startTime: string
  endTime: string
}

export type AssignedMatchLike = {
  matchId: string
  slot: SlotLike
}

export type ClashReason = "OVERLAP" | "MIN_REST"

export function slotToRange(slot: SlotLike): { start: Date; end: Date } {
  const start = combineDateAndTime(slot.date, slot.startTime)
  const end = combineDateAndTime(slot.date, slot.endTime)
  return { start, end }
}

export function checkSlotClash(
  assigned: AssignedMatchLike[],
  proposedSlot: SlotLike
): { hasClash: boolean; reason?: ClashReason; conflicts: AssignedMatchLike[] } {
  const proposed = slotToRange(proposedSlot)
  const conflicts: AssignedMatchLike[] = []

  for (const m of assigned) {
    const existing = slotToRange(m.slot)
    if (slotsOverlap(existing.start, existing.end, proposed.start, proposed.end)) {
      conflicts.push(m)
    }
  }
  if (conflicts.length > 0) return { hasClash: true, reason: "OVERLAP", conflicts }

  // Rest rule: avoid consecutive slots.
  for (const m of assigned) {
    const existing = slotToRange(m.slot)
    if (slotsAdjacent(existing.start, existing.end, proposed.start, proposed.end)) {
      return { hasClash: true, reason: "MIN_REST", conflicts: [m] }
    }
  }

  return { hasClash: false, conflicts: [] }
}

