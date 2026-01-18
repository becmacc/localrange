import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingBasket, Home, Plus, Minus, Calendar, Trash2, ArrowRight, CheckCircle2, X, MessageCircle, Image as ImageIcon, Leaf, Egg, Droplets, Utensils, AlertCircle, Star } from 'lucide-react';
import { PRODUCTS as INITIAL_PRODUCTS, SLOTS } from './constants';
import { Category, Frequency, Product, CartItem, Slot, UserDetails, Order } from './types';
import ChatAssistant from './components/ChatAssistant';
import AdminPanel from './components/AdminPanel';

// --- Helpers ---

const formatDateDisplay = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getUniqueSlotDates = () => {
  const dates = new Set(SLOTS.map(s => s.date));
  return Array.from(dates).sort();
};

const getPlaceholderIcon = (category: string) => {
  switch (category) {
    case Category.EGGS: return <Egg className="text-orange-400" size={32} />;
    case Category.DAIRY: return <Droplets className="text-blue-400" size={32} />;
    case Category.PRODUCE: return <Leaf className="text-green-500" size={32} />;
    case Category.HERBS: return <Leaf className="text-emerald-600" size={32} />;
    case Category.PANTRY: return <Utensils className="text-amber-700" size={32} />;
    default: return <ImageIcon className="text-gray-300" size={32} />;
  }
};

// --- Components ---

const Hero = ({ onCta }: { onCta: () => void }) => (
  <div className="relative bg-farm-900 text-white rounded-b-[2rem] shadow-xl overflow-hidden mb-6 mx-0">
    <div className="relative z-10 px-6 pt-12 pb-10">
      <div className="inline-flex items-center gap-2 mb-6 bg-farm-800/90 backdrop-blur-md border border-farm-600/50 rounded-full px-3 py-1.5 shadow-sm">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-[10px] font-bold tracking-wider uppercase text-white">Accepting Orders for Thursday</span>
      </div>
      <h1 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight drop-shadow-sm">
        Your local farm,<br /><span className="text-green-400">in your pocket.</span>
      </h1>
      <div className="space-y-1 mb-8">
        <p className="text-farm-100 text-sm font-medium flex items-center gap-2 drop-shadow-sm">
          <span className="w-5 h-5 rounded-full bg-farm-800 flex items-center justify-center text-xs font-bold border border-farm-700">1</span>
          Select fresh harvest
        </p>
        <p className="text-farm-100 text-sm font-medium flex items-center gap-2 drop-shadow-sm">
          <span className="w-5 h-5 rounded-full bg-farm-800 flex items-center justify-center text-xs font-bold border border-farm-700">2</span>
          Choose pickup or delivery
        </p>
        <p className="text-farm-100 text-sm font-medium flex items-center gap-2 drop-shadow-sm">
          <span className="w-5 h-5 rounded-full bg-farm-800 flex items-center justify-center text-xs font-bold border border-farm-700">3</span>
          Checkout on WhatsApp
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={onCta} className="w-full bg-white text-farm-900 py-4 rounded-xl font-bold text-base hover:bg-gray-50 transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
          Order Now <ArrowRight size={18} />
        </button>
      </div>
    </div>
  </div>
);

