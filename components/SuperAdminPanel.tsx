
import React, { useState } from 'react';
import { Workspace, WorkspaceStatus, AppSettings } from '../types';
import { ShieldAlert, CheckCircle, XCircle, Clock, Calendar, Search, Users, ExternalLink, Phone, Printer, ToggleLeft, ToggleRight, MessageCircle, Send, Bell, Tag, X, Sparkles, AlertTriangle, ShieldX, Facebook, Globe, Share2 } from 'lucide-react';

interface SuperAdminPanelProps {
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ workspaces, setWorkspaces, settings, setSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const handleStatusChange = (workspaceId: string, newStatus: WorkspaceStatus) => {
    const updated = workspaces.map(w => {
      if (w.id === workspaceId) {
        return { ...w, status: newStatus };
      }
      return w;
    });
    setWorkspaces(updated);
    localStorage.setItem('mudran_saas_workspaces', JSON.stringify(updated));
  };

  const togglePressFeature = (workspaceId: string) => {
    const updated = workspaces.map(w => {
      if (w.id === workspaceId) {
        return { ...w, hasPressPrinting: !w.hasPressPrinting };
      }
      return w;
    });
    setWorkspaces(updated);
    localStorage.setItem('mudran_saas_workspaces', JSON.stringify(updated));
  };

  const handleSetExpiry = (workspaceId: string, type: 'TRIAL' | '1_MONTH' | '6_MONTHS' | '1_YEAR') => {
    const expiry = new Date();
    if (type === 'TRIAL') {
      expiry.setDate(expiry.getDate() + 7);
    } else if (type === '1_MONTH') {
      expiry.setMonth(expiry.getMonth() + 1);
    } else if (type === '6_MONTHS') {
      expiry.setMonth(expiry.getMonth() + 6);
    } else if (type === '1_YEAR') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    }
    
