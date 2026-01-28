
import React, { useState } from 'react';
import { Role, User, Workspace, WorkspaceStatus } from '../types';
import { ShieldCheck, UserCircle, Briefcase, LogIn, PlusCircle, Building2, LayoutGrid, ShieldAlert, AlertCircle, Info, ChevronRight, Phone, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'CREATE_WORKSPACE' | 'SUPER_ADMIN'>('LOGIN');
  const [workspaceName, setWorkspaceName] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mock workspace storage for SaaS simulation
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('mudran_saas_workspaces');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || !userName.trim() || !mobileNumber.trim()) return;

    // Calculate 7 days expiry for Auto Trial
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const newWorkspace: Workspace = {
      id: Math.random().toString(36).substr(2, 9),
      name: workspaceName,
      ownerName: userName,
      ownerPhone: mobileNumber,
      createdAt: new Date().toISOString(),
      status: WorkspaceStatus.ACTIVE, // Auto active for trial
      subscriptionType: 'TRIAL',      // Automatically set as Trial
      expiryDate: expiry.toISOString(), // Set 7 days trial
      hasPressPrinting: true          // Enable press feature by default for trial
    };

    const updated = [...workspaces, newWorkspace];
    localStorage.setItem('mudran_saas_workspaces', JSON.stringify(updated));
    setWorkspaces(updated);

    setErrorMessage("অভিনন্দন! আপনার প্রতিষ্ঠানের জন্য ৭ দিনের ফ্রি ট্রায়াল সফলভাবে চালু হয়েছে। এখনই লগইন করে ড্যাশবোর্ড ব্যবহার শুরু করুন।");
    setView('LOGIN');
    // Pre-fill username for convenience
    setUserName(mobileNumber);
    setWorkspaceName('');
    setMobileNumber('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userName.trim()) return;

    if (view === 'SUPER_ADMIN') {
      onLogin({
        id: 'super-admin-id',
        name: 'System Super Admin',
        role: Role.SUPER_ADMIN,
        workspaceId: 'system-root'
      });
      return;
    }

    // Try to find by name, owner name, or phone
    const myWorkspace = workspaces.find(w => 
      w.ownerName === userName || 
      w.name === userName || 
      w.ownerPhone === userName
    );
    
    if (!myWorkspace) {
      setErrorMessage("দুঃখিত, এই নামে কোনো ওয়ার্কস্পেস পাওয়া যায়নি।");
      return;
    }

    if (myWorkspace.status === WorkspaceStatus.PENDING) {
      setErrorMessage("আপনার অ্যাকাউন্টটি এখনো পেন্ডিং অবস্থায় আছে। এপ্রুভালের জন্য অপেক্ষা করুন।");
      return;
    }

    if (myWorkspace.status === WorkspaceStatus.SUSPENDED) {
      setErrorMessage("আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে সুপার এডমিনের সাথে যোগাযোগ করুন।");
      return;
    }

    if (myWorkspace.expiryDate && new Date(myWorkspace.expiryDate) < new Date()) {
      setErrorMessage("আপনার সাবস্ক্রিপশন বা ট্রায়ালের মেয়াদ শেষ হয়ে গেছে। রিনিউ করতে সুপার এডমিনের সাথে যোগাযোগ করুন।");
      return;
    }

    onLogin({
      id: Date.now().toString(),
      name: myWorkspace.ownerName,
      role: role,
      workspaceId: myWorkspace.id
    });
  };

  const roleConfigs = [
    { role: Role.ADMIN, label: 'Admin', icon: ShieldCheck },
    { role: Role.MANAGER, label: 'Manager', icon: Briefcase },
    { role: Role.STAFF, label: 'Staff', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      {/* Secret Super Admin Access */}
      <button 
        onClick={() => setView('SUPER_ADMIN')}
        className="fixed top-6 right-6 text-slate-700 hover:text-slate-500 transition-colors p-2"
        title="Super Admin Login"
      >
        <ShieldAlert size={18} />
      </button>

      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 sm:p-10">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl mb-4 transition-all duration-300 ${view === 'SUPER_ADMIN' ? 'bg-red-600 shadow-red-500/20' : 'bg-cyan-600 shadow-cyan-500/20'}`}>
              {view === 'SUPER_ADMIN' ? <ShieldAlert size={32} /> : <LayoutGrid size={32} />}
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {view === 'SUPER_ADMIN' ? 'সিস্টেম এডমিন' : 'মুদ্রণ সহযোগী'}
            </h1>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
              {view === 'SUPER_ADMIN' ? 'Central Management' : 'Premium SaaS Printing Solutions'}
            </p>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 border text-[11px] font-bold leading-tight animate-in slide-in-from-top-2 ${
              errorMessage.includes("অভিনন্দন") || errorMessage.includes("সফলভাবে") 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              {errorMessage.includes("অভিনন্দন") ? <Sparkles className="shrink-0 mt-0.5" size={14} /> : <AlertCircle className="shrink-0 mt-0.5" size={14} />}
              <p>{errorMessage}</p>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button 
              onClick={() => { setView('LOGIN'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${view === 'LOGIN' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              প্রবেশ করুন
            </button>
            <button 
              onClick={() => { setView('CREATE_WORKSPACE'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${view === 'CREATE_WORKSPACE' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              নতুন ব্যবসা
            </button>
          </div>

          {(view === 'LOGIN' || view === 'SUPER_ADMIN') ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {view === 'SUPER_ADMIN' ? 'Admin User' : 'নাম / প্রতিষ্ঠানের নাম / মোবাইল'}
                </label>
                <div className="relative group">
                  <UserCircle className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    className="w-full p-3.5 pl-11 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-800 text-sm"
                    placeholder={view === 'SUPER_ADMIN' ? "Admin ID" : "মোবাইল নাম্বার দিন"}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {view === 'LOGIN' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">রোল নির্বাচন</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleConfigs.map((config) => (
                      <button
                        key={config.role}
                        type="button"
                        onClick={() => setRole(config.role)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                          role === config.role 
                          ? 'border-cyan-500 bg-cyan-50/50 text-cyan-700 shadow-sm' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <config.icon size={18} />
                        <span className="font-black text-[10px] uppercase tracking-wider">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs text-white ${
                  view === 'SUPER_ADMIN' ? 'bg-red-600 shadow-red-600/20' : 'bg-[#1e293b] shadow-slate-900/20'
                }`}
              >
                ড্যাশবোর্ডে প্রবেশ <LogIn size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateWorkspace} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">প্রতিষ্ঠানের নাম</label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    className="w-full p-3.5 pl-11 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-800 text-sm"
                    placeholder="যেমন: আল-মদিনা প্রিন্টিং"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">স্বত্বাধিকারীর নাম</label>
                <div className="relative group">
                  <UserCircle className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    className="w-full p-3.5 pl-11 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-800 text-sm"
                    placeholder="যেমন: জসিম উদ্দিন"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মোবাইল নাম্বার</label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={18} />
                  <input 
                    type="tel" 
                    className="w-full p-3.5 pl-11 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-800 text-sm"
                    placeholder="যেমন: ০১৭XXXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#1e293b] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
              >
                ৭ দিনের ফ্রি ট্রায়াল শুরু করুন <ChevronRight size={16} />
              </button>
              
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                 <Sparkles className="text-amber-600 shrink-0 mt-0.5" size={16} />
                 <p className="text-[10px] text-amber-800 font-bold leading-tight">নতুন ব্যবসা রেজিস্ট্রেশন করলে আপনি কোনো চার্জ ছাড়াই ৭ দিন মুদ্রণ সহযোগী ব্যবহার করতে পারবেন।</p>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Mudran Sahayogi &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