const CategoryPills = ({ selected, onSelect }: { selected: string, onSelect: (c: string) => void }) => (
  <div className="flex gap-2 overflow-x-auto px-4 py-4 no-scrollbar">
    <button onClick={() => onSelect('All')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${selected === 'All' ? 'bg-farm-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>All</button>
    {Object.values(Category).map(cat => (
      <button key={cat} onClick={() => onSelect(cat)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${selected === cat ? 'bg-farm-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{cat}</button>
    ))}
  </div>
);

const ProductCard: React.FC<{ product: Product, onAdd: any }> = ({ product, onAdd }) => {
  const [qty, setQty] = useState(1);
  const [isSubscription, setIsSubscription] = useState(false);
  const [subFreq, setSubFreq] = useState(Frequency.WEEKLY);

  const handleAdd = () => {
    onAdd(product, qty, isSubscription && product.subscribable ? subFreq : Frequency.ONE_TIME);
    setQty(1);
    setIsSubscription(false);
  };

  return (
    <div className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full transition-all relative overflow-hidden ${!product.available ? 'grayscale pointer-events-none' : 'hover:shadow-md'}`}>
      {!product.available && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
          <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">Out of Season</span>
        </div>
      )}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50 flex items-center justify-center border border-gray-100">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            {getPlaceholderIcon(product.category)}
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</span>
          </div>
        )}
        {product.seasonal && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">SEASONAL</div>
        )}
      </div>
      <div className="flex-1 mb-2">
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-farm-700">${product.price.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">/ {product.unit}</span>
        </div>
      </div>
      <div className="space-y-2">
        {product.subscribable && (
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setIsSubscription(false)} className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${!isSubscription ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>One-time</button>
             <button onClick={() => setIsSubscription(true)} className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${isSubscription ? 'bg-white text-farm-700 shadow-sm' : 'text-gray-500'}`}>Sub</button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1.5"><Minus size={12} /></button>
            <span className="text-xs font-bold w-4 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="p-1.5"><Plus size={12} /></button>
          </div>
          <button onClick={handleAdd} className="flex-1 bg-farm-600 text-white py-2 rounded-full font-bold text-xs shadow-md">Add</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const CustomerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'cart'>('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', address: '', notes: '' });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('localroots_products');
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  const orders: Order[] = useMemo(() => {
    const saved = localStorage.getItem('localroots_orders');
    return saved ? JSON.parse(saved) : [];
  }, [showConfirmation, activeTab]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => p.featured && p.available);
  }, [products]);

  const getSlotRemaining = (slot: Slot) => {
    const booked = orders.filter(o => o.slotId === slot.id && o.status !== 'Cancelled').length;
    return slot.maxCapacity - booked;
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => {
    const p = products.find(p => p.id === item.productId);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0), [cart, products]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: Product | string, quantity: number, frequency: Frequency) => {
    const pid = typeof product === 'string' ? product : product.id;
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === pid && i.frequency === frequency);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += quantity;
        return next;
      }
      return [...prev, { productId: pid, quantity, frequency }];
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!userDetails.name.trim()) newErrors.name = 'Required';
    if (!selectedSlot) newErrors.slot = 'Select a date and slot';
    if (selectedSlot?.type === 'Delivery' && !userDetails.address.trim()) newErrors.address = 'Required for delivery';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWhatsAppCheckout = () => {
    if (!selectedSlot) return;

    // Persist order IMMEDIATELY on click
    const itemsWithDates = cart.map(i => ({
      ...i,
      startDate: i.frequency !== Frequency.ONE_TIME ? selectedSlot.date : undefined
    }));

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      date: selectedSlot.date,
      status: 'New',
      total: cartTotal,
      customerName: userDetails.name,
      address: userDetails.address,
      notes: userDetails.notes,
      items: itemsWithDates,
      slotId: selectedSlot.id,
      fulfillmentType: selectedSlot.type
    };

    const saved = localStorage.getItem('localroots_orders');
    const existing: Order[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('localroots_orders', JSON.stringify([newOrder, ...existing]));

    // Generate link
    const itemsSummary = cart.map(i => {
      const p = products.find(x => x.id === i.productId);
      return `- ${p?.name} x${i.quantity} (${i.frequency})`;
    }).join('\n');
    
    const message = `*Local Roots Order Request*\n\n` +
      `*Name:* ${userDetails.name}\n` +
      `*Type:* ${selectedSlot.type}\n` +
      `*Slot:* ${selectedSlot.label} (${selectedSlot.date})\n` +
      (selectedSlot.type === 'Delivery' ? `*Address:* ${userDetails.address}\n` : '') +
      (userDetails.notes ? `*Notes:* ${userDetails.notes}\n` : '') +
      `\n*Items:*\n${itemsSummary}\n\n` +
      `*Total Estimate:* $${cartTotal.toFixed(2)}\n\n` +
      `_Order is pending manual confirmation on WhatsApp._`;

    const number = import.meta.env.VITE_WHATSAPP_NUMBER;
    const link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    
    // Redirect
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <header className="bg-white sticky top-0 z-40 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-farm-600 rounded-lg flex items-center justify-center text-white font-bold">LR</div>
          <span className="font-bold text-lg tracking-tight">Local Roots</span>
        </div>
      </header>

      <main>
        {activeTab === 'home' && (
          <>
            <Hero onCta={() => setActiveTab('shop')} />
            <div className="px-4 pb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="text-amber-500 fill-amber-500" size={20} />
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Featured Harvest</h2>
                </div>
                <button onClick={() => setActiveTab('shop')} className="text-farm-600 text-sm font-bold flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {featuredProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} />
                ))}
              </div>
            </div>
          </>
        )}
        {activeTab === 'shop' && (
          <div className="pt-2">
            <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
            <div className="px-4 grid grid-cols-2 gap-3">
              {products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory)).map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
            </div>
          </div>
        )}
        {activeTab === 'cart' && (
          <div className="p-4 space-y-6">
            <h2 className="font-bold text-xl">Review & Checkout</h2>
            {cart.length === 0 ? <p className="text-gray-400">Basket is empty.</p> : (
              <>
                <div className="space-y-3">
                  {cart.map((item, idx) => {
                    const p = products.find(x => x.id === item.productId);
                    return (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{p?.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x ${p?.price.toFixed(2)} ({item.frequency})</p>
                        </div>
                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}><Trash2 size={16} className="text-gray-300"/></button>
                      </div>
                    );
                  })}
                  <div className="text-right font-bold text-lg">Total: ${cartTotal.toFixed(2)}</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                    <input value={userDetails.name} onChange={e => setUserDetails(prev => ({...prev, name: e.target.value}))} className={`w-full p-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Full Name" />
                    {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Delivery/Pickup Slot</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {getUniqueSlotDates().map(d => (
                        <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(null); }} className={`px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap ${selectedDate === d ? 'bg-farm-900 text-white' : 'bg-white'}`}>{formatDateDisplay(d)}</button>
                      ))}
                    </div>
                    {selectedDate && (
                      <div className="mt-2 space-y-2">
                        {SLOTS.filter(s => s.date === selectedDate).map(s => {
                          const rem = getSlotRemaining(s);
                          const isFull = rem <= 0;
                          return (
                            <button key={s.id} disabled={isFull} onClick={() => setSelectedSlot(s)} className={`w-full p-3 rounded-xl border text-left flex justify-between items-center ${isFull ? 'bg-gray-100 opacity-50' : selectedSlot?.id === s.id ? 'border-farm-600 ring-1 ring-farm-600 bg-farm-50' : 'bg-white'}`}>
                              <div>
                                <p className="font-bold text-sm">{s.label}</p>
                                <p className="text-[10px] text-gray-500">{s.type}</p>
                              </div>
                              <span className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-farm-600'}`}>{isFull ? 'FULL' : `${rem} left`}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {errors.slot && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.slot}</p>}
                  </div>

                  {selectedSlot?.type === 'Delivery' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delivery Address</label>
                      <textarea value={userDetails.address} onChange={e => setUserDetails(prev => ({...prev, address: e.target.value}))} className={`w-full p-3 rounded-xl border ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Building, Floor, Street..." />
                      {errors.address && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.address}</p>}
                    </div>
                  )}

                  <button onClick={() => validate() && setShowConfirmation(true)} className="w-full bg-farm-900 text-white py-4 rounded-xl font-bold">Review Order</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Basket Bar */}
      {cart.length > 0 && activeTab !== 'cart' && (
        <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <button 
            onClick={() => setActiveTab('cart')}
            className="w-full bg-farm-900 text-white p-4 rounded-2xl shadow-xl shadow-farm-900/20 flex justify-between items-center transform transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-sm">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide uppercase text-farm-100">View Basket</span>
              <ArrowRight size={16} className="text-farm-100" />
            </div>
            <div className="font-bold text-lg">
              ${cartTotal.toFixed(2)}
            </div>
          </button>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-6 animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Final Review</h2>
            <button onClick={() => setShowConfirmation(false)}><X /></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">Orders are <strong>not automatic</strong>. They must be confirmed manually by the farm team on WhatsApp.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <p className="text-xs uppercase font-bold text-gray-400">Recipient</p>
              <p className="font-bold">{userDetails.name}</p>
              <p className="text-sm">{selectedSlot?.type} on {selectedSlot?.label}</p>
              {selectedSlot?.type === 'Delivery' && <p className="text-sm text-gray-600">{userDetails.address}</p>}
            </div>
          </div>
          <button onClick={handleWhatsAppCheckout} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg">
            <MessageCircle size={20} /> Send to WhatsApp
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center z-40">
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-farm-600' : 'text-gray-400'}><Home size={24}/></button>
        <button onClick={() => setActiveTab('shop')} className={activeTab === 'shop' ? 'text-farm-600' : 'text-gray-400'}><ShoppingBasket size={24}/></button>
        <button onClick={() => setActiveTab('cart')} className={`relative ${activeTab === 'cart' ? 'text-farm-600' : 'text-gray-400'}`}>
          <CheckCircle2 size={24}/>
          {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}
        </button>
      </nav>

      <ChatAssistant onAddToCart={addToCart} hasStickyBar={cart.length > 0 && activeTab !== 'cart'} />
    </div>
  );
};

const AdminPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const handleLogin = (e: any) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) setIsAuth(true);
    else alert('Incorrect password');
  };
  if (!isAuth) return (
    <div className="min-h-screen bg-farm-900 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">Admin Login</h1>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Password" />
        <button className="w-full bg-farm-600 text-white font-bold py-3 rounded-xl">Unlock</button>
      </form>
    </div>
  );
  return <AdminPanel orders={[]} />;
};

const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<CustomerApp />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </HashRouter>
);

export default App;