    const updated = workspaces.map(w => {
      if (w.id === workspaceId) {
        return { 
          ...w, 
          status: WorkspaceStatus.ACTIVE, 
          expiryDate: expiry.toISOString(),
          subscriptionType: type
        };
      }
      return w;
    });
    setWorkspaces(updated);
    localStorage.setItem('mudran_saas_workspaces', JSON.stringify(updated));
  };

  const handleGlobalSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const openWhatsApp = (msg?: string) => {
    if (!selectedWorkspace) return;
    const finalMsg = msg || customMessage;
    const phone = selectedWorkspace.ownerPhone;
    const formattedPhone = phone.startsWith('0') ? '88' + phone : phone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMsg)}`;
    window.open(whatsappUrl, '_blank');
    setIsMessageModalOpen(false);
    setCustomMessage('');
  };

  const filtered = workspaces.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.ownerPhone && w.ownerPhone.includes(searchTerm))
  );

  const getTrialDaysLeft = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const templates = [
    { 
      id: 'trial_followup', 
      label: 'ট্রায়াল আপগ্রেড রিমাইন্ডার (৫ম দিন)', 
      icon: Sparkles, 
      text: (name: string) => `আসসালামু আলাইকুম ${name}, মুদ্রণ সহযোগী-তে আপনার ৭ দিনের ফ্রি ট্রায়াল প্রায় শেষের দিকে। ৫ম দিন অতিবাহিত হয়েছে। আপনার ব্যবসা পরিচালনা সহজ করতে আজই ফুল ভার্সনে আপগ্রেড করুন। ধন্যবাদ।`
    },
    { 
      id: 'followup', 
      label: 'সাবস্ক্রিপশন ফলোআপ', 
      icon: Clock, 
      text: (name: string) => `আসসালামু আলাইকুম ${name}, মুদ্রণ সহযোগী থেকে আপনার সাবস্ক্রিপশন রিনিউ করার জন্য সবিনয় অনুরোধ করা হলো। রিনিউ না করলে আপনার সেবাটি বন্ধ হয়ে যেতে পারে। ধন্যবাদ।`
    },
    { 
      id: 'announcement', 
      label: 'সিস্টেম ঘোষণা', 
      icon: Bell, 
      text: (name: string) => `আসসালামু আলাইকুম ${name}, মুদ্রণ সহযোগী-তে নতুন কিছু বিশেষ ফিচার যুক্ত করা হয়েছে। আপনার ড্যাশবোর্ড চেক করার জন্য অনুরোধ করা হলো। ধন্যবাদ।`
    }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-600" /> সুপার এডমিন কন্ট্রোল প্যানেল
          </h2>
          <p className="text-slate-500 text-sm mt-1">সিস্টেম ইউজার, ফ্রি ট্রায়াল এবং সাবস্ক্রিপশন ম্যানেজমেন্ট</p>
        </div>
        <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-2xl border border-red-100 text-red-700 font-black text-xs uppercase tracking-widest">
           System Access: Super Admin Mode
        </div>
      </header>

      {/* Global Branding & Social Links */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            <Share2 className="text-cyan-600" size={20} />
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Platform Social Links (Login Page)</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-emerald-500" /> WhatsApp Group Link
               </label>
               <input 
                type="text" 
                name="whatsappGroupLink"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-medium"
                placeholder="https://chat.whatsapp.com/..."
                value={settings.whatsappGroupLink || ''}
                onChange={handleGlobalSettingChange}
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Facebook size={14} className="text-blue-600" /> Facebook Page/Group Link
               </label>
               <input 
                type="text" 
                name="facebookPageLink"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 outline-none text-xs font-medium"
                placeholder="https://facebook.com/..."
                value={settings.facebookPageLink || ''}
                onChange={handleGlobalSettingChange}
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Send size={14} className="text-sky-500" /> Telegram Channel Link
               </label>
               <input 
                type="text" 
                name="telegramChannelLink"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none text-xs font-medium"
                placeholder="https://t.me/..."
                value={settings.telegramChannelLink || ''}
                onChange={handleGlobalSettingChange}
               />
            </div>
         </div>
         <div className="mt-4 p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 flex items-center gap-2 text-[10px] font-bold text-cyan-700 italic">
            <Globe size={14} /> এই লিংকগুলো লগইন পেজের "Join with us" সেকশনে অটোমেটিক আপডেট হয়ে যাবে।
         </div>
      </div>

      {/* WhatsApp Message Modal */}
      {isMessageModalOpen && selectedWorkspace && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsMessageModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                <MessageCircle size={30} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">মেসেজ পাঠান</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedWorkspace.name} - {selectedWorkspace.ownerName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">কুইক টেমপ্লেট নির্বাচন করুন:</p>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(tmp => (
                  <button 
                    key={tmp.id}
                    onClick={() => openWhatsApp(tmp.text(selectedWorkspace.ownerName))}
                    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all text-left group"
                  >
                    <tmp.icon size={18} className="text-slate-400 group-hover:text-green-600" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-green-700">{tmp.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">কাস্টম মেসেজ:</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-green-500/10 outline-none h-24 resize-none transition-all"
                  placeholder="আপনার নিজস্ব মেসেজ এখানে লিখুন..."
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                />
                <button 
                  onClick={() => openWhatsApp()}
                  disabled={!customMessage.trim()}
                  className="w-full mt-4 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  মেসেজ পাঠান <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট কাস্টমার (Workspaces)</p>
            <p className="text-2xl font-black text-slate-800">{workspaces.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ফ্রি ট্রায়াল ইউজার</p>
            <p className="text-2xl font-black text-slate-800">{workspaces.filter(w => w.subscriptionType === 'TRIAL' && w.status === WorkspaceStatus.ACTIVE).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সক্রিয় প্রিমিয়াম (Active)</p>
            <p className="text-2xl font-black text-slate-800">{workspaces.filter(w => w.status === WorkspaceStatus.ACTIVE && w.subscriptionType !== 'TRIAL').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ব্যবসা, মালিক বা মোবাইল দিয়ে খুঁজুন..." 
                className="w-full pl-12 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">ব্যবসার নাম ও মালিক</th>
                <th className="px-8 py-5">মোবাইল নাম্বার</th>
                <th className="px-8 py-5 text-center">প্রেস ফিচার</th>
                <th className="px-8 py-5">প্যাকেজ</th>
                <th className="px-8 py-5">মেয়াদের তারিখ</th>
                <th className="px-8 py-5">সাবস্ক্রিপশন / আপগ্রেড</th>
                <th className="px-8 py-5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(w => {
                const daysLeft = getTrialDaysLeft(w.expiryDate);
                const isTrialNearEnd = w.subscriptionType === 'TRIAL' && daysLeft !== null && daysLeft <= 2; // 5th day onwards

                return (
                  <tr key={w.id} className={`hover:bg-slate-50 transition-colors ${isTrialNearEnd ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{w.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{w.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" />
                          {w.ownerPhone || 'N/A'}
                        </div>
                        {w.ownerPhone && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => { setSelectedWorkspace(w); setIsMessageModalOpen(true); }}
                              className={`p-1.5 rounded-lg transition-all ${isTrialNearEnd ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                              title={isTrialNearEnd ? "Send Upgrade Reminder" : "WhatsApp Message"}
                            >
                              <MessageCircle size={16} />
                            </button>
                            {isTrialNearEnd && (
                              <span className="animate-pulse flex items-center gap-1 text-[8px] font-black text-amber-600 uppercase tracking-tighter">
                                <AlertTriangle size={10} /> ৫+ দিন অতিবাহিত
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => togglePressFeature(w.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all mx-auto ${
                          w.hasPressPrinting ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {w.hasPressPrinting ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {w.hasPressPrinting ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${
                        w.subscriptionType === 'TRIAL' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        w.status === WorkspaceStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                        w.status === WorkspaceStatus.PENDING ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {w.subscriptionType === 'TRIAL' ? <Clock size={10}/> : <CheckCircle size={10}/>}
                        {w.subscriptionType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600">
                      {w.expiryDate ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(w.expiryDate).toLocaleDateString('bn-BD')}
                          </div>
                          {daysLeft !== null && (
                            <span className={`text-[8px] font-black uppercase mt-1 ${daysLeft <= 0 ? 'text-red-500' : daysLeft <= 2 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {daysLeft <= 0 ? 'মেয়াদ শেষ' : `${daysLeft} দিন বাকি`}
                            </span>
                          )}
                        </div>
                      ) : 'Not Set'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                         <button onClick={() => handleSetExpiry(w.id, 'TRIAL')} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-[8px] font-black text-amber-700 transition-all border border-amber-200">৭ দিন ট্রায়াল</button>
                         <button onClick={() => handleSetExpiry(w.id, '1_MONTH')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[8px] font-black text-slate-600 transition-all">১ মাস</button>
                         <button onClick={() => handleSetExpiry(w.id, '6_MONTHS')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[8px] font-black text-slate-600 transition-all">৬ মাস</button>
                         <button onClick={() => handleSetExpiry(w.id, '1_YEAR')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[8px] font-black text-slate-600 transition-all">১ বছর</button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <div className="flex justify-center gap-2">
                          {w.status !== WorkspaceStatus.ACTIVE ? (
                            <button 
                              onClick={() => handleStatusChange(w.id, WorkspaceStatus.ACTIVE)}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                              title="Approve / Activate"
                            >
                              <CheckCircle size={18} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusChange(w.id, WorkspaceStatus.SUSPENDED)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                              title="Suspend / Cancel Trial"
                            >
                              <ShieldX size={18} />
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
