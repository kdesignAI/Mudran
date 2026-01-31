
import React, { useState, useEffect } from 'react';
import { Role, User, Workspace, WorkspaceStatus, AppSettings } from '../types';
import { ShieldAlert, AlertCircle, MessageCircle, Facebook, Send, X, Lock, Key, Loader2 } from 'lucide-react';

const API_URL = './api.php';

interface LoginProps {
  onLogin: (user: User) => void;
  settings: AppSettings;
}

const Login: React.FC<LoginProps> = ({ onLogin, settings }) => {
  const [view, setView] = useState<'LOGIN' | 'CREATE_WORKSPACE' | 'SUPER_ADMIN'>('LOGIN');
  const [workspaceName, setWorkspaceName] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const fetchWorkspaces = async () => {
    try {
      const fullUrl = `${API_URL}?action=get_workspaces`;
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`API Fetch Error: ${response.status} at ${fullUrl}`);
        throw new Error(`HTTP ${response.status}: API not found.`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkspaces(data);
        return data;
      }
    } catch (err: any) {
      console.error("Error fetching workspaces:", err);
      setErrorMessage(`সার্ভারের সাথে যোগাযোগ বিচ্ছিন্ন (404)। এরর: ${err.message}`);
    }
    return [];
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const SYSTEM_SUPER_PASS = "admin77";

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || !userName.trim() || !mobileNumber.trim()) return;
    setLoading(true);
    setErrorMessage(null);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const newWorkspace = {
      id: Math.random().toString(36).substr(2, 9),
      name: workspaceName,
      ownerName: userName,
      ownerPhone: mobileNumber,
      status: WorkspaceStatus.ACTIVE,
      subscriptionType: 'TRIAL',
      expiryDate: expiry.toISOString()
    };

    try {
      const response = await fetch(`${API_URL}?action=create_workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkspace)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setErrorMessage("অভিনন্দন! আপনার ৭ দিনের ফ্রি ট্রায়াল চালু হয়েছে। এখন ইউজারনেম দিয়ে লগইন করুন।");
        setView('LOGIN');
        setUserName(mobileNumber); 
        await fetchWorkspaces(); 
      } else {
        setErrorMessage(result.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setErrorMessage(`সার্ভারের সাথে সংযোগ বিচ্ছিন্ন (404/500)। এরর: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (view === 'SUPER_ADMIN') {
      if (password === SYSTEM_SUPER_PASS) {
        onLogin({
          id: 'super-admin-id',
          name: 'System Super Admin',
          role: Role.SUPER_ADMIN,
          workspaceId: 'system-root'
        });
      } else {
        setErrorMessage("ভুল মাস্টার পাসওয়ার্ড! পুনরায় চেষ্টা করুন।");
      }
      return;
    }

    if (!userName.trim()) return;

    let currentWorkspaces = workspaces;
    if (workspaces.length === 0) {
      setLoading(true);
      currentWorkspaces = await fetchWorkspaces();
      setLoading(false);
    }

    const searchVal = userName.trim().toLowerCase();
    const myWorkspace = currentWorkspaces.find(w => 
      (w.ownerName && w.ownerName.toLowerCase() === searchVal) || 
      (w.name && w.name.toLowerCase() === searchVal) || 
      (w.ownerPhone && w.ownerPhone === searchVal) ||
      (w.ownerPhone && w.ownerPhone === userName.trim())
    );
    
    if (!myWorkspace) {
      setErrorMessage("দুঃখিত, কোনো ওয়ার্কস্পেস পাওয়া যায়নি। সঠিক তথ্য দিন অথবা নতুন একাউন্ট তৈরি করুন।");
      return;
    }

    if (myWorkspace.status === WorkspaceStatus.SUSPENDED) {
      setErrorMessage("আপনার একাউন্টটি বর্তমানে স্থগিত (Suspended) আছে।");
      return;
    }

    if (myWorkspace.expiryDate && new Date(myWorkspace.expiryDate) < new Date()) {
      setErrorMessage("সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে।");
      return;
    }

    onLogin({
      id: Date.now().toString(),
      name: myWorkspace.ownerName,
      role: role,
      workspaceId: myWorkspace.id
    });
  };

  const inputStyle = "w-full p-3.5 rounded-2xl bg-white shadow-sm border border-slate-100 outline-none focus:ring-4 focus:ring-cyan-500/10 text-slate-700 placeholder:text-slate-400 text-sm font-medium transition-all";
  const cardStyle = "w-full max-w-[380px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 sm:p-12 animate-in fade-in zoom-in duration-500 relative overflow-hidden";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <button 
        onClick={() => { setView(view === 'SUPER_ADMIN' ? 'LOGIN' : 'SUPER_ADMIN'); setErrorMessage(null); }}
        className="fixed top-8 right-8 text-slate-200 hover:text-slate-400 transition-all p-3 rounded-full hover:bg-white hover:shadow-sm"
        title="Admin Access"
      >
        <ShieldAlert size={20} />
      </button>

      <div className={cardStyle}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500"></div>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            {view === 'SUPER_ADMIN' ? <Lock size={32} /> : <Key size={32} />}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
            {view === 'LOGIN' ? 'লগইন করুন' : view === 'CREATE_WORKSPACE' ? 'নতুন একাউন্ট' : 'সিস্টেম কন্ট্রোল'}
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">মুদ্রণ সহযোগী - v2.5</p>
        </div>

        {errorMessage && (
          <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 border text-xs font-bold leading-relaxed animate-in slide-in-from-top-2 ${
            errorMessage.includes("অভিনন্দন") ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={view === 'CREATE_WORKSPACE' ? handleCreateWorkspace : handleLogin} className="space-y-4">
          {view === 'CREATE_WORKSPACE' && (
            <input 
              type="text" 
              className={inputStyle}
              placeholder="প্রতিষ্ঠানের নাম"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
          )}

          {view !== 'SUPER_ADMIN' ? (
            <input 
              type="text" 
              className={inputStyle}
              placeholder={view === 'CREATE_WORKSPACE' ? "স্বত্বাধিকারীর নাম" : "ইউজারনেম বা মোবাইল নম্বর"}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          ) : (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="relative">
                   <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                   <input 
                    type="password" 
                    className={inputStyle + " pl-12"}
                    placeholder="মাস্টার পাসওয়ার্ড দিন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
             </div>
          )}

          {view === 'CREATE_WORKSPACE' && (
            <input 
              type="tel" 
              className={inputStyle}
              placeholder="মোবাইল নাম্বার"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />
          )}

          {view === 'LOGIN' && (
            <div className="flex justify-between items-center px-2 py-1">
              <button type="button" onClick={() => { setView('CREATE_WORKSPACE'); setErrorMessage(null); }} className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:text-cyan-700">
                Register New Workspace
              </button>
            </div>
          )}

          {view === 'CREATE_WORKSPACE' && (
            <div className="flex justify-center px-2 py-1">
              <button type="button" onClick={() => { setView('LOGIN'); setErrorMessage(null); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-cyan-600">
                Back to Login
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-[0.97] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (view === 'CREATE_WORKSPACE' ? 'Create Workspace' : 'Continue')}
            {!loading && <ShieldAlert size={16} className={`transition-transform group-hover:scale-110 ${view === 'SUPER_ADMIN' ? 'text-rose-500' : 'text-cyan-500'}`} />}
          </button>
        </form>
        
        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-5">Connect With Developers</p>
          <div className="flex justify-center gap-4">
             <a href={settings.facebookPageLink} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 rounded-xl text-blue-600 hover:bg-blue-50"><Facebook size={20}/></a>
             <a href={settings.whatsappGroupLink} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 rounded-xl text-emerald-600 hover:bg-emerald-50"><MessageCircle size={20}/></a>
             <a href={settings.telegramChannelLink} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 rounded-xl text-sky-500 hover:bg-sky-50"><Send size={20}/></a>
          </div>
          <p className="mt-8 text-[8px] text-slate-300 font-bold uppercase">© 2025 মুদ্রণ সহযোগী SaaS</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
