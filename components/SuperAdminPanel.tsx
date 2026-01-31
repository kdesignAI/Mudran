
import React, { useState } from 'react';
import { Workspace, WorkspaceStatus, AppSettings } from '../types';
import { ShieldAlert, CheckCircle, Clock, Calendar, Search, Users, ExternalLink, Phone, Printer, ToggleLeft, ToggleRight, MessageCircle, Send, Bell, Tag, X, Sparkles, AlertTriangle, ShieldX, Facebook, Globe, Share2, Loader2 } from 'lucide-react';

interface SuperAdminPanelProps {
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const API_URL = './api.php';

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ workspaces, setWorkspaces, settings, setSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const saveWorkspaceToDB = async (updatedWorkspace: Workspace) => {
    setUpdatingId(updatedWorkspace.id);
    try {
      const response = await fetch(`${API_URL}?action=update_workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkspace)
      });
      const result = await response.json();
      if (result.status === 'success') {
        const updatedWorkspaces = workspaces.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w);
        setWorkspaces(updatedWorkspaces);
      } else {
        alert("Update failed: " + result.error);
      }
    } catch (err) {
      alert("Network error updating workspace");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = (workspaceId: string, newStatus: WorkspaceStatus) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      saveWorkspaceToDB({ ...workspace, status: newStatus });
    }
  };

  const togglePressFeature = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      saveWorkspaceToDB({ ...workspace, hasPressPrinting: !workspace.hasPressPrinting });
    }
  };

  const handleSetExpiry = (workspaceId: string, type: 'TRIAL' | '1_MONTH' | '6_MONTHS' | '1_YEAR') => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;

    const expiry = new Date();
    if (type === 'TRIAL') expiry.setDate(expiry.getDate() + 7);
    else if (type === '1_MONTH') expiry.setMonth(expiry.getMonth() + 1);
    else if (type === '6_MONTHS') expiry.setMonth(expiry.getMonth() + 6);
    else if (type === '1_YEAR') expiry.setFullYear(expiry.getFullYear() + 1);
    
    saveWorkspaceToDB({ 
      ...workspace, 
      status: WorkspaceStatus.ACTIVE, 
      expiryDate: expiry.toISOString(),
      subscriptionType: type
    });
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

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:row justify-between items-start sm:items-center gap-4">
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
                const isUpdating = updatingId === w.id;

                return (
                  <tr key={w.id} className={`hover:bg-slate-50 transition-colors ${isUpdating ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                          {isUpdating ? <Loader2 className="animate-spin" size={16} /> : w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{w.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{w.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600">
                      <div className="flex items-center gap-3">
                         <Phone size={14} className="text-slate-400" /> {w.ownerPhone}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => togglePressFeature(w.id)}
                        disabled={isUpdating}
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
                        w.subscriptionType === 'TRIAL' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {w.subscriptionType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600">
                      {w.expiryDate ? new Date(w.expiryDate).toLocaleDateString('bn-BD') : 'Not Set'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5">
                         <button disabled={isUpdating} onClick={() => handleSetExpiry(w.id, 'TRIAL')} className="px-2 py-1 bg-amber-50 rounded text-[8px] font-black uppercase disabled:opacity-50">৭ দিন</button>
                         <button disabled={isUpdating} onClick={() => handleSetExpiry(w.id, '1_MONTH')} className="px-2 py-1 bg-slate-100 rounded text-[8px] font-black uppercase disabled:opacity-50">১ মাস</button>
                         <button disabled={isUpdating} onClick={() => handleSetExpiry(w.id, '1_YEAR')} className="px-2 py-1 bg-slate-100 rounded text-[8px] font-black uppercase disabled:opacity-50">১ বছর</button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <div className="flex justify-center gap-2">
                          <button disabled={isUpdating} onClick={() => handleStatusChange(w.id, WorkspaceStatus.ACTIVE)} className="p-2 bg-green-50 text-green-600 rounded-lg disabled:opacity-50"><CheckCircle size={18}/></button>
                          <button disabled={isUpdating} onClick={() => handleStatusChange(w.id, WorkspaceStatus.SUSPENDED)} className="p-2 bg-red-50 text-red-600 rounded-lg disabled:opacity-50"><ShieldX size={18}/></button>
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
