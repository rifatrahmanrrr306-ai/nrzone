import React, { useState } from 'react';
import { ExternalLink, Plus, Trash2, CheckCircle, Clock, DollarSign, X, Search, Printer, MessageSquare, ArrowLeft } from 'lucide-react';
import { syncToSheet } from '../../utils/syncUtils';

const OutsideWorkPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel }) => {
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('active'); // 'active' or 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [payModal, setPayModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    const isAdmin = user?.role === 'admin';

    const [entryData, setEntryData] = useState({
        worker: '',
        task: '',
        borkaQty: '',
        hijabQty: '',
        rate: '',
        note: ''
    });

    const handleSaveIssue = () => {
        if (!entryData.worker || !entryData.task || (!entryData.borkaQty && !entryData.hijabQty)) {
            return showNotify('কারিগর, কাজ এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            task: entryData.task,
            borkaQty: Number(entryData.borkaQty || 0),
            hijabQty: Number(entryData.hijabQty || 0),
            rate: Number(entryData.rate || 0),
            note: entryData.note,
            status: 'Pending',
            receivedDate: null,
            totalAmount: 0,
            paidAmount: 0
        };

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: [newEntry, ...(prev.outsideWorkEntries || [])]
        }));

        syncToSheet({
            type: "OUTSIDE_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.task} - B:${newEntry.borkaQty} H:${newEntry.hijabQty}`,
            amount: 0
        });

        setShowModal(false);
        setEntryData({ worker: '', task: '', borkaQty: '', hijabQty: '', rate: '', note: '' });
        showNotify('বাইরের কাজ সফলভাবে ইস্যু হয়েছে!');
    };

    const handleReceive = (item) => {
        if (!window.confirm(`${item.worker}-এর কাজ জমা নিতে চান?`)) return;

        const totalAmount = (Number(item.borkaQty) + Number(item.hijabQty)) * Number(item.rate);

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === item.id ? {
                ...e,
                status: 'Received',
                receivedDate: new Date().toLocaleDateString('en-GB'),
                totalAmount: totalAmount
            } : e)
        }));

        syncToSheet({
            type: "OUTSIDE_RECEIVE",
            worker: item.worker,
            detail: `${item.task} Received - Total: ${totalAmount}`,
            amount: totalAmount
        });

        showNotify('কাজ জমা নেওয়া হয়েছে ও বিল জেনারেট হয়েছে!');
    };

    const handlePayment = () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) return;

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === payModal.id ? {
                ...e,
                paidAmount: Number(e.paidAmount || 0) + Number(paymentAmount)
            } : e)
        }));

        syncToSheet({
            type: "OUTSIDE_PAYMENT",
            worker: payModal.worker,
            detail: `Payment for ${payModal.task}`,
            amount: Number(paymentAmount)
        });

        setPayModal(null);
        setPaymentAmount('');
        showNotify('পেমেন্ট সফলভাবে রেকর্ড হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন ডিলিট করতে পারবেন!', 'error');
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: (prev.outsideWorkEntries || []).filter(item => item.id !== id)
        }));
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const filteredEntries = (masterData.outsideWorkEntries || []).filter(e =>
        e.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.task.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 bg-white p-4 premium-card rounded-3xl border-4 border-slate-50 shadow-xl w-full md:w-auto">
                        <div className="p-4 bg-rose-500 text-white rounded-xl shadow-2xl rotate-3 transition-transform hover:rotate-0">
                            <ExternalLink size={36} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Outside <span className="text-slate-100">Work</span></h2>
                            <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">Baire Deoya Kaj</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH WORKER/TASK..."
                            className="w-full bg-white pl-20 pr-8 py-8 rounded-full border-4 border-slate-50 shadow-xl font-black italic text-xs uppercase focus:border-black outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-black text-white px-12 py-8 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xl flex items-center gap-3 border-b-[12px] border-zinc-900">
                        <Plus size={24} strokeWidth={3} /> ISSUE WORK
                    </button>
                </div>
            </div>

            <div className="flex bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                {['active', 'history'].map(v => (
                    <button key={v} onClick={() => setView(v)} className={`flex-1 py-10 rounded-2xl font-black uppercase text-sm tracking-widest transition-all ${view === v ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>
                        {v === 'active' ? 'চলমান (Pending)' : 'সম্পন্ন কাজ (History)'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border-4 border-slate-50 overflow-hidden shadow-2xl">
                <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50">
                    <h3 className="text-3xl font-black uppercase italic text-black leading-none">{view === 'active' ? 'চলমান বাইরের কাজ' : 'পুরাতন রেকর্ড'}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left uppercase">
                        <thead className="bg-slate-50 text-slate-600 font-bold font-black text-xs font-bold tracking-[0.4em] italic border-b border-slate-100">
                            <tr>
                                <th className="px-12 py-8">WORKER / DATE</th>
                                <th className="px-12 py-8">TASK / DETAILS</th>
                                <th className="px-12 py-8 text-center">QUANTITY</th>
                                <th className="px-12 py-8 text-right">FINANCE / ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                            {(view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-all group italic">
                                    <td className="px-12 py-10">
                                        <p className="font-black text-2xl tracking-tighter text-black">{item.worker}</p>
                                        <p className="text-xs font-bold font-black text-slate-400 font-bold mt-2 tracking-widest">{item.date}</p>
                                    </td>
                                    <td className="px-12 py-10">
                                        <p className="font-black text-2xl italic tracking-tighter text-rose-500">{item.task}</p>
                                        <p className="text-xs font-bold font-black text-slate-600 font-bold mt-2 tracking-widest">RATE: ৳{item.rate} • {item.note || 'NO NOTE'}</p>
                                        {item.receivedDate && <p className="text-xs font-bold font-black text-emerald-500 mt-1 uppercase">Received: {item.receivedDate}</p>}
                                    </td>
                                    <td className="px-12 py-10 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex gap-3">
                                                <div className="text-center">
                                                    <p className="text-[11px] font-bold text-slate-500 font-bold">BORKA</p>
                                                    <p className="text-3xl font-black">{item.borkaQty}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] font-bold text-slate-500 font-bold">HIJAB</p>
                                                    <p className="text-3xl font-black">{item.hijabQty}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 text-right">
                                        <div className="flex flex-col items-end gap-3">
                                            {item.status === 'Pending' ? (
                                                <button onClick={() => handleReceive(item)} className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">জমা নিন</button>
                                            ) : (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase">Balance</p>
                                                    <p className="text-3xl font-black text-black">৳{(item.totalAmount - (item.paidAmount || 0)).toLocaleString()}</p>
                                                    <div className="flex gap-3 justify-end mt-2">
                                                        <button onClick={() => setPayModal(item)} className="p-4 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><DollarSign size={16} /></button>
                                                        {isAdmin && <button onClick={() => handleDelete(item.id)} className="p-4 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><Trash2 size={16} /></button>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 italic">
                    <div className="bg-white rounded-[5rem] w-full max-w-4xl border-4 border-black shadow-3xl animate-fade-up overflow-hidden max-h-[90vh] flex flex-col text-black">
                        <div className="p-4 border-b-2 border-slate-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-black uppercase text-4xl tracking-tighter">Baire Kaj Deoya (Issue)</h3>
                            <button onClick={() => setShowModal(false)} className="p-4 bg-white border-2 border-slate-100 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"><X size={24} /></button>
                        </div>

                        <div className="p-12 space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-600 font-bold uppercase tracking-widest ml-4">Worker / Karigor</label>
                                    <select className="form-input text-xl font-black border-2 border-slate-100 rounded-xl bg-gray-50 h-16 w-full px-6" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                        <option value="">Select Worker</option>
                                        {(masterData.outsideWorkers || []).map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-600 font-bold uppercase tracking-widest ml-4">Work / Task Type</label>
                                    <select className="form-input text-xl font-black border-2 border-slate-100 rounded-xl bg-gray-50 h-16 w-full px-6" value={entryData.task} onChange={(e) => setEntryData(p => ({ ...p, task: e.target.value }))}>
                                        <option value="">Select Task</option>
                                        {(masterData.outsideTasks || []).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase block mb-2">Borka (PCS)</label>
                                    <input type="number" className="w-full bg-transparent text-4xl font-black outline-none italic" placeholder="0" value={entryData.borkaQty} onChange={(e) => setEntryData(p => ({ ...p, borkaQty: e.target.value }))} />
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase block mb-2">Hijab (PCS)</label>
                                    <input type="number" className="w-full bg-transparent text-4xl font-black outline-none italic" placeholder="0" value={entryData.hijabQty} onChange={(e) => setEntryData(p => ({ ...p, hijabQty: e.target.value }))} />
                                </div>
                                <div className="bg-black p-5 rounded-2xl shadow-2xl">
                                    <label className="text-xs font-bold font-black text-white/40 uppercase block mb-2">Rate (Per PCS)</label>
                                    <input type="number" className="w-full bg-transparent text-4xl font-black text-white outline-none italic" placeholder="৳0" value={entryData.rate} onChange={(e) => setEntryData(p => ({ ...p, rate: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-600 font-bold uppercase tracking-widest ml-4">Note (Optional)</label>
                                <input type="text" className="form-input text-xl font-black border-2 border-slate-100 rounded-xl bg-gray-50 h-16 w-full px-8" placeholder="Enter notes..." value={entryData.note} onChange={(e) => setEntryData(p => ({ ...p, note: e.target.value }))} />
                            </div>
                        </div>

                        <div className="p-12 bg-gray-50 flex gap-3">
                            <button onClick={handleSaveIssue} className="flex-1 py-10 bg-rose-500 text-white rounded-full font-black text-2xl uppercase tracking-[0.2em] shadow-2xl border-b-[12px] border-rose-900 active:translate-y-2 transition-all">CONFIRM ISSUE</button>
                        </div>
                    </div>
                </div>
            )}

            {payModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-12 text-center space-y-8 animate-pulse-once">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-12">
                            <DollarSign size={40} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Pay {payModal.worker}</h3>
                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mt-2">{payModal.task} Bill</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold font-black text-slate-500 font-bold uppercase mb-2">Enter Amount</p>
                            <input type="number" autoFocus className="w-full text-center text-6xl font-black bg-transparent border-none outline-none tracking-tighter" placeholder="৳0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setPayModal(null)} className="flex-1 py-6 bg-slate-100 rounded-2xl font-black uppercase text-xs">Cancel</button>
                            <button onClick={handlePayment} className="flex-1 py-6 bg-black text-white rounded-2xl font-black uppercase text-xs shadow-xl">Confirm Pay</button>
                        </div>
                    </div>
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

export default OutsideWorkPanel;
