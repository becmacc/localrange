
import { Category, Product, Slot, Unit } from './types';

export const PRODUCTS: Product[] = [
  // --- EGGS ---
  {
    id: 'p1',
    name: 'Free-Range Chicken Eggs',
    category: Category.EGGS,
    unit: Unit.DOZEN,
    price: 6.50,
    available: true,
    subscribable: true,
    featured: true,
    description: 'Laid this week, deep orange yolks.',
  },
  {
    id: 'p_duck',
    name: 'Duck Eggs',
    category: Category.EGGS,
    unit: Unit.DOZEN,
    price: 9.00,
    available: true,
    subscribable: false,
    description: 'Rich and creamy, perfect for baking.',
  },
  {
    id: 'p_guinea',
    name: 'Guinea Fowl Eggs',
    category: Category.EGGS,
    unit: Unit.DOZEN,
    price: 12.00,
    available: true,
    subscribable: false,
    seasonal: true,
    description: 'Seasonal limited harvest. Speckled shells.',
  },

  // --- DAIRY ---
  {
    id: 'p2',
    name: 'Goat Raw Milk',
    category: Category.DAIRY,
    unit: Unit.LITER,
    price: 4.50,
    available: true,
    subscribable: true,
    featured: true,
    description: 'Fresh goat milk, unpasteurized.',
  },
  {
    id: 'p3',
    name: 'Goat Labneh',
    category: Category.DAIRY,
    unit: Unit.KG,
    price: 12.00,
    available: true,
    subscribable: true,
    description: 'Thick, creamy, traditional strained yogurt.',
  },
  {
    id: 'p_goat_cheese',
    name: 'Goat Cheese',
    category: Category.DAIRY,
    unit: Unit.PIECE,
    price: 8.50,
    available: true,
    subscribable: false,
    description: 'Fresh soft goat cheese log.',
  },

  // --- HERBS ---
  {
    id: 'p_zaatar',
    name: 'Wild Zaatar',
    category: Category.HERBS,
    unit: Unit.PIECE,
    price: 5.00,
    available: true,
    subscribable: false,
    seasonal: true,
    description: 'Seasonal wild thyme bundles.',
  },
  {
    id: 'p_herbs',
    name: 'Seasonal Wild Herbs',
    category: Category.HERBS,
    unit: Unit.PIECE,
    price: 4.00,
    available: true,
    subscribable: false,
    seasonal: true,
    description: 'Freshly foraged seasonal mix.',
  },

  // --- PRODUCE ---
  {
    id: 'p4',
    name: 'Seasonal Veg Box',
    category: Category.PRODUCE,
    unit: Unit.BOX,
    price: 25.00,
    available: true,
    subscribable: true,
    featured: true,
    description: 'Mix of kale, carrots, and potatoes.',
  },

  // --- PANTRY ---
  {
    id: 'p_olive_oil',
    name: 'Olive Oil',
    category: Category.PANTRY,
    unit: Unit.LITER,
    price: 22.00,
    available: true,
    subscribable: false,
    description: 'Cold pressed extra virgin olive oil.',
  },
  {
    id: 'p5',
    name: 'Sourdough Bread',
    category: Category.PANTRY,
    unit: Unit.PIECE,
    price: 7.00,
    available: true,
    subscribable: false,
    description: 'Baked fresh every Wednesday.',
  },
  {
    id: 'p6',
    name: 'Honey',
    category: Category.PANTRY,
    unit: Unit.KG,
    price: 15.00,
    available: true,
    subscribable: false,
    featured: true,
    description: 'Wildflower honey from our hives.',
  },
];

/**
 * Generates slots for the next 21 days.
 * Delivery: Thursday
 * Pickup: Friday
 */
const generateDynamicSlots = (daysAhead: number = 21): Slot[] => {
  const slots: Slot[] = [];
  const today = new Date();
  
  for (let i = 1; i <= daysAhead; i++) {
    const current = new Date(today);
    current.setDate(today.getDate() + i);
    
    const day = current.getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday
    
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });

    if (day === 4) { // Thursday -> Delivery
      slots.push({
        id: `slot-del-${dateStr}`,
        date: dateStr,
        dayName,
        type: 'Delivery',
        label: `${dayName} PM Delivery`,
        maxCapacity: 20,
      });
    } else if (day === 5) { // Friday -> Pickup
      slots.push({
        id: `slot-pick-${dateStr}`,
        date: dateStr,
        dayName,
        type: 'Pickup',
        label: `${dayName} AM Pickup`,
        maxCapacity: 40,
      });
    }
  }
  return slots;
};

export const SLOTS: Slot[] = generateDynamicSlots(21);
