
import React, { useState } from 'react';
import { Customer, Order, AppSettings } from '../types';
import { Plus, Search, Edit, Trash2, Phone, MapPin, Download, MessageCircle, UserCircle, X, Sparkles, Send, History, Receipt, Tag } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { smartSearch } from '../utils/searchUtils';

interface CustomerManagerProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  orders: Order[];
  settings: AppSettings;
  // Added onSaveCustomer prop for persistence
  onSaveCustomer?: (customer: Customer) => Promise<boolean>;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, setCustomers, orders, settings, onSaveCustomer }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [discType, setDiscType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discValue, setDiscValue] = useState<string>('0');
  
  // Offer States
  const [offerText, setOfferText] = useState('');

  const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none placeholder:text-slate-400 transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  const calculateCustomerDue = (customerId: string) => {
    return orders
      .filter(o => o.customer.id === customerId)
      .reduce((acc, o) => acc + o.dueAmount, 0);
  };

  const getCustomerOrders = (customerId: string) => {
    return orders.filter(o => o.customer.id === customerId).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  };

  const handleSendReminder = (customer: Customer) => {
    const totalDue = calculateCustomerDue(customer.id);
    if (totalDue <= 0) return;
    const message = `আসসালামু আলাইকুম ${customer.name}, আপনার কাছে মোট ৳${totalDue} টাকা বকেয়া আছে। অনুগ্রহ করে দ্রুত পরিশোধ করার জন্য অনুরোধ রইল। ধন্যবাদ - ${settings.softwareName}।`;
    window.open(`https://wa.me/88${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendOffer = () => {
    if (!selectedCustomer || !offerText) return;
    window.open(`https://wa.me/88${selectedCustomer.phone}?text=${encodeURIComponent(offerText)}`, '_blank');
    setShowOfferModal(false);
    setOfferText('');
  };

  // Fixed: Updated handleSubmit to support optional onSaveCustomer prop
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerData: Customer = {
      id: editingId || Date.now().toString(),
      name,
      phone,
      address,
      defaultDiscountType: discType,
      defaultDiscountValue: Number(discValue)
    };

    if (onSaveCustomer) {
      await onSaveCustomer(customerData);
    } else {
      if (editingId) {
        setCustomers(customers.map(c => c.id === editingId ? customerData : c));
      } else {
        setCustomers([customerData, ...customers]);
      }
    }
    resetForm();
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || '');
    setDiscType(customer.defaultDiscountType || 'PERCENTAGE');
    setDiscValue((customer.defaultDiscountValue || 0).toString());
    setShowModal(true);
  };

  const resetForm = () => {
    setName(''); setPhone(''); setAddress(''); setEditingId(null); 
    setDiscType('PERCENTAGE'); setDiscValue('0');
    setShowModal(false);
  };

  const filteredCustomers = smartSearch<Customer>(customers, searchTerm, ['name', 'phone']);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">গ্রাহক ব্যবস্থাপনা ও ইতিহাস</h2>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(customers, 'Customers')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all font-medium">
            <Download size={18} /> এক্সপোর্ট
          </button>
          <button onClick={() => setShowModal(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 font-bold">
            <Plus size={20} /> নতুন গ্রাহক
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-50 bg-slate-50/30">
          <div className="relative">
            <Search className="absolute left-4 top-3 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..." className="w-full pl-11 p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm transition-all text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">গ্রাহকের তথ্য</th>
                <th className="px-8 py-5">মোবাইল</th>
                <th className="px-8 py-5">ডিফল্ট ডিসকাউন্ট</th>
                <th className="px-8 py-5 text-right">মোট বকেয়া</th>
                <th className="px-8 py-5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => {
                const totalDue = calculateCustomerDue(customer.id);
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5 font-black text-slate-800 flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black"><UserCircle size={24}/></div>
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setShowDetailsModal(true); }}
                        className="text-left hover:text-cyan-600 transition-colors"
                      >
                        {customer.name}
                        <p className="text-[10px] text-slate-400 font-normal italic">{customer.address || 'ঠিকানা দেওয়া হয়নি'}</p>
                      </button>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600">{customer.phone}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-lg">
                        <Tag size={12} className="text-cyan-500"/>
                        {customer.defaultDiscountValue ? `${customer.defaultDiscountValue}${customer.defaultDiscountType === 'PERCENTAGE' ? '%' : '৳'}` : '0'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-black ${totalDue > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                          ৳{totalDue}
                        </span>
                        {totalDue > 0 && (
                          <button onClick={() => handleSendReminder(customer)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-full transition-all" title="বকেয়া রিমাইন্ডার পাঠান">
                            <MessageCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center flex justify-center gap-2">
                      <button onClick={() => { setSelectedCustomer(customer); setShowDetailsModal(true); }} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" title="ইতিহাস দেখুন">
                        <History size={18} />
                      </button>
                      <button onClick={() => handleEdit(customer)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
                      <button onClick={() => setCustomers(customers.filter(c => c.id !== customer.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAILS & HISTORY MODAL */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-3xl">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 bg-cyan-100 rounded-3xl flex items-center justify-center text-cyan-600">
                  <UserCircle size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800">{selectedCustomer.name}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5"><Phone size={14}/> {selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14}/> {selectedCustomer.address}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-500 transition-all border border-slate-100">
                <X size={24}/>
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">মোট বকেয়া পরিমাণ</p>
                  <h4 className="text-3xl font-black text-red-400">৳{calculateCustomerDue(selectedCustomer.id)}</h4>
                  <div className="mt-6 flex flex-col gap-2">
                    <button 
                      onClick={() => handleSendReminder(selectedCustomer)}
                      className="w-full bg-green-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                    >
                      <MessageCircle size={18}/> বকেয়া রিমাইন্ডার
                    </button>
                    <button 
                      onClick={() => { setShowOfferModal(true); }}
                      className="w-full bg-purple-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-all"
                    >
                      <Sparkles size={18}/> হোয়াটসঅ্যাপে অফার পাঠান
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                   <h5 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Tag className="text-cyan-500" size={16}/> ডিফল্ট ডিসকাউন্ট</h5>
                   <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-500 font-bold">Applied:</span>
                      <span className="font-black text-slate-900">
                        {selectedCustomer.defaultDiscountValue ? `${selectedCustomer.defaultDiscountValue}${selectedCustomer.defaultDiscountType === 'PERCENTAGE' ? '%' : '৳'}` : '০ (N/A)'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h5 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
                  <Receipt className="text-cyan-600" size={20}/> অর্ডার হিস্টোরি
                </h5>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest sticky top-0">
                        <tr>
                          <th className="px-6 py-4">অর্ডার নং</th>
                          <th className="px-6 py-4">তারিখ</th>
                          <th className="px-6 py-4 text-right">টোটাল</th>
                          <th className="px-6 py-4 text-center">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getCustomerOrders(selectedCustomer.id).length > 0 ? (
                          getCustomerOrders(selectedCustomer.id).map(order => (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-black text-slate-800">#{order.orderNumber.split('-').pop()}</td>
                              <td className="px-6 py-4 text-slate-500">{new Date(order.orderDate).toLocaleDateString('bn-BD')}</td>
                              <td className="px-6 py-4 text-right font-bold">৳{order.grandTotal}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                                  order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>{order.status}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">এখনও কোনো অর্ডার করা হয়নি</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM OFFER MODAL (Dynamic Templates from Settings) */}
      {showOfferModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="text-purple-600" /> অফার মেসেজ তৈরি করুন</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">সেভ করা টেমপ্লেট নির্বাচন করুন</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(settings.whatsappTemplates || []).map((template) => (
                      <button 
                        key={template.id}
                        onClick={() => setOfferText(template.text)}
                        className={`bg-white border border-slate-300 p-2 rounded-lg text-xs font-bold hover:border-purple-400 hover:text-purple-600 transition-all text-left truncate ${offerText === template.text ? 'border-purple-600 text-purple-600 ring-2 ring-purple-100' : ''}`}
                      >
                        {template.title}
                      </button>
                    ))}
                    {(settings.whatsappTemplates || []).length === 0 && (
                      <p className="col-span-2 text-center py-2 text-[10px] text-slate-400 italic">সেটিংসে কোনো টেমপ্লেট সেভ করা নেই</p>
                    )}
                  </div>
               </div>

               <div>
                  <label className={labelClass}>মেসেজ প্রিভিউ</label>
                  <textarea 
                    className={inputClass + " h-44 leading-relaxed"} 
                    placeholder="অফারটি এখানে লিখুন বা উপর থেকে টেমপ্লেট সিলেক্ট করুন..."
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                  ></textarea>
               </div>
               <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowOfferModal(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">বাতিল</button>
                  <button onClick={handleSendOffer} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2">
                    <Send size={18} /> হোয়াটসঅ্যাপে পাঠান
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW/EDIT CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-2">
              {editingId ? 'গ্রাহক তথ্য আপডেট' : 'নতুন গ্রাহক যোগ করুন'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>গ্রাহকের নাম</label>
                <input type="text" required className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: আল-আমিন হক" />
              </div>
              <div>
                <label className={labelClass}>মোবাইল নম্বর</label>
                <input type="text" required className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="০১৮XXXXXXXX" />
              </div>
              <div>
                <label className={labelClass}>ঠিকানা</label>
                <textarea className={inputClass + " h-24"} value={address} onChange={e => setAddress(e.target.value)} placeholder="পূর্ণাঙ্গ ঠিকানা লিখুন..."></textarea>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                 <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-3">ডিফল্ট ডিসকাউন্ট প্রোফাইল</h4>
                 <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="text-[10px] font-bold text-slate-400 mb-1 block">ডিসকাউন্ট ধরন</label>
                       <select 
                        className={inputClass} 
                        value={discType} 
                        onChange={e => setDiscType(e.target.value as any)}
                       >
                          <option value="PERCENTAGE">শতকরা (%)</option>
                          <option value="FIXED">ফিক্সড অ্যামাউন্ট (৳)</option>
                       </select>
                    </div>
                    <div className="w-1/3">
                       <label className="text-[10px] font-bold text-slate-400 mb-1 block">পরিমাণ</label>
                       <input 
                        type="number" 
                        className={inputClass} 
                        value={discValue} 
                        onChange={e => setDiscValue(e.target.value)}
                       />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">বাতিল</button>
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-3 rounded-xl font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-all">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
