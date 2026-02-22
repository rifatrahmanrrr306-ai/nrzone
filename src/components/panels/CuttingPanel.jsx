import React, { useState } from 'react';
import { Plus, Trash2, X, Scissors, Search, CheckCircle, AlertCircle, Save, Minus, Printer, ArrowLeft } from 'lucide-react';
import { getStock, getSewingStock } from '../../utils/calculations';
import { syncToSheet } from '../../utils/syncUtils';

const CuttingPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel }) => {
    const isAdmin = user?.role === 'admin';
    const [showModal, setShowModal] = useState(false);
    const [checkMode, setCheckMode] = useState(null);
    const [checkSelection, setCheckSelection] = useState({ design: '', color: '', size: '' });

    // New State for Modal Form
    const [entryData, setEntryData] = useState({
        design: '',
        color: '',
        cutterName: '',
        lotNo: '',
        sizes: [{ size: '', borka: '', hijab: '' }]
    });
    const [printSlip, setPrintSlip] = useState(null);

    const checkStockResult = (() => {
        if (!checkSelection.design || !checkSelection.color || !checkSelection.size || !checkMode) return { borka: 0, hijab: 0 };
        if (checkMode === 'swing') return getStock(masterData, checkSelection.design, checkSelection.color, checkSelection.size);
        if (checkMode === 'stone') return getSewingStock(masterData, checkSelection.design, checkSelection.color, checkSelection.size);
        return { borka: 0, hijab: 0 };
    })();

    const currentStock = (masterData.cuttingStock || []).reduce((a, b) => a + Number(b.borka || 0) + Number(b.hijab || 0), 0) -
        (masterData.productions || [])
            .filter(p => p.type === 'sewing')
            .reduce((a, b) => a + Number(b.issueBorka || 0) + Number(b.issueHijab || 0), 0);

    const handleAddSizeRow = () => {
        setEntryData(prev => ({
            ...prev,
            sizes: [...prev.sizes, { size: '', borka: '', hijab: '' }]
        }));
    };

    const handleRemoveSizeRow = (index) => {
        if (entryData.sizes.length === 1) return;
        setEntryData(prev => ({
            ...prev,
            sizes: prev.sizes.filter((_, i) => i !== index)
        }));
    };

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...entryData.sizes];
        newSizes[index][field] = value;
        setEntryData(prev => ({ ...prev, sizes: newSizes }));
    };

    const handleAddCutting = () => {
        const finalDesign = entryData.design || 'N/A';
        const finalColor = entryData.color || 'N/A';
        const finalCutter = entryData.cutterName || 'N/A';

        if (user?.role === 'manager') {
            if (!entryData.design || !entryData.color || !entryData.cutterName || !entryData.lotNo) {
                showNotify('ম্যানেজার হিসেবে ডিজাইন, কালার, লট নম্বর এবং মাস্টারের নাম দেওয়া বাধ্যতামূলক!', 'error');
                return;
            }
        }

        const validSizes = entryData.sizes.filter(s => s.size && (Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0));

        if (validSizes.length === 0) {
            showNotify('অন্তত একটি সাইজ এবং সঠিক সংখ্যা দিন!', 'error');
            return;
        }

        const newEntries = validSizes.map(s => ({
            id: Date.now() + Math.random(),
            date: new Date().toLocaleDateString('en-GB'),
            design: finalDesign,
            color: finalColor,
            size: s.size,
            cutterName: finalCutter,
            lotNo: entryData.lotNo || 'N/A',
            borka: Number(s.borka || 0),
            hijab: Number(s.hijab || 0)
        }));

        setMasterData(prev => ({
            ...prev,
            cuttingStock: [...newEntries, ...(prev.cuttingStock || [])]
        }));

        newEntries.forEach(entry => {
            syncToSheet({
                type: "CUTTING_ENTRY",
                worker: entry.cutterName,
                detail: `${entry.design}(${entry.color}) - ${entry.size} - B:${entry.borka} H:${entry.hijab}`,
                amount: 0
            });
        });

        setShowModal(false);
        setEntryData({ design: '', color: '', cutterName: '', lotNo: '', sizes: [{ size: '', borka: '', hijab: '' }] });
        showNotify(`${finalDesign} (${finalColor}) সফলভাবে স্টক এ যোগ হয়েছে!`);
    };



    const handleDelete = (id) => {
        if (!confirm('আপনি কি নিশ্চিত? এটি মুছে ফেলা হবে।')) return;
        setMasterData(prev => ({
            ...prev,
            cuttingStock: (prev.cuttingStock || []).filter(item => item.id !== id)
        }));
        showNotify('কাটিং রেকর্ড মুছে ফেলা হয়েছে!', 'info');
    };

    if (printSlip) {
        return (
            <div className="min-h-screen bg-white text-black p-12 italic font-outfit">
                <style>{`@media print { .no-print { display: none; } }`}</style>
                <div className="flex justify-between items-center mb-4 no-print">
                    <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-slate-600 font-bold px-10 py-4 rounded-full font-black uppercase text-xs hover:text-black transition-all">বন্ধ করুন</button>
                    <button onClick={() => window.print()} className="bg-black text-white px-10 py-4 rounded-full font-black uppercase text-xs shadow-xl hover:scale-105 transition-all">স্লিপ প্রিন্ট করুন</button>
                </div>
                <div className="max-w-2xl mx-auto border-4 border-slate-50 p-16 rounded-3xl text-center bg-white shadow-3xl">
                    <h1 className="text-6xl font-black italic tracking-tighter mb-4 text-black">NRZONE PRO</h1>
                    <p className="text-xs font-bold font-black uppercase tracking-[0.5em] text-slate-600 font-bold mb-4 border-y-2 border-slate-50 py-4">CUTTING DISPATCH SLIP</p>

                    <div className="grid grid-cols-2 gap-3 text-left mb-4">
                        <div className="space-y-2">
                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">Master Name</p>
                            <p className="text-3xl font-black uppercase italic">{printSlip.cutterName}</p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-xs font-bold font-black text-black uppercase tracking-widest">Lot Number</p>
                            <p className="text-4xl font-black uppercase text-black">#{printSlip.lotNo}</p>
                        </div>
                    </div>

                    <div className="space-y-8 text-left bg-slate-50 p-4 rounded-2xl border-2 border-white shadow-inner">
                        <div className="flex justify-between items-center border-b-2 border-white pb-6">
                            <span className="text-xl font-black text-slate-600 font-bold uppercase italic">Design:</span>
                            <span className="text-4xl font-black italic text-black">{printSlip.design}</span>
                        </div>
                        <div className="flex justify-between items-center border-b-2 border-white pb-6">
                            <span className="text-xl font-black text-slate-600 font-bold uppercase italic">Color:</span>
                            <span className="text-3xl font-black italic text-black">{printSlip.color}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-slate-600 font-bold uppercase italic">Size:</span>
                            <span className="text-6xl font-black italic bg-black text-white px-8 py-2 rounded-2xl rotate-3 shadow-2xl">{printSlip.size}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-black text-white p-4 rounded-2xl shadow-3xl">
                            <p className="text-xs font-bold font-black uppercase mb-2 tracking-widest opacity-60">Borka Qty</p>
                            <p className="text-7xl font-black italic">{printSlip.borka}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-white shadow-inner">
                            <p className="text-xs font-bold font-black uppercase mb-2 text-slate-600 font-bold tracking-widest">Hijab Qty</p>
                            <p className="text-7xl font-black italic text-black">{printSlip.hijab}</p>
                        </div>
                    </div>

                    <div className="mt-16 pt-10 border-t-2 border-slate-50 flex justify-between items-center opacity-40 italic">
                        <p className="text-xs font-bold font-black uppercase underline decoration-black decoration-4">Officer Signature</p>
                        <p className="text-xs font-bold font-black uppercase">{printSlip.date}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 bg-white p-5 rounded-3xl border-4 border-slate-50 shadow-xl">
                        <div className="p-4 bg-black text-white rounded-xl shadow-2xl rotate-3 hover:rotate-0 transition-transform">
                            <Scissors size={32} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Cutting <span className="text-slate-100">Panel</span></h2>
                            <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">PRODUCTION HUB</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="bg-white rounded-2xl px-10 py-6 flex flex-col items-end min-w-[280px] border-4 border-slate-50 shadow-xl">
                        <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-[0.4em] mb-2">AVAILABLE STOCK</p>
                        <p className="text-4xl font-black italic tracking-tighter text-black">{currentStock.toLocaleString()} <span className="text-xs not-italic text-slate-400 font-bold">PCS</span></p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-black text-white px-10 rounded-2xl py-8 font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={24} strokeWidth={3} /> NEW CUTTING
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white rounded-3xl p-12 border-4 border-slate-50 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3 text-black">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                            <Search size={24} strokeWidth={3} className="text-slate-400 font-bold" />
                                        </div>
                                        <span>Stock Intelligence</span>
                                    </h3>
                                    <p className="text-xs font-bold text-slate-600 font-bold font-black uppercase tracking-[0.4em] mt-3 italic">REAL-TIME INVENTORY ANALYTICS</p>
                                </div>
                                <div className="flex p-2 bg-slate-50 rounded-3xl border border-slate-100">
                                    <button onClick={() => setCheckMode('swing')} className={`px-10 py-4 rounded-2xl text-xs font-bold font-black uppercase tracking-widest transition-all ${checkMode === 'swing' ? 'bg-black text-white shadow-xl' : 'text-slate-600 font-bold hover:text-black'}`}>Sewing</button>
                                    <button onClick={() => setCheckMode('stone')} className={`px-10 py-4 rounded-2xl text-xs font-bold font-black uppercase tracking-widest transition-all ${checkMode === 'stone' ? 'bg-black text-white shadow-xl' : 'text-slate-600 font-bold hover:text-black'}`}>Stone</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <select className="form-input text-lg font-black uppercase py-6 bg-slate-50 border-slate-100 text-black" onChange={(e) => setCheckSelection(prev => ({ ...prev, design: e.target.value }))} value={checkSelection.design}>
                                    <option value="">DESIGN</option>
                                    {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                </select>
                                <select className="form-input text-lg font-black uppercase py-6 bg-slate-50 border-slate-100 text-black" onChange={(e) => setCheckSelection(prev => ({ ...prev, color: e.target.value }))} value={checkSelection.color}>
                                    <option value="">COLOR</option>
                                    {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select className="form-input text-lg font-black uppercase py-6 bg-slate-50 border-slate-100 text-black" onChange={(e) => setCheckSelection(prev => ({ ...prev, size: e.target.value }))} value={checkSelection.size}>
                                    <option value="">SIZE</option>
                                    {(masterData.sizes || []).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-16 border border-slate-100 italic relative overflow-hidden shadow-inner">

                                {checkMode ? (
                                    <div className="w-full animate-fade-up">
                                        {checkSelection.design && checkSelection.color && !checkSelection.size ? (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center px-8 mb-4 border-b border-slate-100 pb-4">
                                                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-[0.4em]">Size Breakdown</p>
                                                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-[0.4em]">Borka / Hijab</p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-4">
                                                    {(masterData.sizes || []).map(s => {
                                                        const res = checkMode === 'swing'
                                                            ? getStock(masterData, checkSelection.design, checkSelection.color, s)
                                                            : getSewingStock(masterData, checkSelection.design, checkSelection.color, s);

                                                        if (res.borka === 0 && res.hijab === 0) return null;

                                                        return (
                                                            <div key={s} className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                                                <span className="text-2xl font-black italic text-black">{s}</span>
                                                                <div className="flex gap-3">
                                                                    <div className="text-right">
                                                                        <span className="text-[11px] font-bold text-slate-600 font-bold block uppercase font-bold">Borka</span>
                                                                        <span className="text-xl font-black text-black">{res.borka}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-[11px] font-bold text-slate-600 font-bold block uppercase font-bold">Hijab</span>
                                                                        <span className="text-xl font-black text-black">{res.hijab}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {!(masterData.sizes || []).some(s => {
                                                        const res = checkMode === 'swing'
                                                            ? getStock(masterData, checkSelection.design, checkSelection.color, s)
                                                            : getSewingStock(masterData, checkSelection.design, checkSelection.color, s);
                                                        return res.borka > 0 || res.hijab > 0;
                                                    }) && (
                                                            <p className="text-center py-10 text-slate-400 font-bold font-black uppercase tracking-widest text-xs">No Stock Available</p>
                                                        )}
                                                </div>

                                            </div>
                                        ) : checkSelection.size ? (
                                            <div className="flex w-full items-center justify-around">
                                                <div className="flex flex-col items-center">
                                                    <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.5em] mb-4">BORKA</p>
                                                    <p className="text-8xl font-black italic tracking-tighter leading-none text-black">{checkStockResult.borka}</p>
                                                </div>
                                                <div className="w-[4px] h-32 bg-slate-200 rounded-full"></div>
                                                <div className="flex flex-col items-center">
                                                    <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.5em] mb-4">HIJAB</p>
                                                    <p className="text-8xl font-black italic tracking-tighter leading-none text-black">{checkStockResult.hijab}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-14 text-slate-100 flex flex-col items-center gap-3">
                                                <Search size={64} strokeWidth={1} className="opacity-20" />
                                                <p className="text-[11px] font-black uppercase tracking-[0.6em] text-center">SELECT DESIGN & COLOR TO SEE BREAKDOWN</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-14 text-slate-100 flex flex-col items-center gap-3">
                                        <Search size={64} strokeWidth={1} className="opacity-20" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.6em]">SELECT PARAMETERS TO PROBE DATA</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border-4 border-slate-50 overflow-hidden shadow-2xl">
                        <div className="p-12 border-b border-slate-100 flex justify-between items-center text-black">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">কাটিং ডাটাবেস</h3>
                                <p className="text-xs font-bold text-slate-600 font-bold font-black uppercase tracking-[0.4em] mt-3">RECENT PRODUCTION ARTIFACTS</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 px-8 py-3 rounded-full text-xs font-bold font-black uppercase tracking-widest italic text-black flex items-center justify-center">{(masterData.cuttingStock || []).length} RECORDS</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left uppercase text-black">
                                <thead className="bg-slate-50 text-slate-600 font-bold font-black text-xs font-bold tracking-[0.4em] italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-12 py-8">TIMESTAMP</th>
                                        <th className="px-12 py-8">DESIGN / COLOR / SIZE</th>
                                        <th className="px-12 py-8 text-center">BORKA</th>
                                        <th className="px-12 py-8 text-center">HIJAB</th>
                                        <th className="px-12 py-8 text-right">OPS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(masterData.cuttingStock || []).map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-all group">
                                            <td className="px-12 py-10 font-black text-[11px] text-slate-400 font-bold">{s.date}</td>
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-black text-white px-4 py-2 rounded-xl font-black text-xl italic">{s.size}</div>
                                                    <div>
                                                        <p className="font-black text-2xl italic tracking-tighter leading-none text-black">{s.design}</p>
                                                        <p className="text-xs font-bold text-slate-600 font-bold font-black mt-2 tracking-widest">{s.color} • {s.cutterName} • LOT: {s.lotNo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center font-black text-4xl italic tracking-tighter text-black">{s.borka}</td>
                                            <td className="px-12 py-10 text-center font-black text-4xl italic tracking-tighter text-black">{s.hijab}</td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => setPrintSlip(s)} className="p-5 bg-black text-white rounded-2xl shadow-xl hover:scale-110 transition-all"><Printer size={20} /></button>
                                                    {isAdmin && (
                                                        <button onClick={() => handleDelete(s.id)} className="p-5 bg-white border-2 border-slate-100 text-rose-500 rounded-2xl shadow-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="bg-white rounded-3xl p-12 flex items-center justify-between border-4 border-slate-50 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-500">
                                <CheckCircle size={32} />
                            </div>
                            <div>
                                <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-[0.4em] mb-1">SYSTEM STATUS</p>
                                <p className="text-xl font-black italic tracking-tighter leading-none text-black">OPERATION NOMINAL</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-black animate-spin"></div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[300] flex items-center justify-center p-2 md:p-4 text-black italic">
                    <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-6xl border-4 border-white shadow-3xl animate-fade-up max-h-[96vh] flex flex-col overflow-hidden italic font-outfit">
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-4 md:p-4 border-b-2 border-slate-50 bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 md:gap-3">
                                <div className="p-4 md:p-4 bg-black text-white rounded-[1.2rem] md:rounded-xl shadow-2xl rotate-3">
                                    <Plus size={32} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-2xl md:text-5xl tracking-tighter leading-none">কাটিং এন্ট্রি</h3>
                                    <p className="text-[11px] font-bold md:text-xs font-bold text-slate-600 font-bold font-black uppercase tracking-[0.4em] mt-2 italic">Advanced Production Injection</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setShowModal(false);
                                setEntryData({ design: '', color: '', cutterName: '', lotNo: '', sizes: [{ size: '', borka: '', hijab: '' }] });
                            }} className="p-4 md:p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all text-black"><X size={28} /></button>
                        </div>

                        {/* Scrollable Content Container */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-12 italic custom-scrollbar">
                            <div className="bg-slate-50 p-4 md:p-4 rounded-xl md:rounded-3xl border-2 border-white shadow-inner space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-8 bg-black rounded-full" />
                                    <h4 className="text-lg md:text-xl font-black uppercase tracking-widest italic leading-none">১. মাস্টার ও ডিজাইন (Identity)</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest">মাস্টার বা কারিগর (Master)</label>
                                        <select className="w-full text-xl md:text-2xl font-black py-5 md:py-6 bg-white border-none rounded-lg md:rounded-xl px-8 focus:ring-4 focus:ring-black/5 outline-none text-black italic transition-all appearance-none shadow-sm" value={entryData.cutterName} onChange={(e) => setEntryData(p => ({ ...p, cutterName: e.target.value }))}>
                                            <option value="">--</option>
                                            {(masterData.cutters || []).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest">ডিজাইন (Style)</label>
                                        <select className="w-full text-xl md:text-2xl font-black py-5 md:py-6 bg-white border-none rounded-lg md:rounded-xl px-8 focus:ring-4 focus:ring-black/5 outline-none text-black italic transition-all appearance-none shadow-sm" value={entryData.design} onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}>
                                            <option value="">--</option>
                                            {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest">কালার (Color)</label>
                                        <select className="w-full text-xl md:text-2xl font-black py-5 md:py-6 bg-white border-none rounded-lg md:rounded-xl px-8 focus:ring-4 focus:ring-black/5 outline-none text-black italic transition-all appearance-none shadow-sm" value={entryData.color} onChange={(e) => setEntryData(p => ({ ...p, color: e.target.value }))}>
                                            <option value="">--</option>
                                            {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 tracking-widest">লট নম্বর (Lot Number)</label>
                                    <input
                                        type="text"
                                        placeholder="LOT-XXXX"
                                        className="w-full text-3xl md:text-5xl font-black py-6 md:py-10 bg-black text-white border-none rounded-xl md:rounded-3xl px-8 md:px-14 focus:ring-8 focus:ring-black/5 outline-none italic transition-all placeholder:text-zinc-800 shadow-2xl"
                                        value={entryData.lotNo}
                                        onChange={(e) => setEntryData(p => ({ ...p, lotNo: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="bg-white p-4 md:p-4 rounded-2xl md:rounded-3xl border-4 border-slate-50 shadow-3xl space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                                    <h4 className="text-lg md:text-xl font-black uppercase tracking-widest italic text-emerald-600 leading-none">২. সাইজ ও সংখ্যা (Size & Quantity)</h4>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-50 pb-6 gap-3">
                                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest italic">সব সাইজের মাল একসাথেই এন্ট্রি দিন</p>
                                    <button onClick={handleAddSizeRow} className="flex items-center gap-3 px-6 md:px-8 py-3 bg-slate-50 text-black border-2 border-slate-100 rounded-full text-xs font-bold font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm">
                                        <Plus size={16} /> নতুন সাইজ যোগ করুন
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3">
                                    {entryData.sizes.map((row, idx) => (
                                        <div key={idx} className="bg-slate-50/50 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-white space-y-6 relative group/size hover:border-black/10 transition-all shadow-sm">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-4 tracking-widest italic">Size</label>
                                                <select className="w-full bg-white text-black border-none rounded-2xl px-6 h-16 text-xl font-black italic outline-none focus:ring-4 focus:ring-black/5 appearance-none shadow-sm" value={row.size} onChange={(e) => handleSizeChange(idx, 'size', e.target.value)}>
                                                    <option value="">--</option>
                                                    {(masterData.sizes || []).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 md:gap-3">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold font-black text-slate-500 font-bold uppercase text-center block tracking-widest italic">Borka</label>
                                                    <input type="number" className="w-full h-16 md:h-20 text-center font-black text-3xl md:text-4xl bg-white border-none rounded-2xl outline-none focus:ring-4 focus:ring-black/5 shadow-inner" placeholder="0" value={row.borka} onChange={(e) => handleSizeChange(idx, 'borka', e.target.value)} />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold font-black text-emerald-400 uppercase text-center block tracking-widest italic">Hijab</label>
                                                    <input type="number" className="w-full h-16 md:h-20 text-center font-black text-3xl md:text-4xl bg-emerald-50 text-emerald-600 border-none rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner" placeholder="0" value={row.hijab} onChange={(e) => handleSizeChange(idx, 'hijab', e.target.value)} />
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveSizeRow(idx)} className="absolute -top-4 -right-4 p-3 bg-white text-rose-500 border-2 border-slate-50 rounded-full shadow-xl opacity-0 group-hover/size:opacity-100 transition-all hover:bg-rose-500 hover:text-white"><X size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 md:p-12 border-t-2 border-slate-50 bg-white flex flex-col md:flex-row gap-3 md:gap-3 flex-shrink-0">
                            <button onClick={() => {
                                setShowModal(false);
                                setEntryData({ design: '', color: '', cutterName: '', lotNo: '', sizes: [{ size: '', borka: '', hijab: '' }] });
                            }} className="flex-1 py-6 md:py-10 bg-slate-50 text-slate-600 font-bold rounded-full font-black uppercase text-xs font-bold md:text-xs tracking-widest hover:text-black transition-all order-2 md:order-1">Cancel</button>
                            <button onClick={handleAddCutting} className="flex-[3] py-6 md:py-10 rounded-full bg-black text-white font-black text-xl md:text-3xl uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all order-1 md:order-2">
                                DATA INJECTION
                            </button>
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

export default CuttingPanel;
