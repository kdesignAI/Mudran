
import React, { useRef, useState } from 'react';
import { AppSettings, WhatsAppTemplate, Order, Transaction, InventoryItem, Customer, Employee, Purchase } from '../types';
import { Settings, Save, RefreshCcw, Palette, Type, Layout, Image as ImageIcon, FileText, MessageCircle, Plus, Trash2, Edit2, CloudDownload, CloudUpload, FileSpreadsheet, Database, ShieldCheck, AlertCircle } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';

interface SettingsManagerProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  data: {
    orders: Order[];
    transactions: Transaction[];
    inventory: InventoryItem[];
    customers: Customer[];
    employees: Employee[];
    purchases: Purchase[];
  };
  setters: {
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  };
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, setSettings, data, setters }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateText, setTemplateText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateTitle || !templateText) return;

    const templates = settings.whatsappTemplates || [];
    let updatedTemplates: WhatsAppTemplate[];

    if (editingTemplateId) {
      updatedTemplates = templates.map(t => 
        t.id === editingTemplateId ? { ...t, title: templateTitle, text: templateText } : t
      );
    } else {
      updatedTemplates = [...templates, { id: Date.now().toString(), title: templateTitle, text: templateText }];
    }

    setSettings({ ...settings, whatsappTemplates: updatedTemplates });
    setEditingTemplateId(null);
    setTemplateTitle('');
    setTemplateText('');
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = (settings.whatsappTemplates || []).filter(t => t.id !== id);
    setSettings({ ...settings, whatsappTemplates: updatedTemplates });
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateTitle(template.title);
    setTemplateText(template.text);
  };

  const resetSettings = () => {
    if (confirm("আপনি কি সেটিংস ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?")) {
      setSettings({
        softwareName: "মুদ্রণ সহযোগী",
        logoText: "M",
        themeColor: "#0891b2",
        logoUrl: "",
        invoiceHeader: "Premium Printing & Branding Solutions",
        whatsappTemplates: [
          { id: 't1', title: "ঈদ মোবারক অফার", text: "আসসালামু আলাইকুম, ঈদ উপলক্ষে আমাদের সকল প্রিন্টিং সার্ভিসে ১০% ডিসকাউন্ট চলছে। আজই আপনার অর্ডার কনফার্ম করুন! - মুদ্রণ সহযোগী।" },
          { id: 't2', title: "নতুন গ্রাহক অফার", text: "মুদ্রণ সহযোগীর নতুন গ্রাহক হিসেবে আপনার প্রথম অর্ডারে পাচ্ছেন ৫% বিশেষ ছাড়। আমাদের সেবা পরখ করে দেখুন। ধন্যবাদ।" },
          { id: 't3', title: "বড় অর্ডার ডিসকাউন্ট", text: "আপনার ব্যবসার ব্রান্ডিং আইটেম (টি-শার্ট, মগ, আইডি কার্ড) ৫০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি এবং বিশেষ উপহার নিশ্চিত করুন।" },
          { id: 't4', title: "পেমেন্ট রিমাইন্ডার", text: "আসসালামু আলাইকুম, আপনার পূর্বের অর্ডারের বকেয়া টাকা পরিশোধের জন্য সবিনয় অনুরোধ করা হলো। বিকাশে বা অফিসে এসে পেমেন্ট করতে পারেন। ধন্যবাদ।" }
        ]
      });
    }
  };

  const exportFullBackupJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      settings: settings,
      data: data
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mudran_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup.data || !backup.settings) {
          throw new Error("Invalid backup format");
        }

        if (confirm("সতর্কতা: ব্যাকআপ রিস্টোর করলে বর্তমান সকল ডাটা মুছে যাবে এবং ব্যাকআপ ডাটা দিয়ে প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?")) {
          setSettings(backup.settings);
          setters.setOrders(backup.data.orders || []);
          setters.setTransactions(backup.data.transactions || []);
          setters.setInventory(backup.data.inventory || []);
          setters.setCustomers(backup.data.customers || []);
          setters.setEmployees(backup.data.employees || []);
          setters.setPurchases(backup.data.purchases || []);
          alert("ডাটা সফলভাবে রিস্টোর করা হয়েছে!");
        }
      } catch (err) {
        alert("দুঃখিত, ফাইলটি সঠিক ব্যাকআপ ফাইল নয় অথবা ফাইলটি নষ্ট হয়ে গেছে।");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const inputClass = "w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-sm transition-all text-sm";
  const labelClass = "block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Settings className="text-cyan-600" size={24} /> সিস্টেম সেটিংস
          </h2>
          <p className="text-xs text-slate-400 font-medium">সফটওয়্যারের ব্রান্ডিং ও ডাটা ব্যাকআপ ম্যানেজ করুন</p>
        </div>
        <button 
          onClick={resetSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold text-xs"
        >
          <RefreshCcw size={14} /> ডিফল্ট রিসেট
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Branding Info - Compacter Grid */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Layout className="text-cyan-500" size={16} /> ব্রান্ডিং ইনফো
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}><Type size={14} /> সফটওয়্যার নাম</label>
              <input 
                type="text" 
                name="softwareName"
                className={inputClass} 
                value={settings.softwareName} 
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-4">
               <div>
                  <label className={labelClass}><ImageIcon size={14} /> লোগো আপলোড</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-cyan-200 transition-all overflow-hidden bg-slate-50 group"
                  >
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 group-hover:text-cyan-400 transition-colors" size={32} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}><Layout size={14} /> লোগো টেক্সট</label>
                <input 
                  type="text" 
                  name="logoText"
                  maxLength={1}
                  className={inputClass} 
                  value={settings.logoText} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelClass}><Palette size={14} /> থিম কালার</label>
                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input 
                    type="color" 
                    name="themeColor"
                    className="h-8 w-12 border-none bg-transparent cursor-pointer rounded overflow-hidden" 
                    value={settings.themeColor} 
                    onChange={handleChange}
                  />
                  <span className="font-mono text-slate-400 text-[10px] font-bold">{settings.themeColor}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}><FileText size={14} /> ইনভয়েস হেডার টেক্সট</label>
              <input 
                name="invoiceHeader"
                className={inputClass} 
                value={settings.invoiceHeader} 
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Templates - Compact Side List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5 flex flex-col">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
            <MessageCircle className="text-green-500" size={16} /> WhatsApp টেমপ্লেট
          </h3>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <input 
                type="text" 
                className={inputClass} 
                placeholder="টেমপ্লেট শিরোনাম" 
                value={templateTitle} 
                onChange={e => setTemplateTitle(e.target.value)} 
              />
              <textarea 
                className={inputClass + " h-20 resize-none"} 
                placeholder="মেসেজ বডি..." 
                value={templateText} 
                onChange={e => setTemplateText(e.target.value)}
              ></textarea>
              <button 
                onClick={handleSaveTemplate}
                className="w-full bg-slate-800 text-white py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm"
              >
                {editingTemplateId ? <Save size={14}/> : <Plus size={14}/>} {editingTemplateId ? 'আপডেট' : 'টেমপ্লেট যোগ'}
              </button>
            </div>
          </div>

          <div className="flex-1 max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {(settings.whatsappTemplates || []).map(template => (
              <div key={template.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex justify-between items-center group hover:border-green-200 transition-all">
                <div className="flex-1 overflow-hidden">
                  <h5 className="font-bold text-slate-700 text-xs truncate">{template.title}</h5>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{template.text}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditTemplate(template)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg"><Edit2 size={12}/></button>
                  <button onClick={() => handleDeleteTemplate(template.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Backup - Smart Horizontal Grid */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
         <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Database className="text-indigo-500" size={16} /> ডাটা ব্যাকআপ ও রিস্টোর
            </h3>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <ShieldCheck size={12} className="text-emerald-500" /> Secure Ready
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
               <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><CloudDownload size={16} /></div>
                  <h4 className="font-black text-slate-700 text-xs uppercase tracking-wider">সিস্টেম ব্যাকআপ</h4>
               </div>
               <div className="grid grid-cols-1 gap-2">
                  <button onClick={exportFullBackupJSON} className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">Download JSON</button>
                  <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestoreJSON} />
                  <button onClick={() => restoreInputRef.current?.click()} className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">Restore JSON</button>
               </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
               <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><FileSpreadsheet size={16} /></div>
                  <h4 className="font-black text-slate-700 text-xs uppercase tracking-wider">এক্সেল রিপোর্ট</h4>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => exportToCSV(data.orders, 'Orders')} className="py-2 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-cyan-600">Orders</button>
                  <button onClick={() => exportToCSV(data.customers, 'Customers')} className="py-2 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-cyan-600">Customers</button>
                  <button onClick={() => exportToCSV(data.inventory, 'Stock')} className="py-2 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-cyan-600">Stock</button>
                  <button onClick={() => exportToCSV(data.transactions, 'Finance')} className="py-2 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-cyan-600">Finance</button>
               </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 flex flex-col justify-between relative overflow-hidden">
               <div className="z-10">
                  <h4 className="font-black text-[11px] mb-1 flex items-center gap-1.5 uppercase tracking-wider">অটো-সেভ সক্রিয় <AlertCircle size={12} className="text-amber-400" /></h4>
                  <p className="text-[9px] text-slate-400 leading-tight font-medium">আপনার প্রতিটি পরিবর্তন সাথে সাথে লোকাল স্টোরেজে সেভ হচ্ছে।</p>
               </div>
               <div className="space-y-1.5 z-10">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                     <span>DB Health</span>
                     <span className="text-emerald-400">Excellent</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="w-full h-full bg-emerald-400"></div>
                  </div>
               </div>
               <Database size={48} className="absolute -bottom-2 -right-2 text-white/5" />
            </div>
         </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <p className="text-[10px] text-slate-400 font-bold italic">সফটওয়্যারের নতুন আপডেট বা কোনো ফিচারের জন্য আমাদের পরামর্শ দিন।</p>
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          Last Check: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
