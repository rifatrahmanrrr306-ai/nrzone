import React, { useState } from 'react';
import { DollarSign, Truck, Coffee, AlertCircle, Calendar, Printer, Plus, Trash2, CheckCircle, FileText, UserCheck, TrendingUp, X, ArrowLeft } from 'lucide-react';
import WorkerSummary from '../WorkerSummary';
import { syncToSheet } from '../../utils/syncUtils';

const ExpensePanel = ({ masterData, setMasterData, initialTab, showNotify, user, setActivePanel }) => {
    const isAdmin = user?.role === 'admin';
    const [selectedCategory, setSelectedCategory] = useState('Tea/Snacks');

    const getAllWorkerNames = () => {
        const cat = masterData.workerCategories || {};
        const all = [...(cat.sewing || []), ...(cat.stone || []), ...(cat.pata || []), ...(cat.monthly || [])];
        return [...new Set(all)];
    };
    const workerNames = getAllWorkerNames();
    const [activeTab, setActiveTab] = useState(initialTab || 'daily'); // daily, cashIn, worker, invoice, report
    const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);

    const expenses = masterData.expenses || [];
    const cashEntries = masterData.cashEntries || [];

    const totalCashIn = cashEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalExpenses = expenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const currentBalance = totalCashIn - totalExpenses;

    const dailyExpenses = expenses.filter(e => e.date === summaryDate);
    const dailyTotal = dailyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const handleAddExpense = (e) => {
        e.preventDefault();
        const form = e.target;
        const amount = Number(form.amount.value);
        if (amount <= 0) return showNotify('সঠিক টাকার পরিমাণ লিখুন!', 'error');

        const newExpense = {
            id: Date.now(),
            date: form.date.value,
            description: form.description.value,
            category: form.category.value,
            amount,
            type: 'expense'
        };

        setMasterData(prev => ({ ...prev, expenses: [newExpense, ...(prev.expenses || [])] }));

        syncToSheet({
            type: "EXPENSE_OUT",
            detail: `${newExpense.category}: ${newExpense.description}`,
            amount: newExpense.amount
        });

        form.reset();
        showNotify(`${amount} টাকা খরচ হয়েছে!`);
    };

    const handleAddCash = (e) => {
        e.preventDefault();
        const form = e.target;
        const amount = Number(form.amount.value);

        const newEntry = {
            id: Date.now(),
            date: form.date.value,
            source: form.source.value,
            amount: amount,
            type: 'cash_in'
        };

        setMasterData(prev => ({ ...prev, cashEntries: [newEntry, ...(prev.cashEntries || [])] }));

        syncToSheet({
            type: "CASH_IN",
            detail: newEntry.source,
            amount: newEntry.amount
        });

        form.reset();
        showNotify(`${amount} টাকা ক্যাশ জমা হয়েছে!`);
    };

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex items-center gap-3">
                <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Finance <span className="text-slate-400 font-bold">Vault</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-black"><DollarSign size={80} /></div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">Cash Balance</p>
                        <button onClick={() => setActiveTab('cashIn')} className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg">+ Deposit</button>
                    </div>
                    <h3 className={`text-6xl font-black italic tracking-tighter ${currentBalance >= 0 ? 'text-black' : 'text-rose-500'}`}>৳{currentBalance.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl">
                    <p className="text-xs font-bold font-black text-rose-500/40 uppercase tracking-widest mb-4">Total Expenses</p>
                    <h3 className="text-5xl font-black text-rose-500 italic tracking-tighter">৳{totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="bg-black p-12 rounded-3xl text-white shadow-2xl border-4 border-zinc-900">
                    <p className="text-xs font-bold font-black text-white/40 uppercase tracking-widest mb-4">Revenue Flow</p>
                    <h3 className="text-5xl font-black italic tracking-tighter">৳{totalCashIn.toLocaleString()}</h3>
                </div>

            </div>

            <div className="flex bg-white p-3 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
                {[
                    { id: 'daily', label: 'Expenses' },
                    { id: 'cashIn', label: 'Revenue' },
                    { id: 'worker', label: 'Ledger' },
                    { id: 'invoice', label: 'Payroll' },
                    { id: 'report', label: 'Reports' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-10 py-8 rounded-2xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'daily' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl h-fit">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-4 bg-black text-white rounded-2xl shadow-xl"><TrendingUp size={24} /></div>
                            <h3 className="text-3xl font-black uppercase italic text-black">New Expense</h3>
                        </div>
                        <form onSubmit={handleAddExpense} className="space-y-8 uppercase">
                            <input name="date" type="date" className="form-input py-6 text-lg font-black bg-slate-50 border-slate-100 text-black" defaultValue={new Date().toISOString().split('T')[0]} required />
                            <select name="category" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="Tea/Snacks">Tea/Snacks</option>
                                <option value="Transport">Transport</option>
                                <option value="Worker Payment">Worker Payment</option>
                                <option value="Factory Rent">Factory Rent</option>
                                <option value="Electric Bill">Electric Bill</option>
                                <option value="Chemicals">Chemicals/Hardware</option>
                                <option value="Other">Other</option>
                            </select>

                            {selectedCategory === 'Worker Payment' ? (
                                <select name="description" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black">
                                    <option value="">Select Worker...</option>
                                    {workerNames.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            ) : (
                                <input name="description" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black" placeholder="Description..." required />
                            )}
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 shadow-inner">
                                <label className="text-xs font-bold text-slate-600 font-bold block mb-4 uppercase italic">Amount (৳)</label>
                                <input name="amount" type="number" className="w-full text-center text-7xl font-black bg-transparent border-none text-black outline-none" placeholder="0" required />
                            </div>
                            <button type="submit" className="w-full py-10 bg-black text-white rounded-full font-black text-xl uppercase tracking-widest border-b-[12px] border-zinc-900 hover:scale-[1.01] transition-all">SAVE EXPENSE</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-8 text-black">
                        <div className="bg-white p-5 rounded-2xl border-4 border-slate-50 shadow-xl flex justify-between items-center px-12">
                            <input type="date" value={summaryDate} onChange={(e) => setSummaryDate(e.target.value)} className="bg-transparent text-4xl font-black italic border-none outline-none leading-none h-auto text-black" />
                            <div className="text-right">
                                <p className="text-xs font-bold font-black text-slate-400 font-bold uppercase tracking-widest mb-1">Daily Total</p>
                                <p className="text-4xl font-black italic">৳{dailyTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {dailyExpenses.map(item => (
                                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-50 flex justify-between items-center group hover:border-black transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center font-black italic text-slate-400 font-bold border border-slate-100">{item.category[0]}</div>
                                        <div>
                                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">{item.category}</p>
                                            <p className="text-2xl font-black italic uppercase tracking-tighter">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-black flex items-center gap-3">
                                        <p className="text-3xl italic">৳{item.amount}</p>
                                        {isAdmin && (
                                            <button onClick={() => {
                                                if (confirm('Delete expense?')) {
                                                    setMasterData(prev => ({ ...prev, expenses: (prev.expenses || []).filter(e => e.id !== item.id) }));
                                                }
                                            }} className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'cashIn' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-up">
                    <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl h-fit">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl"><CheckCircle size={24} /></div>
                            <h3 className="text-3xl font-black uppercase italic text-black">Deposit Revenue</h3>
                        </div>
                        <form onSubmit={handleAddCash} className="space-y-8 uppercase">
                            <input name="date" type="date" className="form-input py-6 text-lg font-black bg-slate-50 border-slate-100 text-black" defaultValue={new Date().toISOString().split('T')[0]} required />
                            <input name="source" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black" placeholder="Source (e.g. Sales, Bank Transfer...)" required />
                            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100 shadow-inner">
                                <label className="text-xs font-bold text-emerald-400 block mb-4 uppercase italic">Amount (৳)</label>
                                <input name="amount" type="number" className="w-full text-center text-7xl font-black bg-transparent border-none text-emerald-600 outline-none placeholder-emerald-100" placeholder="0" required />
                            </div>
                            <button type="submit" className="w-full py-10 bg-emerald-500 text-white rounded-full font-black text-xl uppercase tracking-widest border-b-[12px] border-emerald-700 hover:scale-[1.01] transition-all italic">CONFIRM DEPOSIT</button>
                        </form>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl">
                            <h4 className="text-2xl font-black uppercase italic mb-5">Recent Revenue</h4>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {cashEntries.map(entry => (
                                    <div key={entry.id} className="bg-slate-50 p-5 rounded-2xl border border-white flex justify-between items-center group hover:border-emerald-500 transition-all shadow-sm">
                                        <div>
                                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">{entry.date}</p>
                                            <p className="text-2xl font-black italic uppercase tracking-tighter text-black">{entry.source}</p>
                                        </div>
                                        <div className="text-right font-black flex items-center gap-3">
                                            <p className="text-3xl italic text-emerald-600">+৳{entry.amount}</p>
                                            {isAdmin && (
                                                <button onClick={() => {
                                                    if (confirm('Delete entry?')) {
                                                        setMasterData(prev => ({ ...prev, cashEntries: (prev.cashEntries || []).filter(e => e.id !== entry.id) }));
                                                    }
                                                }} className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {cashEntries.length === 0 && (
                                    <div className="py-20 text-center text-slate-400 font-bold italic font-black uppercase tracking-widest">No entries yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'worker' && (
                <div className="p-4">
                    <WorkerSummary masterData={masterData} />
                </div>
            )}

            {activeTab === 'invoice' && (
                <div className="bg-white p-20 rounded-3xl border-4 border-slate-50 shadow-2xl text-center space-y-8">
                    <div className="w-24 h-24 bg-black text-white rounded-xl flex items-center justify-center mx-auto shadow-2xl">
                        <FileText size={48} />
                    </div>
                    <h3 className="text-4xl font-black uppercase italic text-black">Payroll Matrix</h3>
                    <p className="text-slate-600 font-bold font-black uppercase tracking-widest text-sm">Automated payroll generation active.</p>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="bg-white p-20 rounded-3xl border-4 border-slate-50 shadow-2xl text-center space-y-8">
                    <div className="w-24 h-24 bg-black text-white rounded-xl flex items-center justify-center mx-auto shadow-2xl">
                        <TrendingUp size={48} />
                    </div>
                    <h3 className="text-4xl font-black uppercase italic text-black">Financial Audit</h3>
                    <p className="text-slate-600 font-bold font-black uppercase tracking-widest text-sm">Real-time financial analytics reports generated.</p>
                </div>
            )}
            {/* Back Button Bottom */}
            <div className="pt-20 pb-10 flex justify-center">
                <button
                    onClick={() => setActivePanel('Overview')}
                    className="group relative flex items-center gap-3 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
                >
                    <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-widest text-black">ড্যাশবোর্ডে ফিরে যান</span>
                    <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};

export default ExpensePanel;
