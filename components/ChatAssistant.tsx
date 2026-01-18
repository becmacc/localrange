
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { handleChatRequest } from '../api/chat';
import { PRODUCTS } from '../constants';
import { Frequency, Product } from '../types';

// Use serverless function in production, local API in development
const callChatAPI = async (history: any[], sessionId: string) => {
  const isDevelopment = import.meta.env?.DEV ?? process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Local development - use client-side API
    return await handleChatRequest(history, sessionId);
  } else {
    // Production - use serverless function
    const response = await fetch('/api/chat-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, sessionId, products: PRODUCTS })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response');
    }
    
    return response.json();
  }
};

interface ChatAssistantProps {
  onAddToCart: (productId: string, qty: number, freq: Frequency) => void;
  hasStickyBar?: boolean;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onAddToCart, hasStickyBar = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm Rooty. What's fresh today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  
  // Generate a unique session ID for rate limiting
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));
  
  // Local history in the format expected by the "API"
  const historyRef = useRef<any[]>([
    { role: 'model', parts: [{ text: "Hi! I'm Rooty. What's fresh today?" }] }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomPositionClass = hasStickyBar ? 'bottom-40' : 'bottom-24';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    // Update local UI
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    
    // Update local history for the model
    historyRef.current.push({ role: 'user', parts: [{ text: userText }] });

    try {
      // Call the serverless endpoint with session ID
      let response = await callChatAPI(historyRef.current, sessionIdRef.current);
      
      // Update remaining requests from rate limit info
      if (response.rateLimitInfo) {
        setRemainingRequests(response.rateLimitInfo.remaining);
      }
      
      // Process result (might include tool calls)
      await processResponse(response);
      
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "Sorry, I had trouble connecting to the farm.";
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const processResponse = async (response: any) => {
    const { text, functionCalls } = response;

    // Add model's base turn to history
    const modelParts: any[] = [];
    if (text) modelParts.push({ text });
    if (functionCalls) {
      functionCalls.forEach((call: any) => {
        modelParts.push({ functionCall: call });
      });
    }

    historyRef.current.push({ role: 'model', parts: modelParts });

    if (functionCalls && functionCalls.length > 0) {
      const functionResponseParts: any[] = [];
      
      for (const call of functionCalls) {
        if (call.name === 'addToCart') {
          const { productId, quantity = 1, isSubscription, frequency } = call.args;
          const product = PRODUCTS.find(p => p.id === productId);
          
          let responseResult;
          if (product) {
            const freq = isSubscription 
              ? (frequency === 'Bi-weekly' ? Frequency.BI_WEEKLY : Frequency.WEEKLY)
              : Frequency.ONE_TIME;
              
            onAddToCart(productId, Number(quantity), freq);
            responseResult = { result: `Success: Added ${quantity} ${product.name} to cart.` };
          } else {
            responseResult = { result: `Error: Product ID ${productId} not found.` };
          }

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: responseResult,
              id: call.id
            }
          });
        }
      }

      // If we had tool calls, we must send their results back to get the final text response
      if (functionResponseParts.length > 0) {
        historyRef.current.push({ role: 'user', parts: functionResponseParts });
        const finalResponse = await callChatAPI(historyRef.current, sessionIdRef.current);
        
        // Update rate limit info
        if (finalResponse.rateLimitInfo) {
          setRemainingRequests(finalResponse.rateLimitInfo.remaining);
        }
        
        // Add final response to history and UI
        historyRef.current.push({ role: 'model', parts: [{ text: finalResponse.text || "Cart updated!" }] });
        setMessages(prev => [...prev, { role: 'model', content: finalResponse.text || "Cart updated!" }]);
      }
    } else if (text) {
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${bottomPositionClass} right-4 z-50 bg-farm-600 text-white p-4 rounded-full shadow-lg hover:bg-farm-700 transition-all duration-300`}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className={`fixed ${bottomPositionClass} right-4 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden max-h-[500px] transition-all duration-300`}>
          <div className="bg-farm-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-medium">Farm Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-farm-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-farm-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                  <Loader2 className="animate-spin text-farm-600" size={16} />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            {remainingRequests !== null && remainingRequests < 5 && (
              <div className="text-xs text-orange-600 mb-2 px-1">
                {remainingRequests} messages remaining this minute
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about eggs, milk..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-farm-600 text-white p-2 rounded-full hover:bg-farm-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
