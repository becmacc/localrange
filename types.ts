
export enum Unit {
  DOZEN = 'dozen',
  LITER = 'L',
  KG = 'kg',
  PIECE = 'pc',
  BOX = 'box'
}

export enum Category {
  EGGS = 'Eggs',
  DAIRY = 'Dairy',
  PRODUCE = 'Produce',
  HERBS = 'Herbs',
  PANTRY = 'Pantry'
}

export enum Frequency {
  ONE_TIME = 'One-time',
  WEEKLY = 'Weekly',
  BI_WEEKLY = 'Bi-weekly'
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: Unit;
  price: number;
  image?: string;
  description?: string;
  available: boolean;
  subscribable: boolean;
  seasonal?: boolean;
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  frequency: Frequency;
  startDate?: string;
}

export interface Slot {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string; // e.g., "Thursday"
  type: 'Delivery' | 'Pickup';
  label: string;
  maxCapacity: number;
}

export interface UserDetails {
  name: string;
  address: string;
  notes: string;
}

export interface Order {
  id: string;
  createdAt: string;
  date: string;
  status: 'New' | 'Confirmed' | 'Packed' | 'Completed' | 'Cancelled';
  total: number;
  customerName: string;
  address: string;
  notes: string;
  items: CartItem[];
  slotId: string;
  fulfillmentType: 'Delivery' | 'Pickup';
}
