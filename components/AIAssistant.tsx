
import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Copy, Share2, Check } from 'lucide-react';
import { generateMarketingContent, analyzeBusinessData } from '../services/geminiService';
import { Order, Transaction } from '../types';

interface AIAssistantProps {
  orders: Order[];
  transactions: Transaction[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ orders, transactions }) => {
  const [mode, setMode] = useState<'MARKETING' | 'ANALYSIS'>('MARKETING');
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleMarketingSubmit = async () => {
    if (!inputText) return;
    setLoading(true);
    setResponse('');
    const result = await generateMarketingContent(inputText);
    setResponse(result || 'No response');
    setLoading(false);
  };

  const handleAnalysis = async () => {
    setLoading(true);
    setResponse('');
    
    // Create a data summary string
    const totalSales = orders.reduce((a, b) => a + b.grandTotal, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
    const summary = `
      Total Sales: ${totalSales}
      Total Expense: ${totalExpense}
      Total Orders: ${orders.length}
      Pending Orders: ${orders.filter(o => o.status === 'PENDING').length}
    `;

    const result = await analyzeBusinessData(summary);
    setResponse(result || 'No response');
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Business Insight',
          text: response,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleCopy();
      alert("শেয়ার অপশন ব্রাউজারে নেই, টেক্সট কপি করা হয়েছে।");
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-purple-600" /> AI বিজনেস অ্যাসিস্ট্যান্ট
        </h2>
        <p className="text-slate-500">আপনার ব্যবসার প্রসারে এবং বিশ্লেষণে সাহায্যকারী</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setMode('MARKETING'); setResponse(''); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'MARKETING' ? 'bg-purple-600 text-white' : 'bg-white border text-slate-600'}`}
        >
          মার্কেটিং কন্টেন্ট
        </button>
        <button 
          onClick={() => { setMode('ANALYSIS'); setResponse(''); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'ANALYSIS' ? 'bg-purple-600 text-white' : 'bg-white border text-slate-600'}`}
        >
          ব্যবসায়িক পরামর্শ
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Input Area */}
        <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          {mode === 'MARKETING' ? (
            <>
              <h3 className="font-semibold mb-4 text-slate-700">কি ধরণের কন্টেন্ট চান?</h3>
              <textarea 
                className="w-full flex-1 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-200 outline-none mb-4"
                placeholder="উদাহরণ: নতুন বছরের ফ্লেক্স প্রিন্টিং এর উপর ১০% ডিসকাউন্ট অফার..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                onClick={handleMarketingSubmit}
                disabled={loading || !inputText}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />} তৈরি করুন
              </button>
            </>
          ) : (
            <div className="flex flex-col h-full justify-center text-center space-y-4">
              <div className="bg-purple-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-purple-600">
                <Sparkles size={32} />
              </div>
              <h3 className="font-semibold text-slate-700">অটোমেটিক অ্যানালিসিস</h3>
              <p className="text-sm text-slate-500">আপনার বর্তমান বিক্রয় এবং খরচের ডাটা বিশ্লেষণ করে উন্নতির জন্য ৩টি টিপস নিন।</p>
              <button 
                onClick={handleAnalysis}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 flex justify-center items-center gap-2 disabled:opacity-50 mt-auto"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'বিশ্লেষণ শুরু করুন'}
              </button>
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="flex-1 bg-slate-900 text-slate-100 p-6 rounded-xl shadow-inner overflow-y-auto font-mono text-sm leading-relaxed relative">
          {response ? (
            <>
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={handleShare}
                  className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Share"
                >
                  <Share2 size={16} />
                </button>
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy text"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="whitespace-pre-wrap pt-8">{response}</div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600">
              ফলাফল এখানে দেখা যাবে...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
