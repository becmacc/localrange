
import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, Users, Download, Trash2, CheckCircle, RefreshCcw, Box, Save, Image as ImageIcon, Eye, EyeOff, Star } from 'lucide-react';
import { PRODUCTS as INITIAL_PRODUCTS } from '../constants';
import { Category, Slot, Order, Product, Frequency } from '../types';

const AdminPanel: React.FC<{ orders: any[] }> = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'totals'>('orders');
  const [viewFilter, setViewFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all');

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const o = localStorage.getItem('localroots_orders');
    if (o) setOrders(JSON.parse(o));
    const p = localStorage.getItem('localroots_products');
    setProducts(p ? JSON.parse(p) : INITIAL_PRODUCTS);
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tom = new Date(); tom.setDate(now.getDate() + 1);
    const tomorrow = tom.toISOString().split('T')[0];
    
    return orders.filter(o => {
      if (viewFilter === 'today') return o.date === today;
      if (viewFilter === 'tomorrow') return o.date === tomorrow;
      if (viewFilter === 'week') {
        const d = new Date(o.date);
        const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      return true;
    });
  }, [orders, viewFilter]);

  const productTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.status === 'Cancelled') return;
      o.items.forEach(i => {
        map[i.productId] = (map[i.productId] || 0) + i.quantity;
      });
    });
    return map;
  }, [filteredOrders]);

  const exportCSV = () => {
    const headers = [
      'orderId', 'createdAt', 'customerName', 'fulfillment', 'date', 
      'slotLabel', 'address', 'notes', 'status', 'itemsSummary',
      'isSubscription', 'frequency', 'startDate'
    ];
    const rows = filteredOrders.map(o => {
      const isSub = o.items.some(i => i.frequency !== Frequency.ONE_TIME);
      const subFreqs = o.items.map(i => i.frequency !== Frequency.ONE_TIME ? i.frequency : '').filter(f => f).join('; ') || 'none';
      const startDates = o.items.map(i => i.startDate || '').filter(d => d).join('; ') || 'n/a';
      const itemsSummary = o.items.map(i => {
        const p = products.find(x => x.id === i.productId);
        return `${p?.name || i.productId} x${i.quantity} (${i.frequency})`;
      }).join(' | ');

      return [
        o.id, o.createdAt, o.customerName, o.fulfillmentType, o.date, 
        o.slotId, o.address, o.notes, o.status, itemsSummary,
        isSub ? 'true' : 'false', subFreqs, startDates
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `localroots_orders_${viewFilter}_${Date.now()}.csv`; a.click();
  };

  const toggleAvailability = (pid: string) => {
    const next = products.map(p => p.id === pid ? { ...p, available: !p.available } : p);
    setProducts(next);
    localStorage.setItem('localroots_products', JSON.stringify(next));
  };

  const toggleFeatured = (pid: string) => {
    const next = products.map(p => p.id === pid ? { ...p, featured: !p.featured } : p);
    setProducts(next);
    localStorage.setItem('localroots_products', JSON.stringify(next));
  };

  const updateStatus = (id: string, s: any) => {
    const next = orders.map(o => o.id === id ? { ...o, status: s } : o);
    setOrders(next);
    localStorage.setItem('localroots_orders', JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 bg-white rounded-lg border shadow-sm"><RefreshCcw size={18}/></button>
          <button onClick={exportCSV} className="bg-farm-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2"><Download size={16}/> Export CSV</button>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        {(['orders', 'totals', 'inventory'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`pb-2 px-4 font-bold text-sm capitalize ${activeTab === t ? 'border-b-2 border-farm-600 text-farm-700' : 'text-gray-400'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'today', 'tomorrow', 'week'] as const).map(f => (
              <button key={f} onClick={() => setViewFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold border capitalize ${viewFilter === f ? 'bg-farm-900 text-white' : 'bg-white'}`}>{f}</button>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Slot</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">No orders found for this filter</td></tr>
                ) : filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td className="px-4 py-4">
                      <p className="font-bold">{o.customerName}</p>
                      <p className="text-[10px] text-gray-400">{o.id}</p>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mb-1 ${o.fulfillmentType === 'Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{o.fulfillmentType}</span>
                      <p>{o.date}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-farm-700">${o.total.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="text-[10px] border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-farm-500">
                        {['New', 'Confirmed', 'Packed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'totals' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold">Aggregated Totals ({viewFilter})</h2>
          <div className="divide-y">
            {Object.keys(productTotals).length === 0 ? (
              <p className="py-4 text-gray-400 italic text-sm">No items found.</p>
            ) : Object.entries(productTotals).map(([pid, qty]) => (
              <div key={pid} className="py-2 flex justify-between text-sm">
                <span className="font-medium">{products.find(p => p.id === pid)?.name || pid}</span>
                <span className="font-bold text-farm-700">x{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
              <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Seasonal</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.category}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{p.seasonal ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-xs">
                    <button onClick={() => toggleFeatured(p.id)} className={`p-1.5 rounded-full transition-colors ${p.featured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:bg-gray-50'}`}>
                      <Star size={18} fill={p.featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAvailability(p.id)} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${p.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                      {p.available ? <Eye size={12}/> : <EyeOff size={12}/>}
                      {p.available ? 'Available' : 'Out of season'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
