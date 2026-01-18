import { GoogleGenAI, Content, FunctionDeclaration, Type } from '@google/genai';
import { PRODUCTS } from '../constants';
import { chatRateLimiter } from '../utils/rateLimiter';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are 'Rooty', a strict shopping assistant for "Local Roots Farm".
Your role is to help users find products and build their cart.

RULES:
1. DATA-ONLY: Use ONLY the product catalog provided below.
2. NO GUESSING: Never invent stock levels, prices, or guarantees.
3. AVAILABILITY & DELIVERY: If asked about available delivery days, pickup times, or specific date availability, you MUST say: "Available delivery/pickup days are shown at checkout when you pick a date/slot." Do not state fixed days (like Thursday/Friday) even if you know them from the catalog, as real-time capacity varies.
4. NO CONFIRMATION: Never say an order is confirmed or placed. Always state: "Orders are pending manual confirmation on WhatsApp."
5. SUBSCRIPTIONS: Explain that subscriptions help farm planning, but do NOT promise they guarantee stock availability.
6. ACTIONS: Use 'addToCart' tool for any buying request. Guide the user to the Cart tab for final checkout and WhatsApp handoff.

PRODUCT CATALOG:
${JSON.stringify(PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  price: p.price,
  unit: p.unit,
  category: p.category,
  subscribable: p.subscribable,
  seasonal: !!p.seasonal
})))}
`;

const addToCartTool: FunctionDeclaration = {
  name: 'addToCart',
  description: 'Add a product to the user\'s shopping cart',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: { type: Type.STRING, description: 'Product ID (e.g. p1)' },
      quantity: { type: Type.NUMBER, description: 'Amount to add' },
      isSubscription: { type: Type.BOOLEAN, description: 'True for subscription' },
      frequency: { type: Type.STRING, description: 'Weekly or Bi-weekly' }
    },
    required: ['productId'],
  },
};

export const handleChatRequest = async (history: Content[], sessionId: string) => {
  // Check rate limit
  const rateLimitResult = chatRateLimiter.check(sessionId);
  
  if (!rateLimitResult.allowed) {
    const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before sending more messages.`);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [addToCartTool] }],
    },
  });
  
  return { 
    text: response.text, 
    functionCalls: response.functionCalls,
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    }
  };
};