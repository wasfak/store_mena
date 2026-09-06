import mongoose, { Schema, model, models } from "mongoose";

// A supplier company that delivers goods to the warehouse.
// A company profile is owned by a Clerk user (the person who books for it).
// Admins can also create companies without an owner (ownerClerkId empty).
export interface ICompany {
  name: string;
  phone?: string;
  ownerClerkId?: string; // Clerk user id that owns/books for this company
  active: boolean;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    ownerClerkId: { type: String, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Company =
  (models.Company as mongoose.Model<ICompany>) ||
  model<ICompany>("Company", CompanySchema);
