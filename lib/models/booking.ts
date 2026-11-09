import mongoose, { Schema, model, models, Types } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

// A company's reservation of one slot on one day.
// `date` is the warehouse-local calendar day as "YYYY-MM-DD".
// `slotStart` is minutes-from-midnight of the slot's start.
export interface IBooking {
  companyId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  slotStart: number; // minutes from midnight (0 for the simple day-only flow)
  slotsCount: number; // number of consecutive slots this booking occupies
  status: BookingStatus;
  note?: string;
  // Who is coming (captured on the public, no-login booking form).
  personName?: string;
  personPhone?: string;
  load?: string; // نوع السيارة — picked from a fixed list (تريله / 1/2 نقل / 1/4 نقل / فان / اخري).
  brand?: string; // الشركات المراد تسليمها — free-text, typed by the person booking.
  boxes?: number; // عدد الصناديق — how many boxes in the delivery.
  // Set when an admin moved the booking to a different date/slot than requested.
  rescheduledByAdmin?: boolean;
  createdByClerkId?: string; // set only when an admin/signed-in user booked
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
    slotStart: { type: Number, default: 0 },
    slotsCount: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    note: { type: String, trim: true },
    personName: { type: String, trim: true },
    personPhone: { type: String, trim: true },
    load: { type: String, trim: true },
    brand: { type: String, trim: true },
    boxes: { type: Number, min: 0 },
    rescheduledByAdmin: { type: Boolean, default: false },
    createdByClerkId: { type: String },
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
