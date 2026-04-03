export type Category =
  | "dairy"
  | "meat"
  | "vegetable"
  | "fruit"
  | "beverage"
  | "condiment"
  | "snack"
  | "cooked"
  | "frozen"
  | "other";

export type StorageType = "fridge" | "freezer" | "pantry";

export type ExpiryStatus = "danger" | "warning" | "fresh";

export interface FoodItem {
  id: string;
  name: string;
  category: Category;
  expiryDate: string; // ISO date string
  storageType: StorageType;
  price?: number;
  addedDate: string; // ISO date string
  consumed?: boolean;
  wasted?: boolean;
}

export interface SavingsRecord {
  month: string;
  savedAmount: number;
  consumedItems: number;
  wastedItems: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  dairy: "유제품",
  meat: "육류/수산",
  vegetable: "채소",
  fruit: "과일",
  beverage: "음료",
  condiment: "소스/양념",
  snack: "간식",
  cooked: "조리식품",
  frozen: "냉동식품",
  other: "기타",
};

export const STORAGE_LABELS: Record<StorageType, string> = {
  fridge: "냉장",
  freezer: "냉동",
  pantry: "실온",
};

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 2) return "danger";
  if (days <= 5) return "warning";
  return "fresh";
}

export function getFreshnessPercent(
  addedDate: string,
  expiryDate: string
): number {
  const added = new Date(addedDate).getTime();
  const expiry = new Date(expiryDate).getTime();
  const now = Date.now();
  const totalDuration = expiry - added;
  if (totalDuration <= 0) return 0;
  const elapsed = now - added;
  const remaining = Math.max(0, 1 - elapsed / totalDuration);
  return Math.round(remaining * 100);
}
