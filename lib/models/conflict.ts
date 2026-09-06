import mongoose, { Schema, model, models, Types } from "mongoose";

// A pair of companies that must NOT be scheduled on the same day.
// Stored normalized: companyA is always the lexicographically-smaller id, so a
// pair is unique regardless of the order it was entered in.
export interface IConflict {
  companyA: Types.ObjectId;
  companyB: Types.ObjectId;
}

const ConflictSchema = new Schema<IConflict>(
  {
    companyA: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    companyB: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

// One rule per unordered pair.
ConflictSchema.index({ companyA: 1, companyB: 1 }, { unique: true });

export const Conflict =
  (models.Conflict as mongoose.Model<IConflict>) ||
  model<IConflict>("Conflict", ConflictSchema);

// Normalize an unordered pair so companyA <= companyB by string id.
export function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
