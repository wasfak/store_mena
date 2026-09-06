import mongoose, { Schema, model, models, Types } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

// A company's reservation of one slot on one day.
// `date` is the warehouse-local calendar day as "YYYY-MM-DD".
// `slotStart` is minutes-from-midnight of the slot's start.
export interface IBooking {
  companyId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  slotStart: number; // minutes from midnight
  status: BookingStatus;
  note?: string;
  createdByClerkId: string;
  createdByAdmin: boolean;
}

const BookingSchema = new Schema<IBooking>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true },
    slotStart: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    note: { type: String, trim: true },
    createdByClerkId: { type: String, required: true },
    createdByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

BookingSchema.index({ date: 1, slotStart: 1 });

export const Booking =
  (models.Booking as mongoose.Model<IBooking>) ||
  model<IBooking>("Booking", BookingSchema);

// Statuses that actually hold a slot (block it for others / count for conflicts).
export const ACTIVE_STATUSES: BookingStatus[] = ["pending", "confirmed"];
