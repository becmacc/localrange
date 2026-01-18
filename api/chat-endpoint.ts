import { GoogleGenAI, Content, FunctionDeclaration, Type } from '@google/genai';
import { chatRateLimiter } from '../utils/rateLimiter';

// This will be populated from constants on each request
let PRODUCTS: any[] = [];

const getSystemInstruction = () => `
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

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { history, sessionId, products } = req.body;

    if (!history || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Set products for this request
    PRODUCTS = products || [];

    // Check rate limit
    const rateLimitResult = chatRateLimiter.check(sessionId);
    
    if (!rateLimitResult.allowed) {
      const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return res.status(429).json({ 
        error: `Rate limit exceeded. Please wait ${waitTime} seconds before sending more messages.` 
      });
    }

    // Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history,
      config: {
        systemInstruction: getSystemInstruction(),
        tools: [{ functionDeclarations: [addToCartTool] }],
      },
    });

    return res.status(200).json({
      text: response.text,
      functionCalls: response.functionCalls,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }
    });

  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
