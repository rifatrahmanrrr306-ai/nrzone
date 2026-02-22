import React, { useState } from 'react';
import { Scissors, Database, Plus, X, Archive, DollarSign, History, Printer, CheckCircle, Send, Minus, ArrowLeft, AlertCircle, User, Layers, Settings, Trash2 } from 'lucide-react';
import { getStock, getSewingStock, getFinishingStock, getPataStockItem } from '../../utils/calculations';
import { syncToSheet } from '../../utils/syncUtils';

const FactoryPanel = ({ type: initialType, masterData, setMasterData, showNotify, user, setActivePanel }) => {
    const [type, setType] = useState(initialType);
    const [view, setView] = useState('active'); // 'active', 'history', 'payments'
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';

    React.useEffect(() => {
        setType(initialType);
    }, [initialType]);

    const [receiveModal, setReceiveModal] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [ledgerModal, setLedgerModal] = useState(null);
    const [recoveryModal, setRecoveryModal] = useState(null);
    const [printSlip, setPrintSlip] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [showAllLots, setShowAllLots] = useState(false);
    const [adminBypassed, setAdminBypassed] = useState(false);

    const [selection, setSelection] = useState({
        design: '',
        color: '',
        lotNo: '',
        date: new Date().toISOString().split('T')[0],
        pataType: masterData.pataTypes?.[0] || 'Single',
        rate: '',
        worker: '',
        note: ''
    });

    const [issueSizes, setIssueSizes] = useState([{ size: '', borka: '', hijab: '', pataQty: '' }]);
    const processType = 'construction';
    const [selectedLot, setSelectedLot] = useState('');

    const workers = masterData.workerCategories[type] || [];

    const activeProductions = (masterData.productions || []).filter(p => p.type === type && p.status === 'Pending');
    const historyProductions = (masterData.productions || []).filter(p => p.type === type && (p.status === 'Received' || p.status === 'Partial'));

    const colorMap = {
        "অলিভ": "bg-[#556b2f]",
        "जाम": "bg-[#4b0082]",
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

    const getStockForSize = (size) => {
        if (!selection.design || !selection.color || (type === 'sewing' && !size)) return { borka: 0, hijab: 0, pata: 0 };
        const d = masterData.designs.find(x => x.name === selection.design);

        if (type === 'sewing') {
            if ((d?.sewingRate || 0) === 0) return { borka: 0, hijab: 0, pata: 0 };
            return getStock(masterData, selection.design, selection.color, size);
        } else {
            const sewnStock = getSewingStock(masterData, selection.design, selection.color, size);
            const pataStock = getPataStockItem(masterData, selection.design, selection.color, selection.pataType);
            return { borka: sewnStock.borka, hijab: sewnStock.hijab, pata: pataStock };
        }
    };

    const handleAddIssueRow = () => {
        setIssueSizes(prev => [...prev, { size: '', borka: '', hijab: '', pataQty: '' }]);
    };

    const handleRemoveIssueRow = (index) => {
        if (issueSizes.length === 1) return;
        setIssueSizes(prev => prev.filter((_, i) => i !== index));
    };

    const handleIssueSizeChange = (index, field, value) => {
        const newSizes = [...issueSizes];
        newSizes[index][field] = value;
        setIssueSizes(newSizes);
    };

    const handlePopulateAllSizes = () => {
        const allSizes = masterData.sizes.map(s => ({
            size: s,
            borka: '',
            hijab: '',
            pataQty: ''
        }));
        setIssueSizes(allSizes);
        showNotify('সকল সাইজ লোড করা হয়েছে!');
    };

    const availableLots = React.useMemo(() => {
        const productions = masterData.productions || [];
        const cutting = masterData.cuttingStock || [];
        const lots = [];

        if (type === 'sewing') {
            cutting.forEach(c => {
                const designObj = masterData.designs.find(d => d.name === c.design);
                // IF it has sewing rate, it MUST go to swing
                if ((designObj?.sewingRate || 0) === 0) return;

                const issuedB = productions
                    .filter(p => p.type === 'sewing' && p.design === c.design && p.color === c.color && p.lotNo === c.lotNo && p.size === c.size)
                    .reduce((sum, p) => sum + (p.issueBorka || 0), 0);
                const issuedH = productions
                    .filter(p => p.type === 'sewing' && p.design === c.design && p.color === c.color && p.lotNo === c.lotNo && p.size === c.size)
                    .reduce((sum, p) => sum + (p.issueHijab || 0), 0);

                const remB = c.borka - issuedB;
                const remH = c.hijab - issuedH;

                if (remB > 0 || remH > 0) {
                    const existing = lots.find(l => l.lotNo === c.lotNo && l.design === c.design && l.color === c.color);
                    if (existing) {
                        existing.sizes[c.size] = { remB, remH };
                        existing.totalAvailable += (remB + remH);
                    } else {
                        lots.push({
                            lotNo: c.lotNo, design: c.design, color: c.color, totalAvailable: (remB + remH),
                            sizes: { [c.size]: { remB, remH } }
                        });
                    }
                }
            });
        } else if (type === 'stone') {
            // Direct Flow: Designs with Stone Rate but NO Swing Rate go direct from cutting
            cutting.forEach(c => {
                const designObj = masterData.designs.find(d => d.name === c.design);
                if ((designObj?.stoneRate || 0) > 0 && (designObj?.sewingRate || 0) === 0) {
                    const issuedB = productions
                        .filter(p => p.type === 'stone' && p.design === c.design && p.color === c.color && p.lotNo === c.lotNo && p.size === c.size)
                        .reduce((sum, p) => sum + (p.issueBorka || 0), 0);
                    const issuedH = productions
                        .filter(p => p.type === 'stone' && p.design === c.design && p.color === c.color && p.lotNo === c.lotNo && p.size === c.size)
                        .reduce((sum, p) => sum + (p.issueHijab || 0), 0);

                    const remB = c.borka - issuedB;
                    const remH = c.hijab - issuedH;

                    if (remB > 0 || remH > 0) {
                        const existing = lots.find(l => l.lotNo === c.lotNo && l.design === c.design && l.color === c.color);
                        if (existing) {
                            existing.sizes[c.size] = { remB, remH };
                            existing.totalAvailable += (remB + remH);
                        } else {
                            lots.push({
                                lotNo: c.lotNo, design: c.design, color: c.color, totalAvailable: (remB + remH),
                                sizes: { [c.size]: { remB, remH } },
                                isDirect: true
                            });
                        }
                    }
                }
            });

            // Normal Flow: Pieces being sewn in Factory
            // Group swing by lot/size to know what exists in factory (even if pending)
            const factorySewing = {};
            productions.filter(p => p.type === 'sewing' && (p.status === 'Received' || p.status === 'Pending' || p.status === 'Partial')).forEach(s => {
                const key = `${s.design}|${s.color}|${s.lotNo}|${s.size}`;
                if (!factorySewing[key]) factorySewing[key] = { b: 0, h: 0 };
                // Use issue amounts as the stock source for parallel stone work
                factorySewing[key].b += (s.issueBorka || 0);
                factorySewing[key].h += (s.issueHijab || 0);
            });

            Object.keys(factorySewing).forEach(key => {
                const [design, color, lotNo, size] = key.split('|');
                const issuedToStoneB = productions
                    .filter(p => p.type === 'stone' && p.design === design && p.color === color && p.lotNo === lotNo && p.size === size)
                    .reduce((sum, p) => sum + (p.issueBorka || 0), 0);
                const issuedToStoneH = productions
                    .filter(p => p.type === 'stone' && p.design === design && p.color === color && p.lotNo === lotNo && p.size === size)
                    .reduce((sum, p) => sum + (p.issueHijab || 0), 0);

                const remB = factorySewing[key].b - issuedToStoneB;
                const remH = factorySewing[key].h - issuedToStoneH;

                if (remB > 0 || remH > 0) {
                    const existing = lots.find(l => l.lotNo === lotNo && l.design === design && l.color === color);

                    // design stocks
                    const totalDesignRecB = (masterData.productions || [])
                        .filter(p => p.design === design && p.status === 'Received')
                        .reduce((sum, p) => sum + (p.receivedBorka || 0), 0);
                    const totalDesignRecH = (masterData.productions || [])
                        .filter(p => p.design === design && p.status === 'Received')
                        .reduce((sum, p) => sum + (p.receivedHijab || 0), 0);

                    if (existing) {
                        existing.sizes[size] = { remB, remH };
                        existing.totalAvailable += (remB + remH);
                    } else {
                        lots.push({
                            lotNo, design, color, totalAvailable: (remB + remH),
                            designStockB: totalDesignRecB,
                            designStockH: totalDesignRecH,
                            sizes: { [size]: { remB, remH } }
                        });
                    }
                }
            });
        }

        // Admin Power: If showAllLots is on, inject all designs into availableLots (with 0 stock)
        if (isAdmin && showAllLots) {
            masterData.designs.forEach(d => {
                const colors = masterData.colors || [];
                colors.forEach(c => {
                    const exists = lots.find(l => l.design === d.name && l.color === c);
                    if (!exists) {
                        lots.push({
                            lotNo: 'ADMIN', design: d.name, color: c, totalAvailable: 999,
                            designStockB: 999, designStockH: 999,
                            sizes: masterData.sizes.reduce((acc, s) => ({ ...acc, [s]: { remB: 999, remH: 999 } }), {})
                        });
                    }
                });
            });
        }

        return lots;
    }, [masterData, type, showAllLots, isAdmin]);

    const handleLotSelect = (lotKey) => {
        setSelectedLot(lotKey);
        if (!lotKey) return;
        const [design, color, lotNo] = lotKey.split('|');
        const lot = availableLots.find(l => l.lotNo === lotNo && l.design === design && l.color === color);
        if (lot) {
            const d = masterData.designs.find(x => x.name === lot.design);
            const defaultRate = type === 'sewing' ? (d?.sewingRate || 0) : (d?.stoneRate || 0);

            setSelection(p => ({
                ...p,
                design: lot.design,
                color: lot.color,
                lotNo: lot.lotNo,
                rate: p.worker && masterData.workerWages?.[type]?.[p.worker] > 0
                    ? masterData.workerWages[type][p.worker]
                    : defaultRate
            }));
            const lotSizes = Object.keys(lot.sizes).map(s => ({
                size: s,
                borka: lot.sizes[s].remB,
                hijab: lot.sizes[s].remH,
                pataQty: ''
            }));
            setIssueSizes(lotSizes);
        }
    };

    const handleWorkerSelect = (worker) => {
        setSelection(p => {
            const d = masterData.designs.find(x => x.name === p.design);
            const defaultRate = type === 'sewing' ? (d?.sewingRate || 0) : (d?.stoneRate || 0);
            const workerSpecific = masterData.workerWages?.[type]?.[worker];

            return {
                ...p,
                worker,
                rate: workerSpecific > 0 ? workerSpecific : (p.rate || defaultRate)
            };
        });
    };

    const handleIssue = (e) => {
        e.preventDefault();
        const { design, color, pataType, worker, rate, date, lotNo } = selection;

        if (!worker) return showNotify('কারিগর সিলেক্ট করুন!', 'error');

        let finalLotNo = lotNo;
        if (adminBypassed) {
            if (!design || !color) return showNotify('ডিজাইন এবং কালার সিলেক্ট করুন!', 'error');
            finalLotNo = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
        } else {
            if (!lotNo) return showNotify('লট সিলেক্ট করুন!', 'error');
        }

        const validIssues = issueSizes.filter(s => s.size && (Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0));
        if (validIssues.length === 0) return showNotify('অন্তত একটি সাইজ এবং সংখ্যা দিন!', 'error');

        const newEntries = validIssues.map(s => ({
            id: `prod_${Date.now()}_${Math.random()}`,
            date: new Date(date).toLocaleDateString('en-GB'),
            type: type,
            worker: worker,
            design: design,
            color: color,
            lotNo: finalLotNo,
            size: s.size,
            issueBorka: Number(s.borka || 0),
            issueHijab: Number(s.hijab || 0),
            pataType: type === 'stone' ? pataType : null,
            pataQty: type === 'stone' ? Number(s.pataQty || 0) : 0,
            status: 'Pending',
            receivedBorka: 0,
            receivedHijab: 0,
            shortageBorka: 0,
            shortageHijab: 0,
            rate: Number(rate || 0),
            note: selection.note
        }));

        setMasterData(prev => ({ ...prev, productions: [...newEntries, ...(prev.productions || [])] }));

        newEntries.forEach(entry => {
            syncToSheet({
                type: `${type.toUpperCase()}_ISSUE`,
                worker: entry.worker,
                detail: `${entry.design}(${entry.color}) - ${entry.size} - B:${entry.issueBorka} H:${entry.issueHijab} (Lot: ${entry.lotNo})`,
                amount: 0
            });
        });

        setIssueSizes([{ size: '', borka: '', hijab: '', pataQty: '' }]);
        setShowIssueModal(false);
        setAdminBypassed(false);
        setSelection(p => ({ ...p, design: '', color: '', lotNo: '', note: '' }));
        showNotify(`${worker}-কে কাজ দেওয়া হয়েছে!`);
    };

    const handleConfirmReceive = (e) => {
        e.preventDefault();
        const rBorka = Number(e.target.rBorka.value || 0);
        const rHijab = Number(e.target.rHijab.value || 0);
        const wBorka = Number(e.target.wBorka?.value || 0);
        const wHijab = Number(e.target.wHijab?.value || 0);

        const sBorka = Math.max(0, receiveModal.issueBorka - rBorka - wBorka);
        const sHijab = Math.max(0, receiveModal.issueHijab - rHijab - wHijab);

        const status = (sBorka > 0 || sHijab > 0) ? 'Partial' : 'Received';

        setMasterData(prev => ({
            ...prev,
            productions: prev.productions.map(p => p.id === receiveModal.id ? {
                ...p, status,
                receivedBorka: rBorka,
                receivedHijab: rHijab,
                wastedBorka: wBorka,
                wastedHijab: wHijab,
                shortageBorka: sBorka,
                shortageHijab: sHijab,
                receiveDate: new Date().toLocaleDateString('en-GB')
            } : p)
        }));

        syncToSheet({
            type: `${receiveModal.type.toUpperCase()}_RECEIVE`,
            worker: receiveModal.worker,
            detail: `${receiveModal.design} (Lot: ${receiveModal.lotNo}): B:${rBorka} H:${rHijab} W:${wBorka + wHijab} ${sBorka + sHijab > 0 ? `(Shortage B:${sBorka} H:${sHijab})` : ''}`,
            amount: 0
        });

        setReceiveModal(null);
        showNotify(status === 'Received' ? 'হিসাব জমা নেওয়া হয়েছে!' : 'হিসাব আংশিক জমা নেওয়া হয়েছে (Shortage Flagged)!');
    };

    const handleRecoverShortage = (prod, rB, rH) => {
        if (rB <= 0 && rH <= 0) return;

        setMasterData(prev => {
            const updatedProds = prev.productions.map(p => {
                if (p.id === prod.id) {
                    const newRB = (p.receivedBorka || 0) + rB;
                    const newRH = (p.receivedHijab || 0) + rH;
                    const newSB = Math.max(0, p.issueBorka - newRB);
                    const newSH = Math.max(0, p.issueHijab - newRH);
                    const newStatus = (newSB > 0 || newSH > 0) ? 'Partial' : 'Received';

                    return {
                        ...p,
                        receivedBorka: newRB,
                        receivedHijab: newRH,
                        shortageBorka: newSB,
                        shortageHijab: newSH,
                        status: newStatus
                    };
                }
                return p;
            });
            return { ...prev, productions: updatedProds };
        });

        syncToSheet({
            type: `${prod.type.toUpperCase()}_SHORTAGE_RECOVER`,
            worker: prod.worker,
            detail: `Recovered shortage for ${prod.design} (Lot: ${prod.lotNo}): B:${rB} H:${rH}`,
            amount: 0
        });

        showNotify('বকেয়া মাল পুনরুদ্ধার করা হয়েছে!');
    };

    const handleEditProduction = (e) => {
        e.preventDefault();
        const f = e.target;
        const updated = {
            ...editModal,
            worker: f.worker.value,
            design: f.design.value,
            color: f.color.value,
            lotNo: f.lotNo.value,
            size: f.size.value,
            issueBorka: Number(f.iBorka.value),
            issueHijab: Number(f.iHijab.value),
            receivedBorka: Number(f.rBorka?.value || editModal.receivedBorka || 0),
            receivedHijab: Number(f.rHijab?.value || editModal.receivedHijab || 0),
            status: f.status.value,
            rate: Number(f.rate.value),
            note: f.note.value
        };

        setMasterData(prev => ({
            ...prev,
            productions: prev.productions.map(p => p.id === updated.id ? updated : p)
        }));

        setEditModal(null);
        showNotify('কাজ আপডেট করা হয়েছে (Admin Power)!');
    };

    const handleDeleteProduction = (id) => {
        if (!confirm('এটি একেবারে মুছে ফেলতে চান? (অ্যাডমিন পাওয়ার)')) return;
        setMasterData(prev => ({
            ...prev,
            productions: prev.productions.filter(p => p.id !== id)
        }));
        showNotify('তথ্য মুছে ফেলা হয়েছে!');
    };

    const getWorkerDue = (name) => {
        let earnings = 0;
        const prods = (masterData.productions || []).filter(p => p.worker === name && p.status === 'Received' && p.type === type);
        prods.forEach(p => {
            const d = masterData.designs.find(ds => ds.name === p.design);
            const defaultRate = p.type === 'stone' ? (d?.stoneRate || 0) : (d?.sewingRate || 0);
            const rate = Number(p.rate || defaultRate);
            earnings += (Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)) * rate;
        });
        const paid = (masterData.workerPayments || []).filter(p => p.worker === name && p.dept === type).reduce((s, p) => s + Number(p.amount), 0);
        return earnings - paid;
    };

    const handleConfirmPayment = (e) => {
        e.preventDefault();
        const amount = Number(e.target.amount.value);
        const date = e.target.date.value ? new Date(e.target.date.value).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        if (amount <= 0) return;

        const newPayment = { id: Date.now(), date, worker: payModal, dept: type, amount, note: e.target.note.value };
        setMasterData(prev => ({
            ...prev,
            workerPayments: [newPayment, ...(prev.workerPayments || [])]
        }));

        syncToSheet({
            type: "WORKER_PAYMENT",
            worker: payModal,
            amount,
            detail: `Payment from ${type} factory`
        });

        setPayModal(null);
        showNotify('পেমেন্ট সফল হয়েছে!');
    };

    if (printSlip) {
        return (
            <div className="min-h-screen bg-black text-white p-12 italic">
                <style>{`@media print { .no-print { display: none; } }`}</style>
                <button onClick={() => setPrintSlip(null)} className="no-print bg-white text-black px-10 py-4 font-black uppercase text-xs mb-4 rounded-full">বন্ধ করুন</button>
                <div className="max-w-2xl mx-auto border border-white/20 p-16 rounded-3xl text-center bg-zinc-900 shadow-3xl">
                    <h1 className="text-5xl font-black italic tracking-tighter mb-4">NRZONE PRO</h1>
                    <p className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">{type} FACTORY SLIP</p>
                    <div className="space-y-8 text-left border-t border-white/10 pt-12">
                        <div className="flex justify-between text-2xl font-black text-white"><span>মাষ্টার:</span> <span>{printSlip.worker}</span></div>
                        <div className="flex justify-between text-2xl font-black text-white"><span>ডিজাইন:</span> <span>{printSlip.design}</span></div>
                        <div className="flex justify-between text-2xl font-black text-white px-2 py-1 bg-white/10 rounded-lg"><span>লট নম্বর:</span> <span>#{printSlip.lotNo}</span></div>
                        <div className="flex justify-between text-2xl font-black text-gray-500"><span>কালার/সাইজ:</span> <span>{printSlip.color} / {printSlip.size}</span></div>
                        <div className="grid grid-cols-2 gap-3 pt-12">
                            <div className="bg-white text-black p-5 rounded-3xl">
                                <p className="text-xs font-black uppercase mb-2">Issue Borka</p>
                                <p className="text-5xl font-black italic">{printSlip.issueBorka}</p>
                            </div>
                            <div className="bg-zinc-800 p-5 rounded-3xl border border-white/5">
                                <p className="text-xs font-black uppercase mb-2 text-gray-400">Issue Hijab</p>
                                <p className="text-5xl font-black italic text-white">{printSlip.issueHijab}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-12 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit selection:bg-blue-600">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActivePanel('Overview')}
                        className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 md:gap-3 bg-white p-4 md:p-4 rounded-xl md:rounded-3xl border-4 border-slate-50 shadow-2xl w-full md:w-auto">
                        <div className={`p-4 md:p-4 ${type === 'sewing' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-amber-600 shadow-amber-500/20'} text-white rounded-[1.2rem] md:rounded-xl shadow-2xl rotate-3 transition-transform hover:rotate-0`}>
                            {type === 'sewing' ? <Scissors size={28} strokeWidth={3} className="md:w-[36px] md:h-[36px]" /> : <Database size={28} strokeWidth={3} className="md:w-[36px] md:h-[36px]" />}
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-black">{type === 'sewing' ? 'Swing' : 'Stone'} <span className="text-slate-100">Unit</span></h2>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setType('sewing')} className={`text-xs font-bold font-black uppercase tracking-widest px-6 py-2 rounded-full border transition-all ${type === 'sewing' ? 'bg-black text-white border-black shadow-xl' : 'text-slate-600 font-bold border-slate-50 hover:text-black'}`}>Sewing</button>
                                <button onClick={() => setType('stone')} className={`text-xs font-bold font-black uppercase tracking-widest px-6 py-2 rounded-full border transition-all ${type === 'stone' ? 'bg-black text-white border-black shadow-xl' : 'text-slate-600 font-bold border-slate-50 hover:text-black'}`}>Stone</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl md:rounded-2xl px-8 py-5 md:px-12 md:py-8 flex flex-col items-center md:items-end border-4 border-slate-50 shadow-xl min-w-[260px] md:min-w-[300px] w-full md:w-auto relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <History size={80} className={type === 'sewing' ? 'text-indigo-500' : 'text-amber-500'} />
                    </div>
                    <p className="text-[11px] font-bold md:text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-1 md:mb-2">FACTORY PIPELINE</p>
                    <p className={`text-3xl md:text-5xl font-black italic tracking-tighter ${type === 'sewing' ? 'text-indigo-600' : 'text-amber-600'} relative z-10`}>{availableLots.length.toLocaleString()} <span className="text-xs md:text-sm not-italic text-slate-400 font-bold">AVAILABLE LOTS</span></p>
                </div>
            </div>

            {/* Top Entry Trigger Section */}
            {(view === 'active' || view === 'history') && (
                <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-3xl border-4 border-slate-50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 animate-fade-down group hover:border-black transition-all">
                    <div className="flex items-center gap-3">
                        <div className={`p-4 md:p-4 ${type === 'sewing' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-amber-600 shadow-amber-500/20'} text-white rounded-[1.2rem] md:rounded-xl shadow-2xl`}>
                            <Plus size={32} strokeWidth={3} className="md:w-[40px] md:h-[40px]" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">নতুন মাল এন্ট্রি করুন</h3>
                            <p className="text-xs font-bold font-black tracking-widest text-slate-600 font-bold uppercase italic">Assign Work to Production Hub</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowIssueModal(true)}
                        className={`w-full md:w-auto px-12 py-5 md:py-8 ${type === 'sewing' ? 'bg-indigo-600' : 'bg-amber-600'} text-white rounded-full font-black text-xl md:text-2xl uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3`}
                    >
                        এন্ট্রি দিন (Entry)
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-12">
                {view === 'payments' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workers.map((w, idx) => {
                            const due = getWorkerDue(w);
                            return (
                                <div key={idx} className="bg-white p-5 md:p-12 rounded-2xl md:rounded-3xl border-4 border-slate-50 shadow-2xl flex flex-col justify-between h-64 md:h-80 group hover:border-black transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <DollarSign size={120} className="text-black" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl md:text-4xl font-black italic uppercase leading-none mb-3 md:mb-4 text-black group-hover:translate-x-2 transition-transform">{w}</h4>
                                        <p className="text-[11px] font-bold md:text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">Total Due (পাওনা)</p>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="flex items-baseline gap-2">
                                            <p className={`text-4xl md:text-6xl font-black italic tracking-tighter leading-none ${due > 0 ? 'text-black' : 'text-slate-400 font-bold'}`}>৳{(isAdmin || isManager) ? due.toLocaleString() : '***'}</p>
                                            {due > 0 && <span className="text-xs font-bold font-black text-emerald-500 uppercase animate-pulse">Payable</span>}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setLedgerModal(w)}
                                                className="p-4 md:p-4 bg-slate-50 text-slate-600 font-bold rounded-2xl md:rounded-3xl border border-slate-100 hover:bg-black hover:text-white transition-all shadow-sm"
                                                title="View Ledger"
                                            >
                                                <History size={20} className="md:w-[24px] md:h-[24px]" />
                                            </button>
                                            {(isAdmin || isManager) && (
                                                <button onClick={() => setPayModal(w)} className={`p-4 md:p-4 bg-black text-white rounded-2xl md:rounded-3xl shadow-xl hover:rotate-12 transition-transform active:scale-95 border-b-[8px] border-zinc-900`}>
                                                    <DollarSign size={20} className="md:w-[24px] md:h-[24px]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(view === 'active' ? activeProductions : historyProductions).length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-slate-800 gap-3">
                                <Archive size={80} strokeWidth={1} className="opacity-10" />
                                <p className="text-xs font-bold font-black uppercase tracking-[0.8em] opacity-40">Empty Archive • তথ্য নেই</p>
                            </div>
                        ) : (view === 'active' ? activeProductions : historyProductions).map(prod => {
                            const isSewing = prod.type === 'sewing';
                            const designObj = masterData.designs.find(d => d.name === prod.design);
                            const stoneRate = designObj?.stoneRate || 0;
                            const pataRate = designObj?.pataRate || 0;

                            const totalIssuedToSewing = masterData.productions
                                .filter(p => p.type === 'sewing' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + (Number(p.issueBorka || 0) + Number(p.issueHijab || 0)), 0);

                            const totalReceivedFromStoneB = masterData.productions
                                .filter(p => p.type === 'stone' && p.status === 'Received' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + Number(p.receivedBorka || 0), 0);
                            const totalReceivedFromStoneH = masterData.productions
                                .filter(p => p.type === 'stone' && p.status === 'Received' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + Number(p.receivedHijab || 0), 0);
                            const totalReceivedFromStone = totalReceivedFromStoneB + totalReceivedFromStoneH;

                            const totalIssuedToStone = masterData.productions
                                .filter(p => p.type === 'stone' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + (Number(p.issueBorka || 0) + Number(p.issueHijab || 0)), 0);

                            const totalReceivedFromPata = (masterData.pataEntries || [])
                                .filter(p => p.status === 'Received' && p.design === prod.design && p.color === prod.color && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + Number(p.receivedQty || 0), 0);

                            const pendingStoneCount = masterData.productions
                                .filter(p => p.type === 'stone' && p.status === 'Pending' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .length;

                            const pendingPataCount = (masterData.pataEntries || [])
                                .filter(p => p.status === 'Pending' && p.design === prod.design && p.color === prod.color && p.lotNo === prod.lotNo)
                                .length;

                            const totalWastedAtStoneB = masterData.productions
                                .filter(p => p.type === 'stone' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + Number(p.wastedBorka || 0), 0);
                            const totalWastedAtStoneH = masterData.productions
                                .filter(p => p.type === 'stone' && p.design === prod.design && p.color === prod.color && p.size === prod.size && p.lotNo === prod.lotNo)
                                .reduce((s, p) => s + Number(p.wastedHijab || 0), 0);
                            const totalWastedAtStone = totalWastedAtStoneB + totalWastedAtStoneH;

                            const stoneDone = stoneRate === 0 || (pendingStoneCount === 0 && (totalIssuedToStone > 0 || totalReceivedFromStone > 0));
                            const pataDone = pataRate === 0 || (totalReceivedFromPata >= totalIssuedToSewing && pendingPataCount === 0 && totalReceivedFromPata > 0);
                            // Strict Logic: IF Stone Rate exists, MUST finish Stone first.
                            // If Stone Rate is 0, then Sewing can be received anytime. - Updates per user request
                            const isLocked = isSewing && stoneRate > 0 && !stoneDone;
                            const wasteCount = totalIssuedToSewing - (stoneRate > 0 ? totalReceivedFromStone : (pataRate > 0 ? totalReceivedFromPata : totalIssuedToSewing));

                            return (
                                <div key={prod.id} className="bg-white p-4 md:p-4 rounded-xl md:rounded-3xl border-4 border-slate-50 shadow-2xl flex items-center justify-between group hover:border-black transition-all relative overflow-hidden">
                                    <div className="flex items-center gap-3 md:gap-3">
                                        <div className="flex items-center justify-center bg-slate-50 text-black w-14 h-14 md:w-20 md:h-20 rounded-lg md:rounded-2xl font-black italic text-xl md:text-3xl border border-slate-100 shadow-xl group-hover:rotate-6 transition-transform">{prod.size}</div>
                                        <div>
                                            <h4 className="text-xl md:text-3xl font-black italic uppercase leading-none mb-2 text-black">{prod.design} <span className="text-xs font-bold bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full not-italic ml-2 uppercase tracking-widest select-none">#{prod.lotNo}</span></h4>
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                <p className="text-[11px] font-bold md:text-[11px] font-black text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2"><User size={12} /> {prod.worker}</p>
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                                                <p className="text-[11px] font-bold md:text-[11px] font-black text-slate-600 font-bold uppercase tracking-widest">{prod.color}</p>
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                                                <p className="text-[11px] font-bold md:text-[11px] font-black text-slate-600 font-bold uppercase tracking-widest">{prod.date}</p>
                                            </div>
                                            {prod.note && <p className="text-[11px] font-bold font-black text-indigo-500 uppercase tracking-widest mt-2 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 inline-block">{prod.note}</p>}
                                            {prod.receiveDate && <p className="text-[11px] font-bold font-black text-emerald-500 uppercase tracking-[0.3em] mt-3 flex items-center gap-2 animate-pulse"><CheckCircle size={10} /> REC: {prod.receiveDate}</p>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-3 md:gap-16">
                                        <div className="text-right">
                                            <div className="flex items-end gap-3 justify-end leading-none">
                                                <p className="text-2xl md:text-5xl font-black italic text-black uppercase tracking-tighter">{prod.receivedBorka || prod.issueBorka}</p>
                                                <p className="text-xs font-bold md:text-xs font-black text-slate-600 font-bold uppercase mb-1 md:mb-2">{prod.status === 'Received' ? 'Rec.' : 'Iss.'} Borka</p>
                                            </div>
                                            <div className="flex items-end gap-3 justify-end leading-none mt-2">
                                                <p className="text-lg md:text-3xl font-black italic text-indigo-600 uppercase tracking-tighter">{prod.receivedHijab || prod.issueHijab}</p>
                                                <p className="text-[8px] md:text-xs font-bold font-black text-slate-500 font-bold uppercase mb-1">Hijab</p>
                                            </div>
                                            {prod.pataQty > 0 && <p className="text-[11px] font-bold font-black text-amber-500 uppercase mt-4 tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100 inline-block">PATA: {prod.pataQty} PCS</p>}
                                        </div>
                                        <div className="flex gap-3">
                                            {prod.status === 'Pending' ? (
                                                <div className="flex flex-col items-end gap-3">
                                                    {isSewing && (stoneRate > 0 || pataRate > 0) && (
                                                        <div className="flex flex-col items-end gap-2">
                                                            {stoneRate > 0 && (
                                                                <div className={`text-[11px] font-bold font-black px-4 py-1.5 rounded-2xl border flex items-center gap-3 transition-all ${stoneDone ? 'bg-emerald-50 text-emerald-500 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${stoneDone ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                                                                    STONE: {totalReceivedFromStone} / {totalIssuedToSewing}
                                                                </div>
                                                            )}
                                                            {pataRate > 0 && (
                                                                <div className={`text-[11px] font-bold font-black px-4 py-1.5 rounded-2xl border flex items-center gap-3 transition-all ${pataDone ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${pataDone ? 'bg-blue-500' : 'bg-rose-500 animate-pulse'}`} />
                                                                    PATA: {totalReceivedFromPata} / {totalIssuedToSewing}
                                                                </div>
                                                            )}
                                                            {wasteCount > 0 && (
                                                                <span className="text-[8px] font-black text-rose-500 uppercase italic bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100 flex items-center gap-2 animate-bounce">
                                                                    <AlertCircle size={10} /> {wasteCount} PSC WASTED
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        {isAdmin && isLocked && <button onClick={() => confirm('Force Receive?') && setReceiveModal({ ...prod, stoneB: totalReceivedFromStoneB, stoneH: totalReceivedFromStoneH, stoneW_B: totalWastedAtStoneB, stoneW_H: totalWastedAtStoneH, hasStone: stoneRate > 0 })} className="px-8 py-4 rounded-full font-black text-xs font-bold uppercase tracking-widest bg-amber-500 text-white shadow-2xl">Force Rec.</button>}
                                                        <button onClick={() => setReceiveModal({ ...prod, stoneB: totalReceivedFromStoneB, stoneH: totalReceivedFromStoneH, stoneW_B: totalWastedAtStoneB, stoneW_H: totalWastedAtStoneH, hasStone: stoneRate > 0 })} disabled={isLocked} className={`px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all ${isLocked ? 'bg-slate-50 text-slate-500 font-bold border border-slate-100 cursor-not-allowed italic' : 'bg-black text-white hover:scale-105 active:scale-95 border-b-[8px] border-zinc-900'}`}>{isLocked ? 'Waiting' : 'RECEIVE (জমা)'}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-2">
                                                    <p className={`${prod.status === 'Partial' ? 'text-rose-500' : 'text-emerald-500'} font-black italic text-2xl md:text-4xl tracking-tighter leading-none select-none`}>
                                                        {prod.status === 'Partial' ? 'SHORTAGE' : 'COMPLETED'}
                                                    </p>
                                                    {prod.status === 'Partial' && (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <p className="text-xs font-bold font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                                                Shortage: B:{prod.shortageBorka} / H:{prod.shortageHijab}
                                                            </p>
                                                            <button
                                                                onClick={() => setRecoveryModal(prod)}
                                                                className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-[11px] font-bold font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                                                            >
                                                                বকেয়া জমা নিন
                                                            </button>
                                                        </div>
                                                    )}
                                                    {isAdmin && <p className="text-[8px] text-slate-600 font-bold uppercase font-black tracking-widest mt-1">Rec: {prod.receivedBorka + prod.receivedHijab} Pcs</p>}
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                {isAdmin && (
                                                    <button onClick={() => setEditModal(prod)} className="p-4 md:p-4 bg-slate-50 text-black rounded-2xl md:rounded-xl border-2 border-slate-100 hover:bg-black hover:text-white transition-all shadow-sm">
                                                        <Settings size={20} className="md:w-[24px] md:h-[24px]" />
                                                    </button>
                                                )}
                                                <button onClick={() => setPrintSlip(prod)} className="p-4 md:p-4 bg-slate-50 text-slate-600 font-bold rounded-2xl md:rounded-xl border-2 border-slate-100 hover:text-black hover:bg-slate-50 transition-all shadow-sm"><Printer size={20} className="md:w-[24px] md:h-[24px]" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[350] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-5xl border-4 border-white shadow-3xl animate-fade-up max-h-[96vh] flex flex-col overflow-hidden italic font-outfit">
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-4 md:p-4 border-b-2 border-slate-50 bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 md:gap-3">
                                <div className="p-4 bg-black text-white rounded-[1.2rem] md:rounded-lg shadow-xl rotate-3">
                                    <Send size={28} />
                                </div>
                                <div className="hidden sm:block">
                                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">নতুন মাল ইস্যু</h3>
                                    <p className="text-[11px] font-bold text-slate-600 font-bold font-black uppercase tracking-widest mt-1 italic">Assign Work to Production Hub</p>
                                </div>
                                <div className="sm:hidden">
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">মাল ইস্যু</h3>
                                </div>
                            </div>
                            <button onClick={() => setShowIssueModal(false)} className="p-4 md:p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={28} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <form onSubmit={handleIssue} className="flex-1 overflow-y-auto p-4 md:p-4 space-y-10 custom-scrollbar">
                            {/* Live Stock Monitor Strip */}
                            {selection.design && selection.color && (
                                <div className="bg-black text-white p-4 rounded-xl flex flex-wrap gap-3 items-center justify-around shadow-2xl animate-fade-down">
                                    <div className="text-center px-4">
                                        <p className="text-xs font-bold font-black uppercase tracking-widest text-slate-600 font-bold mb-1">Live Body Stock</p>
                                        <p className="text-3xl font-black italic tracking-tighter">
                                            {(() => {
                                                const lots = availableLots.filter(l => l.design === selection.design && l.color === selection.color);
                                                return lots.reduce((sum, l) => sum + l.totalAvailable, 0);
                                            })()} Pcs
                                        </p>
                                    </div>
                                    {type === 'stone' && (
                                        <div className="text-center px-4 border-l border-white/10">
                                            <p className="text-xs font-bold font-black uppercase tracking-widest text-amber-500 mb-1">Live Pata Stock</p>
                                            <p className="text-3xl font-black italic tracking-tighter text-amber-500">
                                                {getPataStockItem(masterData, selection.design, selection.color, selection.pataType)} Pcs
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest italic flex items-center gap-2">
                                        <div className="w-1 h-3 bg-black rounded-full" /> কারিগর (Worker)
                                    </label>
                                    <select className="w-full text-lg md:text-xl font-black py-5 md:py-6 bg-slate-50 border-none rounded-lg md:rounded-xl px-6 md:px-8 focus:ring-4 focus:ring-black/5 outline-none text-black italic transition-all appearance-none" onChange={(e) => handleWorkerSelect(e.target.value)} value={selection.worker}>
                                        <option value="">SELECT WORKER</option>
                                        {(masterData.workerCategories?.[type] || []).map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest italic flex items-center gap-2">
                                        <div className="w-1 h-3 bg-black rounded-full" /> লট নির্বাচন (Lot Selection)
                                    </label>
                                    <select
                                        className="w-full text-lg md:text-xl font-black py-5 md:py-6 bg-slate-50 border-none rounded-lg md:rounded-xl px-6 md:px-8 focus:ring-4 focus:ring-black/5 outline-none text-black italic transition-all appearance-none"
                                        onChange={(e) => handleLotSelect(e.target.value)}
                                        value={selectedLot}
                                    >
                                        <option value="">CHOOSE LOT</option>
                                        {availableLots.map(l => (
                                            <option key={`${l.design}|${l.color}|${l.lotNo}`} value={`${l.design}|${l.color}|${l.lotNo}`}>
                                                #{l.lotNo} - {l.design} ({l.color})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {isAdmin && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest italic">Wage Rate Override</label>
                                        <input type="number" className="w-full text-lg md:text-xl font-black py-5 md:py-6 bg-slate-50 text-emerald-600 border-none rounded-lg md:rounded-xl px-6 md:px-8 focus:ring-4 focus:ring-emerald-500/10 outline-none italic transition-all placeholder:text-slate-400 font-bold" value={selection.rate} onChange={(e) => setSelection({ ...selection, rate: e.target.value })} />
                                    </div>
                                )}

                                {type === 'stone' && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest italic flex items-center gap-2">
                                            <div className="w-1 h-3 bg-amber-500 rounded-full" /> পাতা ধরণ (Pata Type)
                                        </label>
                                        <select className="w-full text-lg md:text-xl font-black py-5 md:py-6 bg-amber-50 text-amber-600 border-none rounded-lg md:rounded-xl px-6 md:px-8 focus:ring-4 focus:ring-amber-500/10 outline-none italic transition-all appearance-none" onChange={(e) => setSelection({ ...selection, pataType: e.target.value })} value={selection.pataType}>
                                            {(masterData.pataTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-slate-50 p-4 md:p-4 rounded-lg md:rounded-xl border border-slate-100 shadow-sm">
                                    <p className="text-xs md:text-sm font-black uppercase text-black tracking-widest italic">
                                        Size Matrix <span className="text-[11px] font-bold font-bold text-slate-400 font-bold mt-1 sm:hidden"> বিবরণ</span>
                                    </p>
                                    <div className="flex gap-2 md:gap-3">
                                        <button type="button" onClick={handlePopulateAllSizes} className="px-4 py-2 bg-white text-black border-2 border-slate-100 rounded-full font-black text-[11px] font-bold md:text-xs font-bold uppercase hover:bg-black hover:text-white transition-all shadow-sm">Bulk Load</button>
                                        <button type="button" onClick={handleAddIssueRow} className={`p-3 md:p-4 bg-black text-white rounded-xl md:rounded-2xl shadow-xl hover:scale-110 transition-transform`}><Plus size={18} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-3">
                                    {issueSizes.map((sRow, idx) => (
                                        <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border-4 border-slate-50 space-y-6 relative group/row hover:border-black transition-all shadow-sm italic">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold font-black text-slate-600 font-bold mb-2 uppercase tracking-widest italic">Size</p>
                                                    <select className="w-full bg-slate-50 text-black border-none rounded-2xl px-6 py-4 text-xl font-black italic outline-none focus:ring-4 focus:ring-black/5 appearance-none" value={sRow.size} onChange={(e) => handleIssueSizeChange(idx, 'size', e.target.value)}>
                                                        <option value="">--</option>
                                                        {masterData.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveIssueRow(idx)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all ml-4 border border-slate-100"><Minus size={18} /></button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold font-black text-slate-600 font-bold tracking-widest text-center uppercase">Borka</p>
                                                    <input type="number" className="w-full h-14 text-center text-2xl font-black bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-black/5" placeholder="0" value={sRow.borka} onChange={(e) => handleIssueSizeChange(idx, 'borka', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold font-black text-indigo-400 tracking-widest text-center uppercase">Hijab</p>
                                                    <input type="number" className="w-full h-14 text-center text-2xl font-black bg-indigo-50/50 text-indigo-600 rounded-xl border-none focus:ring-2 focus:ring-indigo-100" placeholder="0" value={sRow.hijab} onChange={(e) => handleIssueSizeChange(idx, 'hijab', e.target.value)} />
                                                </div>
                                            </div>

                                            {type === 'stone' && (
                                                <div className="space-y-1 bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                                                    <p className="text-[11px] font-bold font-black text-amber-500 tracking-widest text-center uppercase">Pata Pcs</p>
                                                    <input type="number" className="w-full h-14 text-center text-3xl font-black bg-white text-amber-500 rounded-xl border-2 border-amber-100 outline-none" placeholder="0" value={sRow.pataQty} onChange={(e) => handleIssueSizeChange(idx, 'pataQty', e.target.value)} />
                                                </div>
                                            )}

                                            {sRow.size && (
                                                <div className="bg-slate-50 rounded-lg p-4 flex justify-around border border-slate-100">
                                                    {(() => {
                                                        const stock = getStockForSize(sRow.size);
                                                        return (
                                                            <>
                                                                <div className="text-center">
                                                                    <p className="text-[8px] font-black text-slate-600 font-bold uppercase mb-1">Stock B</p>
                                                                    <p className="text-lg font-black text-black">{stock.borka}</p>
                                                                </div>
                                                                <div className="text-center border-l border-slate-200 pl-4">
                                                                    <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Stock H</p>
                                                                    <p className="text-lg font-black text-indigo-600">{stock.hijab}</p>
                                                                </div>
                                                                {type === 'stone' && (
                                                                    <div className="text-center border-l border-slate-200 pl-4">
                                                                        <p className="text-[8px] font-black text-amber-500 uppercase mb-1">Pata Live</p>
                                                                        <p className="text-lg font-black text-amber-600">{stock.pata}</p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-4 border-t-2 border-slate-50 bg-white flex flex-col md:flex-row gap-3 md:gap-3 flex-shrink-0">
                            <button onClick={() => setShowIssueModal(false)} className="flex-1 py-6 md:py-8 bg-slate-50 text-slate-600 font-bold rounded-full font-black uppercase text-xs tracking-widest hover:text-black transition-all">Cancel</button>
                            <button onClick={handleIssue} className={`flex-[3] py-6 md:py-8 ${type === 'sewing' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-amber-600 shadow-amber-500/20'} text-white rounded-full font-black text-2xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3`}>
                                <Send size={24} /> অসাইন করুন (Save)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receive Modal */}
            {receiveModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-4xl border-4 border-white shadow-3xl animate-fade-up max-h-[96vh] flex flex-col overflow-hidden italic font-outfit">
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-4 md:p-4 border-b-2 border-slate-50 bg-white flex-shrink-0">
                            <div>
                                <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">মাল জমা নিন</h3>
                                <p className="text-[11px] font-bold md:text-xs font-bold text-slate-600 font-bold font-black uppercase tracking-widest mt-2">{receiveModal.design} • {receiveModal.color} • LOT {receiveModal.lotNo}</p>
                            </div>
                            <button onClick={() => setReceiveModal(null)} className="p-4 md:p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={28} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-3">
                                <div className="space-y-4 md:space-y-6">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest">বোরকা সংখ্যা (Borka Rec.)</label>
                                    <input
                                        type="number"
                                        className="w-full text-4xl md:text-6xl font-black py-8 md:py-12 bg-slate-50 border-none rounded-xl md:rounded-2xl text-center focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-slate-400 font-bold"
                                        value={receiveModal.recB || ''}
                                        placeholder={receiveModal.issueBorka}
                                        onChange={(e) => setReceiveModal({ ...receiveModal, recB: e.target.value })}
                                        autoFocus
                                    />
                                    <p className="text-xs font-bold text-center font-black text-slate-400 font-bold uppercase italic">Issued: {receiveModal.issueBorka} Pcs</p>
                                </div>
                                <div className="space-y-4 md:space-y-6">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest">হিজাব সংখ্যা (Hijab Rec.)</label>
                                    <input
                                        type="number"
                                        className="w-full text-4xl md:text-6xl font-black py-8 md:py-12 bg-slate-50 border-none rounded-xl md:rounded-2xl text-center focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-slate-400 font-bold"
                                        value={receiveModal.recH || ''}
                                        placeholder={receiveModal.issueHijab}
                                        onChange={(e) => setReceiveModal({ ...receiveModal, recH: e.target.value })}
                                    />
                                    <p className="text-xs font-bold text-center font-black text-slate-400 font-bold uppercase italic">Issued: {receiveModal.issueHijab} Pcs</p>
                                </div>
                            </div>

                            {receiveModal.hasStone && (
                                <div className="bg-emerald-50 p-4 md:p-4 rounded-xl md:rounded-3xl border-2 border-emerald-100/50 space-y-8">
                                    <div className="text-center">
                                        <div className="inline-block px-10 py-3 bg-white text-emerald-500 rounded-full font-black uppercase text-xs font-bold tracking-[0.4em] shadow-sm border border-emerald-100 italic">Stone Unit Verification</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 md:gap-3 divide-x-2 divide-emerald-100">
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Stone Rec. B</p>
                                            <p className="text-xl md:text-4xl font-black text-emerald-600 italic leading-none">{receiveModal.stoneB}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Stone Rec. H</p>
                                            <p className="text-xl md:text-4xl font-black text-emerald-600 italic leading-none">{receiveModal.stoneH}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-rose-400 uppercase mb-2 tracking-widest">Stone Waste</p>
                                            <p className="text-xl md:text-4xl font-black text-rose-500 italic leading-none">{receiveModal.stoneW_B + receiveModal.stoneW_H}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50/50 p-5 rounded-2xl border-2 border-dashed border-slate-100 text-center">
                                <p className="text-xs font-bold font-black text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">
                                    যেকোনো কমতি (Shortage) অটো হিজাব/বোরকা বকেয়া হিসেবে সংরক্ষিত হবে।<br />
                                    সব ঠিক থাকলে "জমা নিশ্চিত করুন" বাটনে ক্লিক করুন।
                                </p>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col md:flex-row gap-3 md:gap-3 flex-shrink-0">
                            <button onClick={() => setReceiveModal(null)} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full font-black uppercase text-xs font-bold md:text-xs tracking-widest hover:text-black transition-all order-2 md:order-1">বাতিল (Cancel)</button>
                            <button
                                onClick={handleReceive}
                                className="flex-[3] py-6 md:py-10 bg-black text-white rounded-full font-black uppercase text-xl md:text-3xl tracking-[0.2em] shadow-2xl border-b-[16px] border-zinc-900 hover:scale-[1.01] active:scale-95 transition-all order-1 md:order-2"
                            >
                                জমা নিশ্চিত করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ledger Modal */}
            {ledgerModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic font-outfit">
                    <div className="bg-white w-full max-w-5xl md:max-h-[96vh] rounded-2xl md:rounded-[4.5rem] border-4 border-white shadow-3xl flex flex-col overflow-hidden italic animate-fade-up">
                        {/* Sticky Header */}
                        <div className="p-4 md:p-12 border-b-2 border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 md:gap-3">
                                <div className="p-4 md:p-4 bg-black text-white rounded-[1.2rem] md:rounded-[2.2rem] shadow-xl rotate-3">
                                    <History size={32} className="md:w-[40px] md:h-[40px]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">{ledgerModal} <span className="text-indigo-400">Ledger</span></h3>
                                    <p className="text-xs font-bold text-slate-600 font-bold font-black uppercase tracking-widest mt-2">{type === 'sewing' ? 'Sewing' : 'Stone'} Unit History</p>
                                </div>
                            </div>
                            <button onClick={() => setLedgerModal(null)} className="p-4 md:p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={28} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-12 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 italic">Production Records</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {masterData.productions.filter(p => p.worker === ledgerModal && p.status === 'Received' && p.type === type).map((p, i) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-lg md:rounded-xl border border-slate-100 flex justify-between items-center group hover:border-black transition-all">
                                                <div>
                                                    <p className="font-black text-sm md:text-lg uppercase italic">{p.design} <span className="text-xs font-bold text-slate-500 font-bold">#{p.lotNo}</span></p>
                                                    <p className="text-xs font-bold text-slate-600 font-bold uppercase italic mt-1">{p.receiveDate || p.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black italic text-xl md:text-2xl text-black">{(Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)).toLocaleString()} Pcs</p>
                                                    <p className="text-xs font-bold text-indigo-400 uppercase font-black italic">Rate: ৳{p.rate}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 italic">Payment Records</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {masterData.workerPayments.filter(p => p.worker === ledgerModal && p.dept === type).map((p, i) => (
                                            <div key={i} className="bg-emerald-50/30 p-4 rounded-lg md:rounded-xl border border-emerald-100 flex justify-between items-center group hover:border-emerald-500 transition-all">
                                                <div>
                                                    <p className="font-black text-sm md:text-lg uppercase italic text-emerald-600">Payment Out</p>
                                                    <p className="text-xs font-bold text-emerald-300 uppercase italic mt-1">{p.date}</p>
                                                    {p.note && <p className="text-[11px] font-bold text-emerald-400 italic mt-2 leading-tight uppercase font-black">{p.note}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black italic text-2xl md:text-4xl text-emerald-500 tracking-tighter">৳{p.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-5 md:p-14 bg-black border-t-4 border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0 animate-fade-up">
                            <div className="flex flex-col items-center md:items-start gap-1">
                                <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs font-bold font-black italic leading-none mb-1">Total Available Balance (Due)</p>
                                <p className="text-4xl md:text-7xl font-black italic tracking-tighter text-white leading-none">৳{getWorkerDue(ledgerModal).toLocaleString()}</p>
                            </div>
                            <button onClick={() => { setLedgerModal(null); setPayModal(ledgerModal); }} className="w-full md:w-auto px-16 py-6 md:py-10 bg-white text-black rounded-full font-black text-sm md:text-xl uppercase tracking-widest shadow-2xl hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">
                                পেমেন্ট করুন (Pay Now)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic animate-fade-up">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-4xl border-4 border-white shadow-3xl overflow-hidden flex flex-col font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-4 md:p-4 border-b-2 border-slate-50 bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 md:gap-3 text-left">
                                <div className="p-4 md:p-4 bg-amber-500 text-white rounded-[1.2rem] md:rounded-xl shadow-xl rotate-3">
                                    <Settings size={32} className="md:w-[40px] md:h-[40px]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic text-black leading-none">Admin <span className="text-amber-600">Override</span></h3>
                                    <p className="text-[11px] font-bold md:text-xs font-bold font-black text-slate-600 font-bold tracking-[0.4em] uppercase mt-1 italic leading-none">Entry ID: {editModal.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditModal(null)} className="p-4 md:p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-10 custom-scrollbar italic font-black">
                            <form id="editForm" onSubmit={handleEditProduction} className="space-y-10 uppercase">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-3">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Worker</label>
                                        <select name="worker" defaultValue={editModal.worker} className="w-full text-xl md:text-2xl py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-2xl px-8 focus:border-black outline-none appearance-none shadow-sm text-black">
                                            {masterData.workerCategories?.[type]?.map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Design</label>
                                        <select name="design" defaultValue={editModal.design} className="w-full text-xl md:text-2xl py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-2xl px-8 focus:border-black outline-none appearance-none shadow-sm text-black">
                                            {masterData.designs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Color</label>
                                        <select name="color" defaultValue={editModal.color} className="w-full text-xl md:text-2xl py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-2xl px-8 focus:border-black outline-none appearance-none shadow-sm text-black">
                                            {masterData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Lot No</label>
                                        <input name="lotNo" defaultValue={editModal.lotNo} className="w-full text-xl md:text-3xl py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-2xl px-6 text-center focus:border-black outline-none shadow-sm text-black" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Size</label>
                                        <select name="size" defaultValue={editModal.size} className="w-full text-xl md:text-3xl py-6 md:py-8 bg-slate-50 border border-slate-100 rounded-lg md:rounded-2xl px-6 text-center focus:border-black outline-none appearance-none shadow-sm text-black">
                                            {masterData.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Wage Rate</label>
                                        <input name="rate" type="number" defaultValue={editModal.rate} className="w-full text-xl md:text-3xl py-6 md:py-8 bg-emerald-50 text-emerald-600 border-none rounded-lg md:rounded-2xl px-6 text-center focus:ring-4 focus:ring-emerald-100 shadow-inner" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Status</label>
                                        <select name="status" defaultValue={editModal.status} className="w-full text-xl md:text-3xl py-6 md:py-8 bg-black text-white border-none rounded-lg md:rounded-2xl px-6 text-center focus:ring-4 focus:ring-black/5 outline-none appearance-none">
                                            <option value="Pending">PENDING</option>
                                            <option value="Received">RECEIVED</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-5 md:p-14 rounded-2xl md:rounded-[4.5rem] border-2 border-dashed border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-14 shadow-sm animate-fade-up">
                                    <div className="space-y-4 text-center">
                                        <label className="text-xs font-bold text-slate-500 font-bold uppercase tracking-widest font-black italic block leading-none">Issue Borka</label>
                                        <input name="iBorka" type="number" defaultValue={editModal.issueBorka} className="w-full text-center text-3xl md:text-6xl font-black bg-transparent border-none outline-none text-black leading-none italic" />
                                    </div>
                                    <div className="space-y-4 text-center">
                                        <label className="text-xs font-bold text-slate-500 font-bold uppercase tracking-widest font-black italic block leading-none">Issue Hijab</label>
                                        <input name="iHijab" type="number" defaultValue={editModal.issueHijab} className="w-full text-center text-3xl md:text-6xl font-black bg-transparent border-none outline-none text-black leading-none italic" />
                                    </div>
                                    <div className="space-y-4 text-center">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-black italic block leading-none">Rec. Borka</label>
                                        <input name="rBorka" type="number" defaultValue={editModal.receivedBorka} className="w-full text-center text-3xl md:text-6xl font-black bg-transparent border-none outline-none text-emerald-500 leading-none italic" />
                                    </div>
                                    <div className="space-y-4 text-center">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-black italic block leading-none">Rec. Hijab</label>
                                        <input name="rHijab" type="number" defaultValue={editModal.receivedHijab} className="w-full text-center text-3xl md:text-6xl font-black bg-transparent border-none outline-none text-emerald-500 leading-none italic" />
                                    </div>
                                </div>

                                <div className="space-y-4 pb-8">
                                    <label className="text-xs font-bold text-slate-600 font-bold ml-6 tracking-widest uppercase">Special Note (রিমার্কস)</label>
                                    <textarea name="note" defaultValue={editModal.note} className="w-full h-32 md:h-40 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl p-5 md:p-12 focus:border-black outline-none italic font-black shadow-sm text-xl text-black" placeholder="পরিবর্তনের কারণ লিখুন..." />
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col md:flex-row gap-3 md:gap-3 flex-shrink-0 font-black italic">
                            <button onClick={() => setEditModal(null)} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs tracking-widest hover:text-black transition-all order-2 md:order-1">বাতিল (Cancel)</button>
                            <button form="editForm" type="submit" className="flex-[3] py-6 md:py-10 bg-black text-white rounded-full uppercase text-xl md:text-3xl tracking-[0.2em] shadow-2xl border-b-[16px] border-zinc-900 hover:scale-[1.01] transition-all order-1 md:order-2">পরিবর্তন সেভ করুন</button>
                            <button type="button" onClick={() => confirm('Delete Permanently?') && handleDeleteProduction(editModal.id)} className="w-full md:w-auto p-5 md:p-4 bg-rose-50 text-rose-500 rounded-xl md:rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-xl group order-3">
                                <Trash2 size={32} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {payModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic animate-fade-up">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-xl border-4 border-white shadow-3xl overflow-hidden flex flex-col font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="p-5 md:p-14 text-center bg-white border-b-2 border-slate-50 flex-shrink-0">
                            <h3 className="text-3xl md:text-6xl font-black uppercase italic text-black leading-none mb-4 tracking-tighter">বেতন পেমেন্ট</h3>
                            <div className="inline-block px-8 py-3 bg-black text-white rounded-full text-xs font-bold md:text-sm tracking-[0.4em] uppercase font-black italic">{payModal}</div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-16 space-y-12 custom-scrollbar italic font-black">
                            <form id="paymentForm" onSubmit={handleConfirmPayment} className="space-y-12">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest text-center block leading-none mb-2">তারিখ (Date)</label>
                                        <input name="date" type="date" className="w-full py-6 bg-slate-50 border border-slate-100 rounded-lg md:rounded-2xl text-[12px] md:text-lg font-black italic px-8 text-black focus:border-black outline-none shadow-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest text-center block leading-none mb-2">টাকার পরিমাণ (Amount)</label>
                                        <input name="amount" type="number" className="w-full h-24 md:h-32 text-center text-4xl md:text-7xl font-black bg-emerald-50 text-emerald-600 border-none rounded-lg md:rounded-2xl px-6 focus:ring-8 focus:ring-emerald-100 shadow-inner" placeholder="৳" required autoFocus />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest ml-6 block italic leading-none mb-2">রিমার্কস (Optional Note)</label>
                                    <input name="note" className="w-full py-6 md:py-10 text-sm md:text-2xl font-black bg-slate-50 border border-slate-100 text-black placeholder:text-slate-400 font-bold italic uppercase px-10 rounded-lg md:rounded-2xl focus:border-black outline-none shadow-sm" placeholder="পেমেন্ট নোট লিখুন..." />
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col sm:flex-row gap-3 md:gap-3 flex-shrink-0 font-black italic">
                            <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs font-bold md:text-xs tracking-widest hover:text-black transition-all order-2 sm:order-1">বাতিল (Cancel)</button>
                            <button form="paymentForm" type="submit" className="flex-[3] py-6 md:py-10 bg-black text-white rounded-full uppercase text-xl md:text-3xl tracking-[0.2em] shadow-2xl border-b-[16px] border-zinc-900 hover:scale-[1.01] transition-all order-1 sm:order-2">পেমেন্ট নিশ্চিত করুন</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Back Button */}
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
            {/* Recovery Modal */}
            {recoveryModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[400] flex items-center justify-center p-2 md:p-4 text-black italic animate-fade-up">
                    <div className="bg-white rounded-2xl md:rounded-[4.5rem] w-full max-w-xl border-4 border-white shadow-3xl overflow-hidden flex flex-col font-outfit max-h-[96vh]">
                        {/* Sticky Header */}
                        <div className="p-5 md:p-12 border-b-2 border-slate-50 bg-white flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">বকেয়া মাল জমা নিন</h3>
                                <p className="text-[11px] font-bold md:text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-2 italic leading-none">{recoveryModal.design} ({recoveryModal.color}) - Lot: #{recoveryModal.lotNo}</p>
                            </div>
                            <button onClick={() => setRecoveryModal(null)} className="p-4 md:p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={24} /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-14 space-y-12 custom-scrollbar italic font-black">
                            <div className="bg-rose-50 p-5 md:p-12 rounded-2xl md:rounded-3xl border-2 border-rose-100 flex justify-around items-center shadow-inner">
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase font-black text-rose-400 tracking-[0.3em] leading-none mb-3">Borka Due</p>
                                    <p className="text-4xl md:text-7xl font-black italic text-rose-600 tracking-tighter leading-none">{recoveryModal.shortageBorka}</p>
                                </div>
                                <div className="w-px h-16 bg-rose-200"></div>
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase font-black text-rose-400 tracking-[0.3em] leading-none mb-3">Hijab Due</p>
                                    <p className="text-4xl md:text-7xl font-black italic text-rose-600 tracking-tighter leading-none">{recoveryModal.shortageHijab}</p>
                                </div>
                            </div>

                            <form id="recoveryForm" onSubmit={(e) => {
                                e.preventDefault();
                                const rB = Number(e.target.rBorka.value || 0);
                                const rH = Number(e.target.rHijab.value || 0);
                                if (rB > recoveryModal.shortageBorka || rH > recoveryModal.shortageHijab) {
                                    return showNotify('বকেয়া মালের বেশি জমা দেওয়া সম্ভব নয়!', 'error');
                                }
                                handleRecoverShortage(recoveryModal, rB, rH);
                                setRecoveryModal(null);
                            }} className="space-y-10">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest ml-6 block leading-none">Receive Borka</label>
                                        <input
                                            name="rBorka"
                                            type="number"
                                            defaultValue={recoveryModal.shortageBorka}
                                            className="w-full text-center text-4xl md:text-7xl font-black py-8 md:py-12 bg-slate-100 border-none rounded-lg md:rounded-2xl focus:ring-8 focus:ring-black/5 outline-none transition-all placeholder:text-slate-500 font-bold italic"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest ml-6 block leading-none">Receive Hijab</label>
                                        <input
                                            name="rHijab"
                                            type="number"
                                            defaultValue={recoveryModal.shortageHijab}
                                            className="w-full text-center text-4xl md:text-7xl font-black py-8 md:py-12 bg-slate-100 border-none rounded-lg md:rounded-2xl focus:ring-8 focus:ring-black/5 outline-none transition-all placeholder:text-slate-500 font-bold italic"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs font-bold font-black text-center text-slate-500 font-bold uppercase tracking-[0.2em] italic leading-relaxed">বকেয়া থেকে যতোটুকু মাল পুনরুদ্ধার হয়েছে তা ইনপুট দিন।</p>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col sm:flex-row gap-3 md:gap-3 flex-shrink-0 font-black italic">
                            <button type="button" onClick={() => setRecoveryModal(null)} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full uppercase text-xs font-bold md:text-xs tracking-widest hover:text-black transition-all order-2 sm:order-1">Cancel</button>
                            <button form="recoveryForm" type="submit" className="flex-[3] py-6 md:py-10 bg-black text-white rounded-full uppercase text-sm md:text-xl tracking-[0.2em] shadow-2xl border-b-[16px] border-zinc-900 hover:scale-[1.01] transition-all order-1 sm:order-2">পুনরুদ্ধার করুন</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FactoryPanel;
