import React, { useState } from 'react';
import { FileText, Search, Printer, UserCheck, BarChart, Clock, Database, ArrowLeft } from 'lucide-react';
import WorkerSummary from '../WorkerSummary';
import WeeklyInvoice from '../WeeklyInvoice';
import BusinessIntel from '../BusinessIntel';

const ReportsPanel = ({ masterData, user, setActivePanel }) => {
    const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'intel' : 'summary');
    const [transactionTab, setTransactionTab] = useState('productions');
    const [search, setSearch] = useState('');
    const isWorker = user?.role === 'worker';
    const isAdmin = user?.role === 'admin';

    const filteredProductions = masterData.productions.filter(p => {
        const matchesUser = isWorker ? p.worker.toLowerCase() === user.name.toLowerCase() : true;
        const matchesSearch = p.worker.toLowerCase().includes(search.toLowerCase()) || p.design.toLowerCase().includes(search.toLowerCase());
        return matchesUser && matchesSearch;
    });

    const filteredCutting = masterData.cuttingStock.filter(c => c.design.toLowerCase().includes(search.toLowerCase()));

    const filteredPata = masterData.pataEntries.filter(e => {
        const matchesUser = isWorker ? e.worker.toLowerCase() === user.name.toLowerCase() : true;
        return matchesUser && e.worker.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-2xl">
                        <div className="p-4 bg-black text-white rounded-xl shadow-2xl rotate-3 hover:rotate-0 transition-transform">
                            <BarChart size={36} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Analytics <span className="text-slate-100">Hub</span></h2>
                            <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">DATA AUDIT & REPORTS</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
                {isAdmin && (
                    <button onClick={() => setActiveTab('intel')} className={`px-10 py-6 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'intel' ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>Intelligence</button>
                )}
                {!isAdmin && (
                    <button onClick={() => setActiveTab('summary')} className={`px-10 py-6 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'summary' ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>Ledger</button>
                )}
                <button onClick={() => setActiveTab('invoice')} className={`px-10 py-6 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'invoice' ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>Invoice Matrix</button>
                <button onClick={() => setActiveTab('transactions')} className={`px-10 py-6 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>Audit Log</button>
            </div>

            <div className="bg-white rounded-3xl border-4 border-slate-50 shadow-2xl overflow-hidden min-h-[60vh]">
                {activeTab === 'intel' && <BusinessIntel masterData={masterData} />}
                {activeTab === 'summary' && <WorkerSummary masterData={masterData} user={user} />}
                {activeTab === 'invoice' && <WeeklyInvoice masterData={masterData} user={user} />}
                {activeTab === 'transactions' && (
                    <div className="p-12 space-y-12">
                        <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b-2 border-slate-50 pb-12">
                            <div className="flex gap-3">
                                {['productions', 'cutting', 'pata'].map(t => (
                                    <button key={t} onClick={() => setTransactionTab(t)} className={`px-8 py-4 rounded-full text-xs font-bold font-black uppercase tracking-widest transition-all ${transactionTab === t ? 'bg-black text-white shadow-xl' : 'bg-slate-50 text-slate-600 font-bold hover:text-black'}`}>{t}</button>
                                ))}
                            </div>
                            <div className="flex-1 w-full max-w-md bg-white p-4 rounded-full flex items-center gap-3 px-8 border border-slate-100 shadow-inner">
                                <Search size={20} className="text-slate-400 font-bold" />
                                <input type="text" placeholder="Scanning..." className="bg-transparent font-black italic border-none outline-none leading-none h-auto w-full uppercase text-sm text-black placeholder:text-slate-100" value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-slate-50 text-xs font-bold font-black uppercase tracking-widest text-slate-600 font-bold italic">
                                    <tr>
                                        <th className="py-6 px-4">Date</th>
                                        <th className="py-6 px-4">Details</th>
                                        <th className="py-6 px-4 text-center">Status</th>
                                        <th className="py-6 px-4 text-right">Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactionTab === 'productions' && filteredProductions.map(p => (
                                        <tr key={p.id} className="text-sm font-black italic hover:bg-slate-50 transition-all">
                                            <td className="py-8 px-4 text-slate-400 font-bold">{p.date}</td>
                                            <td className="py-8 px-4 uppercase text-black">
                                                <p className="text-lg">{p.worker}</p>
                                                <p className="text-xs font-bold text-slate-600 font-bold">{p.design} ({p.color})</p>
                                            </td>
                                            <td className="py-8 px-4 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold font-black uppercase tracking-widest ${p.status === 'Received' ? 'bg-black text-white shadow-xl' : 'bg-slate-50 text-slate-600 font-bold border border-slate-100'}`}>{p.status}</span>
                                            </td>
                                            <td className="py-8 px-4 text-right text-2xl font-black italic tracking-tighter text-black">+{p.issueBorka + p.issueHijab}</td>
                                        </tr>
                                    ))}
                                    {transactionTab === 'cutting' && filteredCutting.map(c => (
                                        <tr key={c.id} className="text-sm font-black italic hover:bg-slate-50 transition-all">
                                            <td className="py-8 px-4 text-slate-400 font-bold">{c.date}</td>
                                            <td className="py-8 px-4 uppercase text-black">
                                                <p className="text-lg">{c.design}</p>
                                                <p className="text-xs font-bold text-slate-600 font-bold">{c.color}</p>
                                            </td>
                                            <td className="py-8 px-4 text-center"><span className="px-4 py-1.5 rounded-full text-[11px] font-bold font-black uppercase tracking-widest bg-black text-white shadow-xl">CUTTING</span></td>
                                            <td className="py-8 px-4 text-right text-4xl font-black italic tracking-tighter leading-none text-black">+{c.borka + c.hijab}</td>
                                        </tr>
                                    ))}
                                    {transactionTab === 'pata' && filteredPata.map(e => (
                                        <tr key={e.id} className="text-sm font-black italic hover:bg-slate-50 transition-all">
                                            <td className="py-8 px-4 text-slate-400 font-bold">{e.date}</td>
                                            <td className="py-8 px-4 uppercase text-black">
                                                <p className="text-lg">{e.design}</p>
                                                <p className="text-xs font-bold text-slate-600 font-bold">{e.color} ({e.pataType})</p>
                                            </td>
                                            <td className="py-8 px-4 text-center"><span className="px-4 py-1.5 rounded-full text-[11px] font-bold font-black uppercase tracking-widest bg-black text-white shadow-xl">PATA</span></td>
                                            <td className="py-8 px-4 text-right text-4xl font-black italic tracking-tighter leading-none text-black">+{e.pataQty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
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

export default ReportsPanel;
