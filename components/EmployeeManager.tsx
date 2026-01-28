
import React, { useState } from 'react';
import { Employee, EmployeeTransaction, Role } from '../types';
import { User, Phone, Banknote, History, Plus, X, Briefcase, Calendar, ShieldCheck } from 'lucide-react';

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
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee State
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newRole, setNewRole] = useState<Role>(Role.STAFF);
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment Form State
  const [paymentType, setPaymentType] = useState<'SALARY_PAYMENT' | 'ADVANCE' | 'BONUS'>('SALARY_PAYMENT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none placeholder:text-slate-400 transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const newEmp: Employee = {
      id: Date.now().toString(),
      name: newName,
      designation: newDesignation,
      phone: newPhone,
      baseSalary: Number(newSalary),
      joinedDate: newJoinDate,
      role: newRole
    };

    setEmployees([...employees, newEmp]);
    setShowAddModal(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setNewName(''); setNewDesignation(''); setNewPhone(''); setNewSalary(''); setNewRole(Role.STAFF); setShowAddModal(false);
  };

  const handleOpenPayModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowPayModal(true);
    setAmount('');
    setNote('');
    setPaymentType('SALARY_PAYMENT');
  };

  const handleOpenHistoryModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowHistoryModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !amount) return;

    const numAmount = Number(amount);
    
    const newEmpTx: EmployeeTransaction = {
      id: Date.now().toString(),
      employeeId: selectedEmployee.id,
      date: new Date(date).toISOString(),
      type: paymentType,
      amount: numAmount,
      note: note
    };

    setEmployeeTransactions([newEmpTx, ...employeeTransactions]);

    const category = paymentType === 'SALARY_PAYMENT' ? 'Salary' : paymentType === 'BONUS' ? 'Bonus' : 'Advance Salary';
    addTransaction('EXPENSE', numAmount, category, `Paid to ${selectedEmployee.name} (${paymentType}) - ${note}`);

    setShowPayModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">কর্মচারী ব্যবস্থাপনা</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 font-bold"
        >
          <Plus size={20} /> নতুন কর্মচারী
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User size={64} />
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 font-bold text-xl">
                {emp.name.charAt(0)}
              </div>
              <div className="overflow-hidden pr-8">
                <h3 className="font-bold text-lg text-slate-800 truncate">{emp.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500">{emp.designation}</p>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                    emp.role === Role.ADMIN ? 'bg-red-50 text-red-500 border-red-100' :
                    emp.role === Role.MANAGER ? 'bg-cyan-50 text-cyan-500 border-cyan-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {emp.role}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote size={16} />
                <span>মূল বেতন: ৳ {emp.baseSalary}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handleOpenHistoryModal(emp)}
                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex justify-center items-center gap-1"
              >
                <History size={16} /> হিস্টোরি
              </button>
              <button 
                onClick={() => handleOpenPayModal(emp)}
                className="flex-1 bg-cyan-50 text-cyan-700 py-2 rounded-lg text-sm font-medium hover:bg-cyan-100 transition-colors flex justify-center items-center gap-1"
              >
                <Plus size={16} /> বেতন/অগ্রিম
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
              <h3 className="text-xl font-bold text-slate-800">নতুন কর্মচারী যোগ করুন</h3>
              <button onClick={resetAddForm} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className={labelClass}>নাম</label>
                <input type="text" required className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="নাম লিখুন" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>পদবী</label>
                  <input type="text" required className={inputClass} value={newDesignation} onChange={e => setNewDesignation(e.target.value)} placeholder="যেমন: ডিজাইনার" />
                </div>
                <div>
                  <label className={labelClass}>মোবাইল</label>
                  <input type="text" required className={inputClass} value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="০১৭XXXXXXXX" />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className={labelClass}><ShieldCheck size={16} className="text-cyan-600 mr-2" /> সিস্টেম রোল (Access Role)</label>
                <select className={inputClass} value={newRole} onChange={e => setNewRole(e.target.value as Role)}>
                  <option value={Role.STAFF}>Staff (Basic Access)</option>
                  <option value={Role.MANAGER}>Manager (Sales & Inventory)</option>
                  <option value={Role.ADMIN}>Admin (Full Access)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* এডমিন হিসেবে এই কর্মচারীর এক্সেস লেভেল সেট করুন।</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>মূল বেতন (৳)</label>
                  <input type="number" required className={inputClass} value={newSalary} onChange={e => setNewSalary(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>যোগদানের তারিখ</label>
                  <input type="date" required className={inputClass} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={resetAddForm} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-all">বাতিল</button>
                <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 font-bold shadow-lg shadow-cyan-100">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
              <h3 className="text-xl font-bold text-slate-800">পেমেন্ট প্রদান - {selectedEmployee.name}</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
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
                <input type="date" required className={inputClass} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>পরিমাণ (টাকা)</label>
                <input type="number" required className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>নোট (ঐচ্ছিক)</label>
                <input type="text" className={inputClass} value={note} onChange={e => setNote(e.target.value)} placeholder="যেমন: জানুয়ারি মাসের বেতন" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-all">বাতিল</button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-100">নিশ্চিত করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
               <h3 className="text-xl font-bold text-slate-800">লেনদেন ইতিহাস - {selectedEmployee.name}</h3>
               <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X size={20}/></button>
             </div>
             
             <div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl shadow-inner bg-slate-50/30">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">তারিখ</th>
                      <th className="px-4 py-3">ধরন</th>
                      <th className="px-4 py-3">নোট</th>
                      <th className="px-4 py-3 text-right">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeTransactions
                      .filter(tx => tx.employeeId === selectedEmployee.id)
                      .map(tx => (
                      <tr key={tx.id} className="hover:bg-white transition-colors">
                        <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString('bn-BD')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wider ${
                            tx.type === 'SALARY_PAYMENT' ? 'bg-green-100 text-green-700' :
                            tx.type === 'ADVANCE' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {tx.type === 'SALARY_PAYMENT' ? 'বেতন' : tx.type === 'ADVANCE' ? 'অগ্রিম' : 'বোনাস'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">{tx.note || '-'}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-800">৳{tx.amount}</td>
                      </tr>
                    ))}
                    {employeeTransactions.filter(tx => tx.employeeId === selectedEmployee.id).length === 0 && (
                      <tr><td colSpan={4} className="text-center py-10 text-slate-400 font-medium italic">কোন লেনদেন নেই</td></tr>
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
