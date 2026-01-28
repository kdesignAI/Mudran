
import React, { useState } from 'react';
import { Employee, Transaction, Order } from '../types';
import { Plus, ArrowUpCircle, ArrowDownCircle, Download, Repeat, ShoppingCart, Calculator, Hash, X } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';

interface FinanceManagerProps {
  transactions: Transaction[];
  addTransaction: (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string, relatedOrderId?: string) => void;
  employees: Employee[];
  orders: Order[];
  addEmployeeTransaction: (employeeId: string, type: 'SALARY_PAYMENT' | 'ADVANCE' | 'BONUS', amount: number, note: string) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ transactions, addTransaction, employees, orders }) => {
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [relatedOrderId, setRelatedOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    addTransaction(type, Number(amount), category, description, relatedOrderId || undefined);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount(''); setCategory(''); setDescription(''); setRelatedOrderId('');
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-4 sm:p-10 space-y-6 pb-24 lg:pb-6 animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Calculator className="text-cyan-600" /> হিসাব নিকাশ
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">ব্যবসায়িক আয় ও ব্যয়ের তথ্য</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => exportToCSV(transactions, 'Finance')} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 font-bold text-[10px] uppercase tracking-widest">
            <Download size={18} /> এক্সপোর্ট
          </button>
          <button onClick={() => setShowModal(true)} className="flex-[2] sm:flex-none bg-cyan-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-700 shadow-xl shadow-cyan-600/10 font-black text-[10px] uppercase tracking-widest">
            <Plus size={20} /> নতুন এন্ট্রি
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-emerald-600 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-xl flex items-center justify-between overflow-hidden relative group">
          <div className="z-10">
            <p className="text-emerald-100 text-[9px] font-black uppercase tracking-[0.2em] mb-1">মোট আয় (Income)</p>
            <h3 className="text-2xl sm:text-4xl font-black">৳{totalIncome.toLocaleString()}</h3>
          </div>
          <ArrowUpCircle size={60} className="opacity-20 absolute -right-2 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-rose-600 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-xl flex items-center justify-between overflow-hidden relative group">
          <div className="z-10">
            <p className="text-rose-100 text-[9px] font-black uppercase tracking-[0.2em] mb-1">মোট ব্যয় (Expense)</p>
            <h3 className="text-2xl sm:text-4xl font-black">৳{totalExpense.toLocaleString()}</h3>
          </div>
          <ArrowDownCircle size={60} className="opacity-20 absolute -right-2 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
          <Repeat className="text-slate-400" size={18} />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">সাম্প্রতিক লেনদেনসমূহ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 sm:px-10 py-5">তারিখ</th>
                <th className="px-6 sm:px-10 py-5">বিবরণ</th>
                <th className="px-6 sm:px-10 py-5 hidden sm:table-cell">ক্যাটাগরি</th>
                <th className="px-6 sm:px-10 py-5 text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 sm:px-10 py-5 font-bold text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-6 sm:px-10 py-5">
                    <p className="font-black text-slate-800 leading-tight">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                       <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">[{t.category}]</span>
                    </div>
                  </td>
                  <td className="px-6 sm:px-10 py-5 hidden sm:table-cell">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">{t.category}</span>
                  </td>
                  <td className={`px-6 sm:px-10 py-5 text-right font-black text-sm sm:text-base ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} ৳{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                 <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-300 italic">কোন লেনদেন পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-0 sm:p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-6 sm:p-10 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl h-full sm:h-auto overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-slate-50 pb-4">
               <h3 className="text-xl font-black text-slate-800">লেনদেন এন্ট্রি</h3>
               <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button type="button" onClick={() => setType('INCOME')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>আয় (Income)</button>
                <button type="button" onClick={() => setType('EXPENSE')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>ব্যয় (Expense)</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">পরিমাণ (৳)</label>
                  <input type="number" required className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-black text-slate-800 outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ক্যাটাগরি</label>
                  <input list="finance-cats" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all" value={category} onChange={e => setCategory(e.target.value)} required />
                  <datalist id="finance-cats">
                    <option value="Order Payment" /><option value="Raw Materials" /><option value="Salary" /><option value="Utility" /><option value="Rent" />
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">লিঙ্কড অর্ডার (ঐচ্ছিক)</label>
                <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all" value={relatedOrderId} onChange={e => setRelatedOrderId(e.target.value)}>
                  <option value="">অর্ডার নির্বাচন করুন...</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>#{order.orderNumber.split('-').pop()} - {order.customer.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">বিবরণ</label>
                <textarea className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-cyan-500/10 h-24 resize-none transition-all" value={description} onChange={e => setDescription(e.target.value)} required placeholder="লেনদেনের বিস্তারিত লিখুন..."></textarea>
              </div>

              <div className="flex gap-3 pt-4 pb-10 sm:pb-0">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">বাতিল</button>
                <button type="submit" className="flex-[2] py-4 bg-cyan-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-cyan-600/20">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
