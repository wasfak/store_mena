import mongoose, { Schema, model, models } from "mongoose";

// Singleton warehouse configuration. There is only ever one document
// (key: "default"). Admins edit it from /admin/settings.
export interface ISettings {
  key: string;
  // Weekdays the warehouse operates. 0 = Sunday ... 6 = Saturday.
  workingDays: number[];
  // Minutes from midnight. e.g. 09:00 => 540, 15:00 => 900.
  startMinutes: number;
  endMinutes: number;
  // Length of a single slot in minutes (e.g. 60 => one-hour slots).
  slotMinutes: number;
  // How many companies may share one slot (usually 1 = exclusive dock).
  capacityPerSlot: number;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    workingDays: { type: [Number], default: [0, 1, 2, 3, 4] }, // Sun–Thu (Egypt work week)
    startMinutes: { type: Number, default: 9 * 60 },
    endMinutes: { type: Number, default: 15 * 60 },
    slotMinutes: { type: Number, default: 60 },
    capacityPerSlot: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const Settings =
  (models.Settings as mongoose.Model<ISettings>) ||
  model<ISettings>("Settings", SettingsSchema);

export const DEFAULT_SETTINGS: Omit<ISettings, "key"> = {
  workingDays: [0, 1, 2, 3, 4],
  startMinutes: 9 * 60,
  endMinutes: 15 * 60,
  slotMinutes: 60,
  capacityPerSlot: 1,
};
