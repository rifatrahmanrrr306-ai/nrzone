import React, { useState } from 'react';
import { Grid, Plus, Trash2, Box, X, Search, Scissors, CheckCircle, Minus, Printer, ArrowLeft, Settings, DollarSign, History, Layers } from 'lucide-react';
import { syncToSheet } from '../../utils/syncUtils';

const PataFactoryPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel }) => {
    const isAdmin = user?.role === 'admin';
    const [view, setView] = useState('active'); // active, history, payments
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [printSlip, setPrintSlip] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [editPataModal, setEditPataModal] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [ledgerModal, setLedgerModal] = useState(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [entryData, setEntryData] = useState({
        worker: '',
        design: '',
        color: '',
        size: '',
        lotNo: '',
        pataType: 'Single',
        pataQty: '',
        borkaQty: '',
        hijabQty: '',
        stonePackets: '',
        paperRolls: '',
        note: ''
    });
    const [manualForm, setManualForm] = useState({
        design: '',
        color: '',
        pataType: 'Single',
        qty: '',
        note: ''
    });

    const workers = masterData.workerCategories?.pata || [];

    const colorMap = {
        "অলিভ": "bg-[#556b2f]",
        "জাম": "bg-[#4b0082]",
        "ব্লু": "bg-[#0000ff]",
        "বিস্কুট": "bg-[#ffe4c4]",
        "কালো": "bg-[#000000]",
        "সাদা": "bg-[#ffffff]",
        "নুড": "bg-[#e3bc9a]",
        "মেরুন": "bg-[#800000]",
        "কফি": "bg-[#6f4e37]",
        "পিত": "bg-[#ffd700]",
        "পানি": "bg-[#f0f8ff]",
        "মাস্টার": "bg-[#daa520]"
    };

    const getWorkerDue = (name) => {
        let earnings = 0;
        const prods = (masterData.pataEntries || []).filter(p => p.worker === name && p.status === 'Received');
        prods.forEach(p => {
            earnings += Number(p.amount || 0);
        });
        const paid = (masterData.workerPayments || []).filter(p => p.worker === name && p.dept === 'pata').reduce((s, p) => s + Number(p.amount), 0);
        return earnings - paid;
    };

    const handleConfirmPayment = (e) => {
        e.preventDefault();
        const amount = Number(e.target.amount.value);
        const date = e.target.date.value ? new Date(e.target.date.value).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        if (amount <= 0) return;

        const newPayment = {
            id: Date.now(),
            date,
            worker: payModal,
            dept: 'pata',
            amount,
            note: e.target.note.value
        };

        setMasterData(prev => ({
            ...prev,
            workerPayments: [newPayment, ...(prev.workerPayments || [])]
        }));

        syncToSheet({
            type: "WORKER_PAYMENT",
            worker: payModal,
            amount,
            detail: `Pata payment`
        });

        setPayModal(null);
        showNotify('পেমেন্ট সফল ভাবে রেকর্ড করা হয়েছে!');
    };

    const rawStock = React.useMemo(() => {
        const stock = { stone: 0, roll: 0 };
        (masterData.rawInventory || []).forEach(log => {
            if (log.item.toLowerCase().includes('stone')) {
                if (log.type === 'in') stock.stone += Number(log.qty);
                else stock.stone -= Number(log.qty);
            }
            if (log.item.toLowerCase().includes('roll')) {
                if (log.type === 'in') stock.roll += Number(log.qty);
                else stock.roll -= Number(log.qty);
            }
        });
        return stock;
    }, [masterData.rawInventory]);

    const availableLots = React.useMemo(() => {
        const completedLots = new Set((masterData.pataEntries || [])
            .filter(e => e.status === 'Received')
            .map(e => e.lotNo));

        return (masterData.productions || [])
            .filter(p => !completedLots.has(p.lotNo)) // Filter out received lots
            .map(p => ({
                lotNo: p.lotNo,
                design: p.design,
                color: p.color,
                qty: Math.max(Number(p.receivedBorka || 0), Number(p.issueBorka || 0)) // Use available qty
            }));
    }, [masterData.productions, masterData.pataEntries]);

    const handleSaveIssue = () => {
        if (!entryData.worker || !entryData.design || !entryData.lotNo || !entryData.pataQty) {
            return showNotify('কারিগর, ডিজাইন, লট নম্বর এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            design: entryData.design,
            color: entryData.color || 'N/A',
            size: entryData.size || 'N/A',
            lotNo: entryData.lotNo,
            pataType: entryData.pataType,
            pataQty: Number(entryData.pataQty),
            borkaQty: Number(entryData.borkaQty || 0),
            hijabQty: Number(entryData.hijabQty || 0),
            stonePackets: Number(entryData.stonePackets || 0),
            paperRolls: Number(entryData.paperRolls || 0),
            status: 'Pending',
            note: entryData.note
        };

        setMasterData(prev => {
            const newInventory = [...(prev.rawInventory || [])];

            if (newEntry.stonePackets > 0) {
                newInventory.unshift({
                    id: Date.now() + 1,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "Stone Packet",
                    qty: newEntry.stonePackets,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Lot: ${newEntry.lotNo})`
                });
            }
            if (newEntry.paperRolls > 0) {
                newInventory.unshift({
                    id: Date.now() + 2,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "Paper Roll",
                    qty: newEntry.paperRolls,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Lot: ${newEntry.lotNo})`
                });
            }

            return {
                ...prev,
                pataEntries: [newEntry, ...(prev.pataEntries || [])],
                rawInventory: newInventory
            };
        });

        syncToSheet({
            type: "PATA_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.design}(${newEntry.color}) - ${newEntry.pataType}: ${newEntry.pataQty} Pcs (Stone: ${newEntry.stonePackets}, Paper: ${newEntry.paperRolls})`,
            amount: 0
        });

        setShowModal(false);
        setPrintSlip(newEntry);
        setEntryData({ worker: '', design: '', color: '', size: '', lotNo: '', pataType: 'Single', pataQty: '', borkaQty: '', hijabQty: '', stonePackets: '', paperRolls: '', note: '' });
        showNotify('পাতা কাজ সফলভাবে ইস্যু হয়েছে এবং স্টক সমন্বয় করা হয়েছে!');
    };

    const handleReceive = (e) => {
        e.preventDefault();
        const item = receiveModal;
        const receivedQty = Number(e.target.rQty.value || item.pataQty);
        const rate = masterData.pataRates?.[item.pataType] || 0;
        const amount = receivedQty * rate;

        setMasterData(prev => ({
            ...prev,
            pataEntries: prev.pataEntries.map(e => e.id === item.id ? {
                ...e,
                status: 'Received',
                receivedQty: receivedQty,
                amount: amount,
                receiveDate: new Date().toLocaleDateString('en-GB')
            } : e)
        }));

        const updatedItem = { ...item, status: 'Received', receivedQty, amount, receiveDate: new Date().toLocaleDateString('en-GB') };
        setPrintSlip(updatedItem);

        syncToSheet({
            type: "PATA_RECEIVE",
            worker: item.worker,
            detail: `${item.design}(${item.pataType}) - ${receivedQty} Pcs`,
            amount: amount
        });

        setReceiveModal(null);
        showNotify('পাতা কাজ সফলভাবে জমা নেওয়া হয়েছে!');
    };

    const handleEditPataSave = (e) => {
        e.preventDefault();
        const f = e.target;
        const updated = {
            ...editPataModal,
            worker: f.worker.value,
            design: f.design.value,
            color: f.color.value,
            lotNo: f.lotNo.value,
            pataType: f.pataType.value,
            pataQty: Number(f.qty.value),
            stonePackets: Number(f.stone.value),
            paperRolls: Number(f.roll.value),
            status: f.status.value,
            note: f.note.value
        };

        setMasterData(prev => ({
            ...prev,
            pataEntries: prev.pataEntries.map(ent => ent.id === updated.id ? updated : ent)
        }));

        setEditPataModal(null);
        showNotify('হিসাব আপডেট করা হয়েছে (Admin Power)!');
    };

    const handleManualStockIn = (e) => {
        e.preventDefault();
        if (!manualForm.design || !manualForm.qty) {
            return showNotify('ডিজাইন এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-GB'),
            worker: 'Manual/Owner',
            design: manualForm.design,
            color: manualForm.color || 'N/A',
            lotNo: 'MANUAL',
            pataType: manualForm.pataType,
            pataQty: Number(manualForm.qty),
            status: 'Received',
            receiveDate: new Date().toLocaleDateString('en-GB'),
            note: manualForm.note || 'Manual Stock Entry'
        };

        setMasterData(prev => ({
            ...prev,
            pataEntries: [newEntry, ...(prev.pataEntries || [])]
        }));

        syncToSheet({
            type: "PATA_MANUAL_STOCK",
            worker: "Manual",
            detail: `${manualForm.design}(${manualForm.pataType}) - ${manualForm.qty} Pcs`,
            amount: 0
        });

        setShowManualModal(false);
        setManualForm({ design: '', color: '', pataType: 'Single', qty: '', note: '' });
        showNotify('সরাসরি স্টক যোগ করা হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            pataEntries: (prev.pataEntries || []).filter(item => item.id !== id)
        }));
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const filteredEntries = (masterData.pataEntries || []).filter(e =>
        e.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.design.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.lotNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    if (printSlip) {
        return (
            <div className="min-h-screen bg-black text-white p-12 italic font-outfit">
                <style>{`@media print { .no-print { display: none; } }`}</style>
                <div className="flex justify-between items-center mb-4 no-print">
                    <button onClick={() => setPrintSlip(null)} className="bg-white text-black px-10 py-4 rounded-full font-black uppercase text-xs">বন্ধ করুন</button>
                    <button onClick={() => window.print()} className="bg-amber-500 text-white px-10 py-4 rounded-full font-black uppercase text-xs">স্লিপ প্রিন্ট করুন</button>
                </div>
                <div className="max-w-2xl mx-auto border border-white/20 p-16 rounded-3xl text-center bg-zinc-900 shadow-3xl">
                    <h1 className="text-6xl font-black italic tracking-tighter mb-4 text-white">NRZONE PRO</h1>
                    <p className="text-sm font-black uppercase tracking-[0.5em] text-gray-500 mb-4 border-y border-white/5 py-4">PATA WORK DISPATCH</p>

                    <div className="grid grid-cols-2 gap-3 text-left mb-4">
                        <div className="space-y-2">
                            <p className="text-xs font-bold font-black text-gray-500 uppercase tracking-widest">Worker Name</p>
                            <p className="text-3xl font-black uppercase text-white">{printSlip.worker}</p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-xs font-bold font-black text-amber-500 uppercase tracking-widest">Lot Number</p>
                            <p className="text-4xl font-black uppercase text-amber-500">#{printSlip.lotNo}</p>
                        </div>
                    </div>

                    <div className="space-y-8 text-left bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <span className="text-xl font-black text-gray-400 uppercase">Design:</span>
                            <span className="text-4xl font-black italic text-white">{printSlip.design}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-gray-400 uppercase">Type:</span>
                            <span className="text-4xl font-black italic text-amber-500">{printSlip.pataType}</span>
                        </div>
                    </div>

                    <div className="mt-4 bg-white text-black p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase mb-2 tracking-[0.3em]">Total Quantity (PCS)</p>
                            <p className="text-8xl font-black italic tracking-tighter">{printSlip.pataQty}</p>
                        </div>
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                            <Grid size={120} />
                        </div>
                    </div>

                    <div className="mt-16 pt-10 border-t border-white/5 flex justify-between items-center opacity-40 italic text-white">
                        <p className="text-xs font-bold font-black uppercase underline decoration-amber-500 decoration-4">Worker Signature</p>
                        <p className="text-xs font-bold font-black uppercase">{printSlip.date}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit selection:bg-amber-600">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-xl w-full md:w-auto">
                        <div className="p-4 bg-amber-600 text-white rounded-xl shadow-amber-500/20 shadow-2xl rotate-3 transition-transform hover:rotate-0">
                            <Grid size={36} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Pata <span className="text-slate-400 font-bold">Unit</span></h2>
                            <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">WORKER OPS</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 font-bold group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH WORKER/LOT..."
                            className="w-full bg-slate-50 pl-20 pr-8 py-8 rounded-full border-4 border-white shadow-xl font-black italic text-xs text-black uppercase focus:border-slate-100 outline-none transition-all placeholder:text-slate-500 font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="bg-white rounded-2xl px-12 py-8 flex flex-col items-center md:items-end border-4 border-slate-50 shadow-xl min-w-[200px]">
                        <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-1">TOTAL PENDING</p>
                        <p className="text-4xl font-black italic tracking-tighter text-amber-500 leading-none">
                            {activeEntries.reduce((sum, item) => sum + Number(item.pataQty || 0), 0).toLocaleString()}
                            <span className="text-xs font-bold not-italic text-slate-400 font-bold ml-2">PCS</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowManualModal(true)} className="bg-amber-50 text-amber-600 px-6 py-5 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 hover:text-white transition-all text-xs flex items-center gap-2 border border-amber-100">
                            <Box size={20} /> STOCK IN
                        </button>
                        <button onClick={() => setShowModal(true)} className="bg-black text-white px-8 py-5 rounded-xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2 border-b-4 border-zinc-900">
                            <Plus size={20} strokeWidth={3} /> ISSUE WORK
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex bg-white p-3 rounded-2xl border border-slate-100 shadow-inner w-full md:w-auto">
                {['active', 'history', isAdmin && 'payments'].filter(Boolean).map(v => (
                    <button key={v} onClick={() => setView(v)} className={`flex-1 px-8 py-5 rounded-xl font-black uppercase text-xs font-bold tracking-widest transition-all ${view === v ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>
                        {v === 'active' ? 'চলমান (Pending)' : v === 'history' ? 'সম্পন্ন কাজ (History)' : 'লেজার ও পেমেন্ট'}
                    </button>
                ))}
            </div>

            <div className="space-y-8">
                {view === 'payments' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workers.map((w, idx) => {
                            const due = getWorkerDue(w);
                            return (
                                <div key={idx} className="bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-xl flex flex-col justify-between h-72 group hover:border-black transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-5 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                                        <DollarSign size={140} className="text-black" />
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black italic uppercase leading-none mb-3 text-black group-hover:text-black transition-colors">{w}</h4>
                                        <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">Total Due (পাওনা)</p>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="flex items-baseline gap-2">
                                            <p className={`text-5xl font-black italic tracking-tighter leading-none ${due > 0 ? 'text-black' : 'text-slate-400 font-bold'}`}>৳{due.toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setLedgerModal(w)}
                                                className="p-5 bg-slate-50 text-slate-600 font-bold rounded-lg border border-slate-100 hover:bg-black hover:text-white transition-all shadow-xl"
                                                title="View Ledger"
                                            >
                                                <History size={24} />
                                            </button>
                                            <button
                                                onClick={() => setPayModal(w)}
                                                className="p-5 bg-black text-white rounded-lg shadow-2xl hover:scale-110 active:scale-95 transition-all border-b-[8px] border-zinc-900"
                                                title="Make Payment"
                                            >
                                                <DollarSign size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        {activeEntries.length === 0 && view === 'active' && (
                            <div className="h-[400px] flex flex-col items-center justify-center text-slate-600 font-bold gap-3">
                                <Box size={80} strokeWidth={1} className="opacity-20" />
                                <p className="text-xs font-bold font-black uppercase tracking-[0.8em] opacity-40">NO PATA WORK ASSIGNED</p>
                            </div>
                        )}
                        <div className="space-y-6">
                            {(view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                                <div key={idx} className="bg-white p-5 md:p-4 rounded-2xl border-4 border-slate-50 shadow-2xl flex items-center justify-between group hover:border-black transition-all relative overflow-hidden italic">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold border border-slate-100 text-xl font-black italic shadow-inner group-hover:bg-black group-hover:text-white transition-all">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black italic uppercase leading-none mb-1 text-black">{item.design} <span className="text-slate-600 font-bold text-base not-italic">({item.worker})</span></h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-black uppercase tracking-widest ${item.status === 'Received' ? 'bg-black text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>LOT: #{item.lotNo}</span>
                                                <span className="text-[10px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest">{item.color} • {item.size || 'N/A'}</span>
                                                <span className="text-[10px] font-bold font-black text-slate-400 font-bold uppercase tracking-widest">• {item.date}</span>
                                            </div>
                                            <p className="text-[10px] font-bold font-black text-amber-500 mt-1 uppercase tracking-tighter italic opacity-60">S: {item.stonePackets || 0} • P: {item.paperRolls || 0} • B: {item.borkaQty || 0} • H: {item.hijabQty || 0}</p>
                                            {item.note && <p className="text-[9px] font-bold font-black text-indigo-400 capitalize tracking-widest mt-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 inline-block">{item.note}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-4xl font-black italic text-black tracking-tighter">{item.pataQty}</p>
                                            <p className="text-[10px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest">{item.pataType}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {item.status === 'Pending' ? (
                                                <button onClick={() => setReceiveModal(item)} className="px-8 py-3 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all border-b-4 border-zinc-900 leading-none">জমা নিন</button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="px-6 py-3 bg-emerald-50 text-emerald-500 rounded-full font-black uppercase text-[10px] tracking-widest border border-emerald-100 uppercase italic">সম্পন্ন</div>
                                                    <button onClick={() => setPrintSlip(item)} className="p-4 bg-white border-2 border-slate-50 text-black rounded-full hover:scale-110 transition-transform shadow-md"><Printer size={16} /></button>
                                                </div>
                                            )}
                                            {isAdmin && (
                                                <div className="flex gap-3">
                                                    <button onClick={() => setEditPataModal(item)} className="p-4 bg-slate-50 text-slate-600 font-bold rounded-full hover:bg-black hover:text-white transition-all shadow-md"><Settings size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-full shadow-md hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[200] flex items-center justify-center p-2 md:p-4 italic">
                    <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-6xl border-4 border-white shadow-3xl animate-fade-up overflow-hidden max-h-[96vh] flex flex-col text-black">
                        {/* Sticky Header */}
                        <div className="p-3 border-b border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-3 bg-amber-600 text-white rounded-xl shadow-2xl rotate-3">
                                    <Plus size={24} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-xl md:text-3xl tracking-tighter leading-none text-black">পাতা এন্ট্রি (ইস্যু)</h3>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 border border-slate-100 rounded-full hover:bg-black hover:text-white transition-all text-black shadow-sm"><X size={20} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-12 italic custom-scrollbar">
                            {/* Live Material Monitor */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3 flex-shrink-0">
                                <div className="bg-amber-50 p-4 md:p-4 rounded-2xl md:rounded-3xl border border-amber-100 flex flex-col justify-center">
                                    <p className="text-xs font-bold font-black text-amber-600 uppercase tracking-widest mb-1 italic">Stone Packets</p>
                                    <p className="text-2xl md:text-4xl font-black italic text-amber-600">{rawStock.stone}</p>
                                </div>
                                <div className="bg-blue-50 p-4 md:p-4 rounded-2xl md:rounded-3xl border border-blue-100 flex flex-col justify-center">
                                    <p className="text-xs font-bold font-black text-blue-600 uppercase tracking-widest mb-1 italic">Paper Rolls</p>
                                    <p className="text-2xl md:text-4xl font-black italic text-blue-600">{rawStock.roll}</p>
                                </div>
                                {entryData.design && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = (masterData.productions || []).filter(p => p.design === entryData.design && p.status === 'Received').reduce((s, p) => s + (p.receivedBorka || 0), 0);
                                                setEntryData(p => ({ ...p, pataQty: val }));
                                            }}
                                            className="bg-slate-50 p-4 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col justify-center text-left hover:border-black transition-all group/stock">
                                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-1 italic">Live Body (Borka)</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl md:text-4xl font-black italic text-black">
                                                    {(masterData.productions || [])
                                                        .filter(p => p.design === entryData.design && p.status === 'Received')
                                                        .reduce((s, p) => s + (p.receivedBorka || 0), 0)}
                                                </p>
                                                <Plus size={16} className="text-slate-500 font-bold group-hover/stock:text-black transition-colors" />
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = (masterData.productions || []).filter(p => p.design === entryData.design && p.status === 'Received').reduce((s, p) => s + (p.receivedHijab || 0), 0);
                                                setEntryData(p => ({ ...p, pataQty: val }));
                                            }}
                                            className="bg-emerald-50 p-4 md:p-4 rounded-2xl md:rounded-3xl border border-emerald-100 flex flex-col justify-center text-left hover:border-emerald-600 transition-all group/stock">
                                            <p className="text-xs font-bold font-black text-emerald-600 uppercase tracking-widest mb-1 italic">Live Body (Hijab)</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl md:text-4xl font-black italic text-emerald-600">
                                                    {(masterData.productions || [])
                                                        .filter(p => p.design === entryData.design && p.status === 'Received')
                                                        .reduce((s, p) => s + (p.receivedHijab || 0), 0)}
                                                </p>
                                                <Plus size={16} className="text-emerald-300 group-hover/stock:text-emerald-600 transition-colors" />
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6 flex-1 italic custom-scrollbar">
                                {/* Group 1: Identity & Context */}
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1 h-6 bg-black rounded-full"></div>
                                        <h4 className="text-base font-black uppercase tracking-widest text-black">১. কারিগর ও ডিজাইন (Identity)</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-3">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-600 font-bold uppercase ml-4 tracking-widest flex items-center gap-1"><Scissors size={12} /> কারিগর</label>
                                            <select className="form-input text-lg font-black border border-slate-100 rounded-lg bg-white h-14 text-black px-4 focus:border-black outline-none appearance-none" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                                <option value="">কারিগর নির্বাচন করুন</option>
                                                {(masterData.workerCategories?.pata || []).map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-600 font-bold uppercase ml-6 tracking-widest flex items-center gap-2"><Box size={14} /> ডিজাইন (Style)</label>
                                            <select className="form-input text-xl md:text-2xl font-black border border-slate-100 rounded-lg md:rounded-xl bg-white h-20 md:h-24 text-black px-6 focus:border-black outline-none appearance-none" value={entryData.design} onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}>
                                                <option value="">ডিজাইন পছন্দ করুন</option>
                                                {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-600 font-bold uppercase ml-6 tracking-widest flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-600" /> কালার (Color)</label>
                                            <select className="form-input text-xl md:text-2xl font-black border border-slate-100 rounded-lg md:rounded-xl bg-white h-20 md:h-24 text-black px-6 focus:border-black outline-none appearance-none" value={entryData.color} onChange={(e) => setEntryData(p => ({ ...p, color: e.target.value }))}>
                                                <option value="">কালার পছন্দ করুন</option>
                                                {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-600 font-bold uppercase ml-6 tracking-widest flex items-center gap-2">সাইজ (Size)</label>
                                            <input className="form-input text-xl md:text-2xl font-black border border-slate-100 rounded-lg md:rounded-xl bg-white h-20 md:h-24 text-black px-6 focus:border-black outline-none" placeholder="32, 34..." value={entryData.size} onChange={(e) => setEntryData(p => ({ ...p, size: e.target.value }))} />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-600 font-bold uppercase ml-6 tracking-widest flex items-center gap-2"># লট (Auto Selection)</label>
                                            <select
                                                className="form-input text-xl md:text-2xl font-black border border-slate-100 rounded-lg md:rounded-xl bg-white h-20 md:h-24 text-black px-6 focus:border-black outline-none appearance-none"
                                                value={entryData.lotNo}
                                                onChange={(e) => {
                                                    const selectedLot = availableLots.find(l => l.lotNo === e.target.value);
                                                    if (selectedLot) {
                                                        setEntryData(p => ({
                                                            ...p,
                                                            lotNo: selectedLot.lotNo,
                                                            design: selectedLot.design,
                                                            color: selectedLot.color,
                                                            pataQty: selectedLot.qty
                                                        }));
                                                    } else {
                                                        setEntryData(p => ({ ...p, lotNo: e.target.value }));
                                                    }
                                                }}
                                            >
                                                <option value="">লট নির্বাচন করুন</option>
                                                {availableLots.map(l => (
                                                    <option key={l.lotNo} value={l.lotNo}>
                                                        #{l.lotNo} - {l.design} ({l.color})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[12px] font-black text-slate-600 font-bold uppercase ml-6 tracking-widest flex items-center gap-2">পাতা ধরণ (Variant)</label>
                                            <select className="form-input text-xl md:text-2xl font-black border border-slate-100 rounded-lg md:rounded-xl bg-white h-20 md:h-24 text-black px-6 uppercase focus:border-black outline-none appearance-none" value={entryData.pataType} onChange={(e) => setEntryData(p => ({ ...p, pataType: e.target.value }))}>
                                                {(masterData.pataTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Materials */}
                                <div className="bg-amber-50/10 p-4 rounded-xl border border-amber-500/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                                        <h4 className="text-base font-black uppercase tracking-widest text-amber-600">২. কাঁচামাল প্রদান</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-3">
                                        <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-2xl border-2 border-slate-50 relative group overflow-hidden shadow-sm">
                                            <label className="text-xs font-black text-slate-600 font-bold uppercase tracking-widest italic mb-4 block">পাথর প্যাকেট (Stone Packet)</label>
                                            <div className="flex items-end gap-2">
                                                <input type="number" className="bg-transparent text-4xl md:text-6xl font-black text-black w-full outline-none italic placeholder:text-slate-100" placeholder="0" value={entryData.stonePackets} onChange={(e) => setEntryData(p => ({ ...p, stonePackets: e.target.value }))} />
                                                <span className="text-xl font-black text-slate-500 font-bold mb-2 italic uppercase">Pkt</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-2xl border-2 border-slate-50 relative group overflow-hidden shadow-sm">
                                            <label className="text-xs font-black text-slate-600 font-bold uppercase tracking-widest italic mb-4 block">পেপার রোল (Paper Roll)</label>
                                            <div className="flex items-end gap-2">
                                                <input type="number" className="bg-transparent text-4xl md:text-6xl font-black text-black w-full outline-none italic placeholder:text-slate-100" placeholder="0" value={entryData.paperRolls} onChange={(e) => setEntryData(p => ({ ...p, paperRolls: e.target.value }))} />
                                                <span className="text-xl font-black text-slate-500 font-bold mb-2 italic uppercase">Roll</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Final Quantity */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-3">
                                    <div className="bg-black text-white p-6 rounded-2xl shadow-3xl text-center space-y-2 relative overflow-hidden">
                                        <label className="text-[10px] font-bold font-black text-amber-500 uppercase tracking-widest italic leading-none block">মোট পাতা (Total)</label>
                                        <input type="number" className="w-full text-center text-4xl font-black bg-transparent border-none outline-none leading-none h-12 text-white placeholder:text-white/10" placeholder="0" value={entryData.pataQty} onChange={(e) => setEntryData(p => ({ ...p, pataQty: e.target.value }))} />
                                    </div>
                                    <div className="bg-emerald-950 text-white p-5 md:p-12 rounded-xl md:rounded-3xl shadow-3xl text-center space-y-4 relative overflow-hidden">
                                        <label className="text-xs font-bold font-black text-emerald-500 uppercase tracking-[0.3em] italic leading-none block">বোরকা (Borka)</label>
                                        <input type="number" className="w-full text-center text-5xl md:text-7xl font-black bg-transparent border-none outline-none leading-none h-16 md:h-24 text-white placeholder:text-white/10" placeholder="0" value={entryData.borkaQty} onChange={(e) => setEntryData(p => ({ ...p, borkaQty: e.target.value }))} />
                                        <div className="text-white/20 text-xs font-bold font-black uppercase tracking-widest leading-none">Exp. Borka Pcs</div>
                                    </div>
                                    <div className="bg-rose-950 text-white p-5 md:p-12 rounded-xl md:rounded-3xl shadow-3xl text-center space-y-4 relative overflow-hidden">
                                        <label className="text-xs font-bold font-black text-rose-500 uppercase tracking-[0.3em] italic leading-none block">হিজাব (Hijab)</label>
                                        <input type="number" className="w-full text-center text-5xl md:text-7xl font-black bg-transparent border-none outline-none leading-none h-16 md:h-24 text-white placeholder:text-white/10" placeholder="0" value={entryData.hijabQty} onChange={(e) => setEntryData(p => ({ ...p, hijabQty: e.target.value }))} />
                                        <div className="text-white/20 text-xs font-bold font-black uppercase tracking-widest leading-none">Exp. Hijab Pcs</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-8 border-t border-slate-100 bg-white flex flex-col md:flex-row gap-3 md:gap-3 flex-shrink-0">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 md:py-6 bg-slate-50 border border-slate-100 rounded-full font-black text-xs uppercase text-slate-600 font-bold hover:bg-black hover:text-white transition-all order-2 md:order-1">Cancel</button>
                            <button onClick={handleSaveIssue} className="flex-[3] py-5 md:py-8 bg-amber-600 text-white rounded-full font-black text-lg md:text-2xl uppercase tracking-widest shadow-2xl shadow-amber-600/20 hover:scale-[1.01] transition-all order-1 md:order-2 border-b-8 border-amber-800">
                                CONFIRM & PRINT SLIP
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {receiveModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-lg border-4 border-white shadow-3xl animate-fade-up overflow-hidden flex flex-col text-black italic font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="p-4 md:p-4 border-b-2 border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
                            <div>
                                <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">কাজ জমা নিন</h3>
                                <p className="text-[11px] font-bold md:text-xs font-bold text-slate-600 font-bold font-black uppercase tracking-widest mt-2">কারিগর: {receiveModal.worker}</p>
                            </div>
                            <button onClick={() => setReceiveModal(null)} className="p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-10 custom-scrollbar">
                            <form id="receiveForm" onSubmit={handleReceive} className="space-y-12 text-center">
                                <div className="bg-slate-50 p-4 md:p-14 rounded-2xl md:rounded-[4.5rem] shadow-inner border border-slate-100">
                                    <label className="text-xs font-bold text-slate-600 font-bold font-black uppercase mb-4 block tracking-widest">Received Quantity (PCS)</label>
                                    <input name="rQty" type="number" defaultValue={receiveModal.pataQty} className="w-full text-center text-6xl md:text-9xl font-black bg-transparent border-none text-black outline-none leading-none h-32 md:h-48" autoFocus />
                                </div>
                                <p className="text-xs font-bold font-black text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed">পাক্কা পাতা পিস জমা নিন। কোনো ড্যামেজ বা কমতি থাকলে তা অটো রেকর্ড হবে।</p>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-6 border-t-2 border-slate-50 bg-white flex flex-col sm:flex-row gap-3 flex-shrink-0 font-black italic">
                            <button onClick={() => setReceiveModal(null)} className="flex-1 py-4 md:py-5 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs tracking-widest hover:text-black transition-all">Cancel</button>
                            <button form="receiveForm" type="submit" className="flex-[2] py-4 md:py-6 bg-black text-white rounded-full uppercase text-lg md:text-xl shadow-2xl border-b-8 border-zinc-900 hover:scale-[1.02] active:scale-95 transition-all">Confirm Receive</button>
                        </div>
                    </div>
                </div>
            )}
            {showManualModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-2xl border-4 border-white shadow-3xl animate-fade-up overflow-hidden flex flex-col text-black italic font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="p-4 md:p-4 border-b-2 border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 md:gap-3 text-left">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-600 rounded-[1.2rem] md:rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
                                    <Box size={24} className="md:w-[32px] md:h-[32px]" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-3xl font-black uppercase italic text-black leading-none tracking-tighter">Direct Stock In</h3>
                                    <p className="text-[11px] font-bold md:text-xs font-bold font-black text-slate-600 font-bold tracking-[0.2em] uppercase mt-1 italic">সরাসরি পাতা স্টক যোগ করুন</p>
                                </div>
                            </div>
                            <button onClick={() => setShowManualModal(false)} className="p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-10 custom-scrollbar italic">
                            <form id="manualForm" onSubmit={handleManualStockIn} className="space-y-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold ml-6 uppercase tracking-widest leading-none">DESIGN (ডিজাইন)</label>
                                        <select className="w-full text-xl md:text-2xl py-6 bg-slate-50 border border-slate-100 rounded-xl px-8 font-black uppercase text-black appearance-none focus:border-black outline-none h-20 md:h-24" value={manualForm.design} onChange={e => setManualForm(p => ({ ...p, design: e.target.value }))}>
                                            <option value="">SELECT DESIGN</option>
                                            {masterData.designs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold ml-6 uppercase tracking-widest leading-none">COLOR (কালার)</label>
                                        <select className="w-full text-xl md:text-2xl py-6 bg-slate-50 border border-slate-100 rounded-xl px-8 font-black uppercase text-black appearance-none focus:border-black outline-none h-20 md:h-24" value={manualForm.color} onChange={e => setManualForm(p => ({ ...p, color: e.target.value }))}>
                                            <option value="">SELECT COLOR</option>
                                            {masterData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 md:p-14 rounded-2xl md:rounded-[4.5rem] border border-slate-100 text-center shadow-inner">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-[0.2em] block mb-4">Quantity (পাক্কা পাতা পিস)</label>
                                    <input type="number" className="w-full text-center text-6xl md:text-9xl font-black bg-transparent border-none outline-none leading-none h-32 md:h-48 text-black" placeholder="0" value={manualForm.qty} onChange={e => setManualForm(p => ({ ...p, qty: e.target.value }))} autoFocus />
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-8 border-t-2 border-slate-50 bg-white flex flex-col sm:flex-row gap-3 md:gap-3 flex-shrink-0 font-black italic">
                            <button onClick={() => setShowManualModal(false)} className="flex-1 py-4 md:py-6 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs tracking-widest hover:text-black transition-all order-2 sm:order-1">Cancel</button>
                            <button form="manualForm" type="submit" className="flex-[2] py-4 md:py-6 bg-black text-white rounded-full uppercase text-lg md:text-xl shadow-2xl border-b-8 border-zinc-900 hover:scale-[1.01] active:scale-95 transition-all order-1 sm:order-2">ADD TO STOCK</button>
                        </div>
                    </div>
                </div>
            )}
            {editPataModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-4xl border-4 border-white shadow-3xl animate-fade-up overflow-hidden flex flex-col text-black italic font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-4 md:p-4 border-b-2 border-slate-50 bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 md:gap-3">
                                <div className="p-4 md:p-4 bg-amber-600 text-white rounded-[1.2rem] md:rounded-xl shadow-xl rotate-3">
                                    <Settings size={32} className="md:w-[40px] md:h-[40px]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic text-black leading-none">Pata <span className="text-slate-400 font-bold">Override</span></h3>
                                    <p className="text-[11px] font-bold md:text-xs font-bold font-black text-slate-600 font-bold tracking-[0.4em] uppercase mt-1 italic leading-none">Admin Control Center</p>
                                </div>
                            </div>
                            <button onClick={() => setEditPataModal(null)} className="p-4 bg-slate-50 border border-slate-100 rounded-full hover:bg-black hover:text-white transition-all text-black shadow-sm flex-shrink-0"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-12 custom-scrollbar italic">
                            <form id="editForm" onSubmit={handleEditPataSave} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-12 font-black uppercase">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest">Worker (কারিগর)</label>
                                    <select name="worker" defaultValue={editPataModal.worker} className="w-full text-xl md:text-2xl font-black py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-8 focus:border-black outline-none transition-all appearance-none shadow-sm text-black">
                                        {(masterData.workerCategories?.pata || []).map(w => <option key={w} value={w}>{w}</option>)}
                                        <option value="Manual/Owner">Manual/Owner</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest">Design (ডিজাইন)</label>
                                    <select name="design" defaultValue={editPataModal.design} className="w-full text-xl md:text-2xl font-black py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-8 focus:border-black outline-none transition-all appearance-none shadow-sm text-black">
                                        {masterData.designs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest">Color & Lot</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select name="color" defaultValue={editPataModal.color} className="w-full text-xl md:text-2xl font-black py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-8 focus:border-black outline-none transition-all appearance-none shadow-sm text-black">
                                            {masterData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <input name="lotNo" defaultValue={editPataModal.lotNo} className="w-full text-xl md:text-2xl font-black py-6 md:py-8 bg-black text-white border-none rounded-lg md:rounded-xl px-8 focus:ring-4 ring-black/5 outline-none transition-all text-center" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest">Status & Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select name="status" defaultValue={editPataModal.status} className="w-full text-xl md:text-2xl font-black py-6 md:py-8 bg-black text-white border-none rounded-lg md:rounded-xl px-8 focus:ring-4 ring-black/5 outline-none transition-all appearance-none">
                                            <option value="Pending">PENDING</option>
                                            <option value="Received">RECEIVED</option>
                                        </select>
                                        <select name="pataType" defaultValue={editPataModal.pataType} className="w-full text-xl md:text-2xl font-black py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-8 focus:border-black outline-none transition-all appearance-none shadow-sm text-black">
                                            {(masterData.pataTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="md:col-span-2 bg-slate-50/50 p-4 md:p-12 rounded-xl md:rounded-3xl border-2 border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="text-center space-y-4 pb-6 sm:pb-0 sm:border-r-2 border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 font-bold block tracking-widest leading-none">PATA QTY</label>
                                        <input name="qty" type="number" defaultValue={editPataModal.pataQty} className="w-full text-center text-4xl md:text-6xl bg-transparent outline-none font-black italic text-black leading-none" />
                                    </div>
                                    <div className="text-center space-y-4 pb-6 sm:pb-0 sm:border-r-2 border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 font-bold block tracking-widest leading-none">STONE PKT</label>
                                        <input name="stone" type="number" defaultValue={editPataModal.stonePackets} className="w-full text-center text-4xl md:text-6xl bg-transparent outline-none font-black italic text-black leading-none" />
                                    </div>
                                    <div className="text-center space-y-4">
                                        <label className="text-xs font-bold text-slate-500 font-bold block tracking-widest leading-none">PAPER ROLL</label>
                                        <input name="roll" type="number" defaultValue={editPataModal.paperRolls} className="w-full text-center text-4xl md:text-6xl bg-transparent outline-none font-black italic text-black leading-none" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest">Special Note (রিমার্কস)</label>
                                    <textarea name="note" defaultValue={editPataModal.note} className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl p-5 italic outline-none focus:border-black text-black text-xl shadow-sm" placeholder="প্রয়োজনীয় তথ্য লিখুন..." />
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col sm:flex-row gap-3 md:gap-3 flex-shrink-0 font-black italic">
                            <button onClick={() => setEditPataModal(null)} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs tracking-widest hover:text-black transition-all order-2 sm:order-1">Close</button>
                            <button form="editForm" type="submit" className="flex-[3] py-6 md:py-10 bg-black text-white rounded-full uppercase text-xl md:text-3xl tracking-[0.2em] shadow-2xl border-b-[16px] border-zinc-900 hover:scale-[1.01] transition-all order-1 sm:order-2">SAVE CHANGES</button>
                        </div>
                    </div>
                </div>
            )}
            {payModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-lg border-4 border-white shadow-3xl animate-fade-up overflow-hidden flex flex-col italic font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="p-5 md:p-12 text-center bg-white border-b-2 border-slate-50 flex-shrink-0">
                            <h3 className="text-3xl md:text-6xl font-black uppercase italic text-black leading-none mb-4">বেতন প্রদান</h3>
                            <div className="inline-block px-8 py-3 bg-black text-white rounded-full text-xs font-bold md:text-sm tracking-widest uppercase font-black italic">{payModal}</div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-14 space-y-12 custom-scrollbar">
                            <form id="paymentForm" onSubmit={handleConfirmPayment} className="space-y-12">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest text-center block leading-none">তারিখ (Date)</label>
                                            <input name="date" type="date" className="w-full py-6 bg-slate-50 border border-slate-100 rounded-lg md:rounded-[2.2rem] text-[12px] md:text-lg font-black italic px-8 text-black focus:border-black outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest text-center block leading-none">টাকার পরিমাণ (Amount)</label>
                                            <input name="amount" type="number" className="w-full h-24 md:h-28 text-center text-4xl md:text-6xl font-black bg-emerald-50 text-emerald-600 border-none rounded-lg md:rounded-[2.2rem] px-6 focus:ring-8 focus:ring-emerald-100 shadow-inner" placeholder="৳" required autoFocus />
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest ml-6 block italic leading-none">রিমার্কস / শর্ট নোট (Note)</label>
                                        <input name="note" className="w-full py-6 md:py-8 text-sm md:text-xl font-black bg-slate-50 border border-slate-100 text-black placeholder:text-slate-400 font-bold italic uppercase px-10 rounded-lg md:rounded-[2.2rem] focus:border-black outline-none shadow-sm" placeholder="প্রয়োজনীয় তথ্য লিখুন..." />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col sm:flex-row gap-3 md:gap-3 flex-shrink-0 font-black italic">
                            <button onClick={() => setPayModal(null)} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs tracking-widest hover:text-black transition-all order-2 sm:order-1">বাতিল (Cancel)</button>
                            <button form="paymentForm" type="submit" className="flex-[3] py-6 md:py-10 bg-black text-white rounded-full uppercase text-xl md:text-3xl shadow-2xl border-b-[16px] border-zinc-900 hover:scale-[1.01] transition-all order-1 sm:order-2">পেমেন্ট নিশ্চিত করুন</button>
                        </div>
                    </div>
                </div>
            )}
            {ledgerModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[400] flex items-center justify-center p-2 md:p-4 text-black font-outfit italic">
                    <div className="bg-white w-full max-w-5xl md:max-h-[96vh] rounded-2xl md:rounded-[4.5rem] border-4 border-slate-50 shadow-3xl flex flex-col overflow-hidden italic">
                        {/* Sticky Header */}
                        <div className="p-4 md:p-12 border-b-2 border-slate-50 flex justify-between items-center bg-white flex-shrink-0 animate-fade-down">
                            <div className="flex items-center gap-3 md:gap-3">
                                <div className="p-4 md:p-4 bg-black text-white rounded-[1.2rem] md:rounded-[2.2rem] shadow-xl rotate-3">
                                    <History size={32} className="md:w-[40px] md:h-[40px]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-5xl font-black uppercase italic text-black leading-none tracking-tighter">{ledgerModal} <span className="text-slate-400 font-bold">Ledger</span></h3>
                                    <p className="text-xs font-bold font-black text-slate-600 font-bold tracking-[0.4em] uppercase mt-2 md:mt-4 italic leading-none">Full Production & Payment History</p>
                                </div>
                            </div>
                            <button onClick={() => setLedgerModal(null)} className="p-4 md:p-4 bg-slate-50 border border-slate-100 rounded-full hover:bg-black hover:text-white transition-all shadow-sm text-black flex-shrink-0"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-4 md:p-12 flex-1 custom-scrollbar">
                            <div className="overflow-x-auto rounded-xl border-2 border-slate-50">
                                <table className="w-full text-left uppercase text-xs md:text-sm min-w-[600px]">
                                    <thead className="bg-slate-50 text-slate-600 font-bold font-black tracking-widest sticky top-0 z-10">
                                        <tr>
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-8 py-6">Description</th>
                                            <th className="px-8 py-6 text-right">Credit (Work)</th>
                                            <th className="px-8 py-6 text-right">Debit (Paid)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-black">
                                        {(masterData.pataEntries || []).filter(p => p.worker === ledgerModal && p.status === 'Received').map((p, i) => (
                                            <tr key={`inc_${i}`} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500 font-bold font-black">{p.receiveDate}</td>
                                                <td className="px-8 py-6 text-black group-hover:translate-x-2 transition-transform">{p.design} ({p.pataType}) - {p.receivedQty} Pcs</td>
                                                <td className="px-8 py-6 text-right text-emerald-500 text-lg">৳{p.amount}</td>
                                                <td className="px-8 py-6 text-right text-slate-100">-</td>
                                            </tr>
                                        ))}
                                        {(masterData.workerPayments || []).filter(p => p.worker === ledgerModal && p.dept === 'pata').map((p, i) => (
                                            <tr key={`exp_${i}`} className="hover:bg-rose-50/30 transition-colors group">
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500 font-bold font-black">{p.date}</td>
                                                <td className="px-8 py-6 text-rose-500 group-hover:translate-x-2 transition-transform">Payment {p.note ? `(${p.note})` : ''}</td>
                                                <td className="px-8 py-6 text-right text-slate-100">-</td>
                                                <td className="px-8 py-6 text-right text-rose-500 text-lg">৳{p.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-5 md:p-14 bg-black border-t-4 border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-3 text-xl font-black italic flex-shrink-0">
                            <div className="flex flex-col items-center md:items-start gap-1">
                                <span className="text-zinc-600 uppercase tracking-[0.3em] text-xs font-bold">Net Payable Due</span>
                                <span className="text-4xl md:text-6xl text-white tracking-tighter">৳{getWorkerDue(ledgerModal).toLocaleString()}</span>
                            </div>
                            <button onClick={() => { setLedgerModal(null); setPayModal(ledgerModal); }} className="w-full md:w-auto px-16 py-6 md:py-8 bg-white text-black rounded-full font-black uppercase text-sm md:text-lg tracking-widest shadow-2xl hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">PAY NOW</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .premium-card {
                    background: white;
                    border: 4px solid #f8fafc;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.1);
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: opacity(0.3);
                    cursor: pointer;
                }
            `}</style>
        </div >
    );
};

export default PataFactoryPanel;
