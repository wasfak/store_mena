import type { Types } from "mongoose";
import { SlotReservation } from "@/lib/models/slotReservation";

// Atomically claim every slot in `slotStarts` for `bookingId`, using the unique
// {date, slotStart, seat} index as the lock. For each slot it grabs the lowest
// free seat (0..capacity-1). If any slot is full, it rolls back everything it
// claimed for this booking and returns false — so the caller can reject.
export async function reserveSpan(
  date: string,
  slotStarts: number[],
  capacity: number,
  bookingId: Types.ObjectId | string,
): Promise<boolean> {
  const cap = Math.max(1, capacity);
  for (const slotStart of slotStarts) {
    let claimed = false;
    for (let seat = 0; seat < cap; seat++) {
      try {
        await SlotReservation.create({ date, slotStart, seat, bookingId });
        claimed = true;
        break;
      } catch (e) {
        // Duplicate key => this seat is taken; try the next one.
        if ((e as { code?: number })?.code === 11000) continue;
        // Unexpected error: roll back and rethrow.
        await SlotReservation.deleteMany({ bookingId });
        throw e;
      }
    }
    if (!claimed) {
      await SlotReservation.deleteMany({ bookingId });
      return false; // this slot is full
    }
  }
  return true;
}

// Release all slot claims held by a booking (on cancel/reject/reschedule).
export async function releaseBooking(
  bookingId: Types.ObjectId | string,
): Promise<void> {
  await SlotReservation.deleteMany({ bookingId });
}
