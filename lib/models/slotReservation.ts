import mongoose, { Schema, model, models, Types } from "mongoose";

// One row per occupied (slot, seat) on a day. The unique index is what actually
// prevents double-booking under concurrency: two racing bookings that target the
// same slot cannot both insert the same seat — the DB rejects the second.
// A multi-slot booking inserts one row per slot in its span.
export interface ISlotReservation {
  date: string; // YYYY-MM-DD
  slotStart: number; // minutes from midnight
  seat: number; // 0 .. capacityPerSlot-1
  bookingId: Types.ObjectId;
}

const SlotReservationSchema = new Schema<ISlotReservation>(
  {
    date: { type: String, required: true },
    slotStart: { type: Number, required: true },
    seat: { type: Number, required: true },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

SlotReservationSchema.index({ date: 1, slotStart: 1, seat: 1 }, { unique: true });

export const SlotReservation =
  (models.SlotReservation as mongoose.Model<ISlotReservation>) ||
  model<ISlotReservation>("SlotReservation", SlotReservationSchema);
