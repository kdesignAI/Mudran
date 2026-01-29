
import React, { useState } from 'react';
import { Role, User, Workspace, WorkspaceStatus, AppSettings } from '../types';
import { ShieldAlert, AlertCircle, MessageCircle, Facebook, Send, X } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  settings: AppSettings;
}

const Login: React.FC<LoginProps> = ({ onLogin, settings }) => {
  const [view, setView] = useState<'LOGIN' | 'CREATE_WORKSPACE' | 'SUPER_ADMIN'>('LOGIN');
  const [workspaceName, setWorkspaceName] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('mudran_saas_workspaces');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || !userName.trim() || !mobileNumber.trim()) return;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const newWorkspace: Workspace = {
      id: Math.random().toString(36).substr(2, 9),
      name: workspaceName,
      ownerName: userName,
      ownerPhone: mobileNumber,
      createdAt: new Date().toISOString(),
      status: WorkspaceStatus.ACTIVE,
      subscriptionType: 'TRIAL',
      expiryDate: expiry.toISOString(),
      hasPressPrinting: true
    };

    const updated = [...workspaces, newWorkspace];
    localStorage.setItem('mudran_saas_workspaces', JSON.stringify(updated));
    setWorkspaces(updated);

    setErrorMessage("অভিনন্দন! আপনার ৭ দিনের ফ্রি ট্রায়াল চালু হয়েছে। লগইন করুন।");
    setView('LOGIN');
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

    const myWorkspace = workspaces.find(w => 
      w.ownerName === userName || 
      w.name === userName || 
      w.ownerPhone === userName
    );
    
    if (!myWorkspace) {
      setErrorMessage("দুঃখিত, কোনো ওয়ার্কস্পেস পাওয়া যায়নি।");
      return;
    }

    if (myWorkspace.status === WorkspaceStatus.SUSPENDED) {
      setErrorMessage("অ্যাকাউন্টটি স্থগিত করা হয়েছে।");
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

  // Compact styles for smarter look
  const inputStyle = "w-full p-3 rounded-2xl bg-white shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-700 placeholder:text-slate-400 text-sm font-medium transition-all";
  const cardStyle = "w-full max-w-[350px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 sm:p-10 animate-in fade-in zoom-in duration-500";

  const socialLinks = [
    { icon: MessageCircle, color: 'text-emerald-500', link: settings.whatsappGroupLink, label: 'WhatsApp' },
    { icon: Facebook, color: 'text-blue-600', link: settings.facebookPageLink, label: 'Facebook' },
    { icon: Send, color: 'text-sky-500', link: settings.telegramChannelLink, label: 'Telegram' }
  ];

  return (
    <div className="min-h-screen bg-[#f1f3f5] flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <button 
        onClick={() => setView('SUPER_ADMIN')}
        className="fixed top-6 right-6 text-slate-300 hover:text-slate-400 transition-colors p-2"
        title="Admin Access"
      >
        <ShieldAlert size={16} />
      </button>

      <div className={cardStyle}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-cyan-600 tracking-tight leading-none">
            {view === 'LOGIN' ? 'Sign In' : view === 'CREATE_WORKSPACE' ? 'Register' : 'Admin'}
          </h1>
        </div>

        {errorMessage && (
          <div className={`p-3 rounded-xl mb-6 flex items-start gap-2 border text-[10px] font-bold leading-snug animate-in slide-in-from-top-1 ${
            errorMessage.includes("অভিনন্দন") ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <AlertCircle className="shrink-0 mt-0.5" size={12} />
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

          <input 
            type="text" 
            className={inputStyle}
            placeholder={view === 'CREATE_WORKSPACE' ? "স্বত্বাধিকারীর নাম" : "মোবাইল বা নাম দিন"}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />

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
            <div className="flex justify-between items-center px-1">
              <button type="button" onClick={() => setView('CREATE_WORKSPACE')} className="text-[10px] font-black text-cyan-500 uppercase tracking-tight hover:text-cyan-600">
                New Workspace?
              </button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight cursor-help">Forgot?</span>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-200 hover:shadow-xl active:scale-[0.96] transition-all"
          >
            {view === 'CREATE_WORKSPACE' ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Join with us</p>
          <div className="flex justify-center gap-4">
            {socialLinks.map((social, idx) => (
              <a 
                key={idx} 
                href={social.link || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white border border-slate-50 shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 hover:border-cyan-100 transition-all"
              >
                <social.icon size={18} className={social.color} />
              </a>
            ))}
          </div>
          
          <button 
            onClick={() => setView(view === 'CREATE_WORKSPACE' ? 'LOGIN' : 'CREATE_WORKSPACE')}
            className="mt-8 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-cyan-500 transition-colors"
          >
            User Licence Agreement
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
