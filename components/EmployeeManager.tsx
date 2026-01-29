
import React, { useState } from 'react';
import { Employee, EmployeeTransaction, Role } from '../types';
import { User, Phone, Banknote, History, Plus, X, Briefcase, Calendar, ShieldCheck, Edit, Trash2 } from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  employeeTransactions: EmployeeTransaction[];
  setEmployeeTransactions: React.Dispatch<React.SetStateAction<EmployeeTransaction[]>>;
  addTransaction: (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ 
  employees, 
  setEmployees,
  employeeTransactions, 
  setEmployeeTransactions, 
  addTransaction 
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [role, setRole] = useState<Role>(Role.STAFF);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment Form State
  const [paymentType, setPaymentType] = useState<'SALARY_PAYMENT' | 'ADVANCE' | 'BONUS'>('SALARY_PAYMENT');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const inputClass = "w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 focus:ring-4 focus:ring-cyan-500/10 outline-none placeholder:text-slate-400 transition-all text-sm font-medium";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  const handleOpenAdd = () => {
    setEditingId(null);
    setName(''); setDesignation(''); setPhone(''); setSalary(''); setRole(Role.STAFF);
    setJoinDate(new Date().toISOString().split('T')[0]);
    setShowFormModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setDesignation(emp.designation);
    setPhone(emp.phone);
    setSalary(emp.baseSalary.toString());
    setRole(emp.role);
    setJoinDate(emp.joinedDate.split('T')[0]);
    setShowFormModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const empData: Employee = {
      id: editingId || Date.now().toString(),
      name,
      designation,
      phone,
      baseSalary: Number(salary),
      joinedDate: joinDate,
      role
    };

    if (editingId) {
      setEmployees(employees.map(e => e.id === editingId ? empData : e));
    } else {
      setEmployees([...employees, empData]);
    }
    setShowFormModal(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !payAmount) return;

    const numAmount = Number(payAmount);
    const newEmpTx: EmployeeTransaction = {
      id: Date.now().toString(),
      employeeId: selectedEmployee.id,
      date: new Date(payDate).toISOString(),
      type: paymentType,
      amount: numAmount,
      note: payNote
    };

    setEmployeeTransactions([newEmpTx, ...employeeTransactions]);
    addTransaction('EXPENSE', numAmount, 'Employee Payment', `Paid to ${selectedEmployee.name} (${paymentType}) - ${payNote}`);
    setShowPayModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">কর্মচারী ব্যবস্থাপনা</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">মোট {employees.length} জন কর্মচারী</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-cyan-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-900/10 font-black text-[10px] uppercase tracking-widest"
        >
          <Plus size={18} /> নতুন কর্মচারী
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base leading-none">{emp.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{emp.designation}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                      emp.role === Role.ADMIN ? 'bg-rose-50 text-rose-500 border-rose-100' :
                      emp.role === Role.MANAGER ? 'bg-cyan-50 text-cyan-500 border-cyan-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {emp.role}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleOpenEdit(emp)} className="p-2 text-slate-300 hover:text-cyan-600 transition-colors">
                <Edit size={16} />
              </button>
            </div>
            
            <div className="space-y-2.5 text-xs text-slate-500 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote size={14} className="text-slate-400" />
                <span>বেতন: <span className="text-slate-900">৳{emp.baseSalary.toLocaleString()}</span></span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => { setSelectedEmployee(emp); setShowHistoryModal(true); }}
                className="flex-1 bg-white border border-slate-200 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex justify-center items-center gap-2"
              >
                <History size={14} /> হিস্টোরি
              </button>
              <button 
                onClick={() => { setSelectedEmployee(emp); setShowPayModal(true); setPayAmount(''); setPayNote(''); }}
                className="flex-1 bg-cyan-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex justify-center items-center gap-2 shadow-lg shadow-cyan-100"
              >
                <Plus size={14} /> পেমেন্ট
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal (Add/Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl h-full sm:h-auto overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-xl font-black text-slate-800">{editingId ? 'কর্মচারী আপডেট' : 'নতুন কর্মচারী যোগ'}</h3>
              <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>নাম</label>
                <input type="text" required className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="নাম লিখুন" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>পদবী</label>
                  <input type="text" required className={inputClass} value={designation} onChange={e => setDesignation(e.target.value)} placeholder="যেমন: ডিজাইনার" />
                </div>
                <div>
                  <label className={labelClass}>মোবাইল</label>
                  <input type="tel" required className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="০১৭XXXXXXXX" />
                </div>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <label className={labelClass}><ShieldCheck size={14} className="text-cyan-600 inline mr-1" /> এক্সেস রোল (System Role)</label>
                <select className={inputClass} value={role} onChange={e => setRole(e.target.value as Role)}>
                  <option value={Role.STAFF}>Staff (অর্ডার ও কাস্টমার এক্সেস)</option>
                  <option value={Role.MANAGER}>Manager (সেলস, ইনভেন্টরি ও হিসাব)</option>
                  <option value={Role.ADMIN}>Admin (সম্পূর্ণ এক্সেস)</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-2 font-bold italic uppercase tracking-tighter">* রোল অনুযায়ী কর্মচারীর কাজের পরিধি নির্ধারিত হবে।</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>মূল বেতন (৳)</label>
                  <input type="number" required className={inputClass} value={salary} onChange={e => setSalary(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>যোগদানের তারিখ</label>
                  <input type="date" required className={inputClass} value={joinDate} onChange={e => setJoinDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 pt-6 pb-12 sm:pb-0">
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">বাতিল</button>
                <button type="submit" className="flex-1 py-4 bg-cyan-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-cyan-600/20">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md shadow-2xl h-full sm:h-auto animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-xl font-black text-slate-800">পেমেন্ট প্রদান - {selectedEmployee.name}</h3>
              <button onClick={() => setShowPayModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>পেমেন্টের ধরন</label>
                <select className={inputClass} value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)}>
                  <option value="SALARY_PAYMENT">মাসিক বেতন (Salary)</option>
                  <option value="ADVANCE">অগ্রিম (Advance)</option>
                  <option value="BONUS">বোনাস (Bonus)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>তারিখ</label>
                <input type="date" required className={inputClass} value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>পরিমাণ (টাকা)</label>
                <input type="number" required className={inputClass} value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>নোট (ঐচ্ছিক)</label>
                <input type="text" className={inputClass} value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="যেমন: জানুয়ারি মাসের বেতন" />
              </div>
              <div className="flex gap-3 pt-6 pb-12 sm:pb-0">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400">বাতিল</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20">পেমেন্ট দিন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl h-full sm:h-auto flex flex-col animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4 shrink-0">
               <h3 className="text-xl font-black text-slate-800">লেনদেন ইতিহাস - {selectedEmployee.name}</h3>
               <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50/50">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-white uppercase font-black text-[9px] tracking-widest sticky top-0">
                    <tr>
                      <th className="px-5 py-4">তারিখ</th>
                      <th className="px-5 py-4">ধরন</th>
                      <th className="px-5 py-4 text-right">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeTransactions
                      .filter(tx => tx.employeeId === selectedEmployee.id)
                      .map(tx => (
                      <tr key={tx.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-500">{new Date(tx.date).toLocaleDateString('bn-BD')}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border ${
                            tx.type === 'SALARY_PAYMENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            tx.type === 'ADVANCE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {tx.type === 'SALARY_PAYMENT' ? 'বেতন' : tx.type === 'ADVANCE' ? 'অগ্রিম' : 'বোনাস'}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px]">{tx.note}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-slate-900 text-sm">৳{tx.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {employeeTransactions.filter(tx => tx.employeeId === selectedEmployee.id).length === 0 && (
                      <tr><td colSpan={3} className="text-center py-20 text-slate-300 italic font-medium">কোন লেনদেন পাওয়া যায়নি</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
