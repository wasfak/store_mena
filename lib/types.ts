// Client-safe shapes for API responses (no server imports).
import type { BookingStatus } from "@/lib/models/booking";

export type { BookingStatus };

export interface Viewer {
  clerkId: string | null;
  isAdmin: boolean;
  company: { id: string; name: string; phone?: string; active: boolean } | null;
}

export interface SlotBookingDTO {
  id: string;
  companyId: string;
  companyName: string;
  phone?: string;
  status: BookingStatus;
  note?: string;
}

export interface DaySlotDTO {
  start: number;
  label: string;
  bookings: SlotBookingDTO[];
  full: boolean;
}

export interface DayViewDTO {
  date: string;
  isWorkingDay: boolean;
  isAdmin: boolean;
  settings: {
    startMinutes: number;
    endMinutes: number;
    slotMinutes: number;
    capacityPerSlot: number;
    workingDays: number[];
  };
  slots: DaySlotDTO[];
  viewerCompanyId?: string;
  viewerBookedToday?: boolean;
  conflictBlocked?: boolean;
  conflictReason?: string;
}

export interface CompanyDTO {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
  hasOwner?: boolean;
}

export interface MyBookingDTO {
  id: string;
  date: string;
  slotStart: number;
  status: BookingStatus;
  note?: string;
}

export interface ConflictDTO {
  id: string;
  companyA: string;
  companyB: string;
  nameA: string;
  nameB: string;
}

export interface SettingsDTO {
  workingDays: number[];
  startMinutes: number;
  endMinutes: number;
  slotMinutes: number;
  capacityPerSlot: number;
}
