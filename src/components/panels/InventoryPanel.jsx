import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, AlertCircle, History, ArrowRight, ArrowDownLeft, ArrowUpRight, Filter, Wallet, X, ArrowLeft } from 'lucide-react';
import { syncToSheet } from '../../utils/syncUtils';
import { getFinishedStock, getPataStockSummary } from '../../utils/calculations';

const InventoryPanel = ({ masterData, setMasterData, showNotify, setActivePanel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [transactionType, setTransactionType] = useState('in'); // 'in' or 'out'
    const [view, setView] = useState('overview'); // 'overview', 'raw', 'lots', 'pata', 'add'
    const [selectedLotDetail, setSelectedLotDetail] = useState(null);

    const summary = useMemo(() => {
        const items = [];
        masterData.designs.forEach(d => {
            masterData.colors.forEach(c => {
                masterData.sizes.forEach(s => {
                    const res = getFinishedStock(masterData, d.name, c, s);
                    if (res.borka > 0 || res.hijab > 0) {
                        items.push({ design: d.name, color: c, size: s, borka: res.borka, hijab: res.hijab });
                    }
                });
            });
        });
        return items;
    }, [masterData]);

    const lotMatrix = useMemo(() => {
        const matrix = {};

        // 1. Cutting Foundation
        (masterData.cuttingStock || []).forEach(c => {
            const key = `${c.lotNo}|${c.design}|${c.color}`;
            if (!matrix[key]) {
                matrix[key] = { lotNo: c.lotNo, design: c.design, color: c.color, date: c.date, sizes: {} };
            }
            if (!matrix[key].sizes[c.size]) {
                matrix[key].sizes[c.size] = { cutB: 0, cutH: 0, issuedB: 0, issuedH: 0, receivedB: 0, receivedH: 0 };
            }
            matrix[key].sizes[c.size].cutB += Number(c.borka || 0);
            matrix[key].sizes[c.size].cutH += Number(c.hijab || 0);
        });

        // 2. Production Issues/Receipts (Sewing is usually the primary gateway for body stock)
        (masterData.productions || []).forEach(p => {
            const key = `${p.lotNo}|${p.design}|${p.color}`;
            if (matrix[key] && matrix[key].sizes[p.size]) {
                const s = matrix[key].sizes[p.size];
                if (p.type === 'sewing') {
                    s.issuedB += Number(p.issueBorka || 0);
                    s.issuedH += Number(p.issueHijab || 0);
                    s.receivedB += Number(p.receivedBorka || 0);
                    s.receivedH += Number(p.receivedHijab || 0);
                }
            }
        });

        return Object.values(matrix).sort((a, b) => b.lotNo.localeCompare(a.lotNo));
    }, [masterData]);

    const pataSummary = useMemo(() => getPataStockSummary(masterData), [masterData]);

    const inventory = useMemo(() => {
        const logs = masterData.rawInventory || [];
        const stock = {};
        logs.forEach(log => {
            const key = log.color ? `${log.item} (${log.color})` : log.item;
            if (!stock[key]) stock[key] = { name: log.item, color: log.color || null, qty: 0, lastUpdated: log.date };
            if (log.type === 'in') stock[key].qty += Number(log.qty);
            else if (log.type === 'out') stock[key].qty -= Number(log.qty);
        });
        return Object.values(stock).sort((a, b) => a.name.localeCompare(b.name));
    }, [masterData.rawInventory]);

    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.color && i.color.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleTransaction = (e) => {
        e.preventDefault();
        const form = e.target;
        const item = form.item.value;
        const color = form.color?.value || '';
        const qty = Number(form.qty.value);

        if (!item || qty <= 0) return;

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-GB'),
            item, color, qty, type: transactionType,
            note: form.note.value
        };

        setMasterData(prev => ({ ...prev, rawInventory: [newEntry, ...(prev.rawInventory || [])] }));

        syncToSheet({
            type: `STOCK_${transactionType.toUpperCase()}`,
            detail: `${item}${color ? ` (${color})` : ''}`,
            amount: qty
        });

        setShowModal(false);
        showNotify(`স্টক ${transactionType === 'in' ? 'যোগ' : 'কমানো'} হয়েছে!`);
    };

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 bg-white p-4 premium-card rounded-3xl border-4 border-slate-50 shadow-xl w-full md:w-auto">
                        <div className="p-4 bg-black text-white rounded-2xl shadow-2xl rotate-3 transition-transform hover:rotate-0">
                            <Package size={36} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Stock <span className="text-slate-100">Matrix</span></h2>
                            <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">INVENTORY DIVISION</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl px-12 py-8 flex flex-col items-center md:items-end border-4 border-slate-50 shadow-xl min-w-[300px] w-full md:w-auto">
                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-2">FINISHED ASSETS</p>
                    <p className="text-5xl font-black italic tracking-tighter text-black">
                        {masterData.productions?.filter(p => p.status === 'Received').length.toLocaleString()}
                        <span className="text-sm not-italic text-slate-400 font-bold ml-2">BATCHES</span>
                    </p>
                </div>
            </div>

            <div className="flex bg-white p-3 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto no-scrollbar gap-2">
                {[
                    { id: 'overview', label: 'তৈরি পোশাক' },
                    { id: 'lots', label: 'লট পজিশন' },
                    { id: 'pata', label: 'pata লাইভ স্টক' },
                    { id: 'raw', label: 'কাঁচামাল' },
                    { id: 'add', label: 'নতুন স্টক' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setView(tab.id)} className={`flex-1 min-w-[120px] py-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${view === tab.id ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:text-black'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {view === 'overview' && (
                <div className="grid grid-cols-1 gap-3">
                    <div className="bg-white rounded-3xl border-4 border-slate-50 overflow-hidden shadow-2xl">
                        <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-3xl font-black uppercase italic text-black">Finished Goods Stock</h3>
                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest italic">{summary.length} ITEMS</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left uppercase">
                                <thead className="bg-slate-50/50 text-slate-600 font-bold font-black text-xs font-bold tracking-[0.4em] italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-12 py-8">DESIGN / COLOR</th>
                                        <th className="px-12 py-8">SIZE</th>
                                        <th className="px-12 py-8 text-center">BORKA</th>
                                        <th className="px-12 py-8 text-center">HIJAB</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {summary.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-all group">
                                            <td className="px-12 py-10">
                                                <p className="font-black text-2xl italic tracking-tighter text-black leading-none">{item.design}</p>
                                                <p className="text-xs font-bold font-black text-slate-400 font-bold mt-2 tracking-widest">{item.color}</p>
                                            </td>
                                            <td className="px-12 py-10">
                                                <span className="bg-slate-50 text-slate-600 font-bold px-4 py-2 rounded-xl font-black border border-slate-100">{item.size}</span>
                                            </td>
                                            <td className="px-12 py-10 text-center font-black text-4xl italic tracking-tighter text-black">{item.borka}</td>
                                            <td className="px-12 py-10 text-center font-black text-4xl italic tracking-tighter text-black">{item.hijab}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {view === 'lots' && (
                <div className="space-y-12 animate-fade-up">
                    <div className="bg-white p-4 premium-card border-4 border-slate-50 shadow-xl rounded-2xl flex items-center gap-3">
                        <Search size={32} className="text-slate-100" />
                        <input type="text" placeholder="Search Lot No / Design..." className="flex-1 bg-transparent text-4xl font-black italic border-none outline-none leading-none h-auto placeholder:text-slate-100 text-black uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lotMatrix.filter(l => l.lotNo.toUpperCase().includes(searchTerm.toUpperCase()) || l.design.toUpperCase().includes(searchTerm.toUpperCase())).map((lot, idx) => {
                            const totalCut = Object.values(lot.sizes).reduce((sum, s) => sum + s.cutB + s.cutH, 0);
                            const totalIssued = Object.values(lot.sizes).reduce((sum, s) => sum + s.issuedB + s.issuedH, 0);
                            const totalReceived = Object.values(lot.sizes).reduce((sum, s) => sum + s.receivedB + s.receivedH, 0);
                            const liveInCutting = totalCut - totalIssued;
                            const inFactory = totalIssued - totalReceived;

                            return (
                                <div key={idx} onClick={() => setSelectedLotDetail(lot)} className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-xl flex flex-col justify-between h-auto min-h-[400px] group hover:border-black transition-all cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-5 opacity-5 text-black"><Package size={100} /></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-black text-white px-6 py-2 rounded-full font-black text-xs font-bold uppercase tracking-widest italic shadow-xl">LOT: {lot.lotNo}</span>
                                            <span className="text-xs font-bold font-black text-slate-500 font-bold uppercase italic">{lot.date}</span>
                                        </div>
                                        <h4 className="text-4xl font-black italic uppercase leading-none mb-3 text-black">{lot.design}</h4>
                                        <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] italic mb-5 border-b-2 border-slate-50 pb-4">{lot.color}</p>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-white shadow-inner">
                                                <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase italic">Live In Cutting</p>
                                                <p className="text-3xl font-black italic text-black">{liveInCutting} PCS</p>
                                            </div>
                                            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-3xl border border-blue-50">
                                                <p className="text-xs font-bold font-black text-blue-400 uppercase italic">In Factory (Active)</p>
                                                <p className="text-3xl font-black italic text-blue-600">{inFactory} PCS</p>
                                            </div>
                                            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-3xl border border-emerald-50">
                                                <p className="text-xs font-bold font-black text-emerald-400 uppercase italic">Completed Body</p>
                                                <p className="text-3xl font-black italic text-emerald-600">{totalReceived} PCS</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="mt-5 w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs font-bold tracking-widest italic opacity-0 group-hover:opacity-100 transition-all">View Details</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'pata' && (
                <div className="space-y-12 animate-fade-up">
                    <div className="bg-white rounded-3xl border-4 border-slate-50 overflow-hidden shadow-2xl">
                        <div className="p-12 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-3xl font-black uppercase italic text-black">Pata Inventory Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left uppercase">
                                <thead className="bg-slate-50/50 text-slate-600 font-bold font-black text-xs font-bold tracking-[0.4em] italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-12 py-8">Style / Color</th>
                                        <th className="px-12 py-8">Pata Type</th>
                                        <th className="px-12 py-8 text-center">Applied (Spent)</th>
                                        <th className="px-12 py-8 text-right">Available Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pataSummary.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                                            <td className="px-12 py-10">
                                                <p className="font-black text-2xl italic tracking-tighter text-black leading-none">{item.design}</p>
                                                <p className="text-xs font-bold font-black text-slate-400 font-bold mt-2 tracking-widest">{item.color}</p>
                                            </td>
                                            <td className="px-12 py-10 font-black italic text-slate-600 font-bold">{item.type}</td>
                                            <td className="px-12 py-10 text-center font-black text-2xl italic text-slate-400 font-bold">{item.spent}</td>
                                            <td className="px-12 py-10 text-right font-black text-5xl italic tracking-tighter text-black">
                                                {item.balance} <span className="text-xs font-bold not-italic text-slate-500 font-bold">PCS</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {pataSummary.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center text-slate-400 font-bold font-black uppercase tracking-[0.5em] italic">No Pata Stock Data</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {view === 'raw' && (
                <>
                    <div className="bg-white p-4 balanced-card border-4 border-slate-50 shadow-xl rounded-2xl flex items-center gap-3">
                        <Search size={32} className="text-slate-100" />
                        <input type="text" placeholder="Search Materials..." className="flex-1 bg-transparent text-4xl font-black italic border-none outline-none leading-none h-auto placeholder:text-slate-100 text-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredInventory.map((item, idx) => (
                            <div key={idx} className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-xl flex flex-col justify-between h-80 group hover:border-black transition-all">
                                <div>
                                    <h4 className="text-4xl font-black italic uppercase leading-none mb-3 text-black">{item.name}</h4>
                                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">{item.color || 'STANDARD'}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className={`text-6xl font-black italic tracking-tighter ${item.qty <= 5 ? 'text-rose-500' : 'text-black'}`}>{item.qty}</p>
                                    <p className="text-xs font-bold font-black text-slate-400 font-bold uppercase tracking-widest mb-1 italic">PACKETS / UNITS</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'add' && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-3">
                    <button onClick={() => { setTransactionType('out'); setShowModal(true); }} className="px-10 py-6 rounded-2xl font-black uppercase text-xs tracking-widest bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all w-full md:w-auto">Deduct Stock</button>
                    <button onClick={() => { setTransactionType('in'); setShowModal(true); }} className="px-12 py-6 rounded-2xl bg-black text-white font-black uppercase text-xs tracking-widest shadow-2xl border-b-[12px] border-zinc-900 w-full md:w-auto">Add Stock</button>
                </div>
            )}

            {selectedLotDetail && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 text-black">
                    <div className="bg-white rounded-[5rem] w-full max-w-4xl border-4 border-slate-50 shadow-3xl p-16 space-y-12 animate-fade-up max-h-[90vh] overflow-y-auto italic">
                        <div className="flex justify-between items-center pb-8 border-b-2 border-slate-50">
                            <div>
                                <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none mb-4">LOT: {selectedLotDetail.lotNo}</h3>
                                <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] italic">{selectedLotDetail.design} • {selectedLotDetail.color}</p>
                            </div>
                            <button onClick={() => setSelectedLotDetail(null)} className="p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={32} /></button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left uppercase">
                                <thead className="text-xs font-bold font-black text-slate-500 font-bold tracking-[0.3em] italic border-b-2 border-slate-50">
                                    <tr>
                                        <th className="py-6">Size</th>
                                        <th className="py-6 text-center">Cut (B/H)</th>
                                        <th className="py-6 text-center">In Factory (Active)</th>
                                        <th className="py-6 text-right">Received (Live)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-50">
                                    {Object.entries(selectedLotDetail.sizes).map(([size, data]) => {
                                        const liveInCutting = (data.cutB + data.cutH) - (data.issuedB + data.issuedH);
                                        const activeInFactory = (data.issuedB + data.issuedH) - (data.receivedB + data.receivedH);

                                        return (
                                            <tr key={size} className="hover:bg-slate-50 transition-all">
                                                <td className="py-8">
                                                    <span className="bg-black text-white px-6 py-2 rounded-xl text-xl font-black italic shadow-lg">{size}</span>
                                                </td>
                                                <td className="py-8 text-center">
                                                    <p className="font-black text-3xl italic text-slate-500 font-bold leading-none">{(data.cutB + data.cutH)}</p>
                                                    <p className="text-[11px] font-bold font-black text-slate-400 font-bold mt-2">B:{data.cutB} H:{data.cutH}</p>
                                                </td>
                                                <td className="py-8 text-center">
                                                    <p className={`font-black text-3xl italic leading-none ${activeInFactory > 0 ? 'text-blue-500' : 'text-slate-100'}`}>{activeInFactory}</p>
                                                    {activeInFactory > 0 && <p className="text-[11px] font-bold font-black text-blue-200 mt-2 uppercase tracking-widest">In Process</p>}
                                                </td>
                                                <td className="py-8 text-right">
                                                    <p className="font-black text-5xl italic tracking-tighter text-emerald-600 leading-none">{data.receivedB + data.receivedH}</p>
                                                    <p className="text-[11px] font-bold font-black text-emerald-400 mt-2 uppercase tracking-widest">Live Body</p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 text-black">
                    <div className="bg-white w-full max-w-lg rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden p-16 space-y-12 animate-fade-up">
                        <div className="text-center">
                            <h3 className="text-4xl font-black uppercase italic mb-2 text-black">স্টক {transactionType === 'in' ? 'যোগ' : 'বিয়োগ'}</h3>
                            <p className="text-xl font-black tracking-widest text-slate-600 font-bold italic">Inventory Adjustment</p>
                        </div>
                        <form onSubmit={handleTransaction} className="space-y-8 uppercase">
                            <input name="item" list="items-list" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 font-bold" placeholder="Material Name..." required />
                            <input name="color" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 font-bold" placeholder="Color (optional)" />
                            <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center shadow-inner">
                                <label className="bg-black text-white px-3 py-1 rounded-sm text-xs font-bold font-black uppercase italic tracking-widest inline-block mb-4 shadow-lg">Quantity</label>
                                <input name="qty" type="number" className="w-full text-center text-[10rem] font-black bg-transparent border-none text-black outline-none leading-none h-44" autoFocus />
                            </div>
                            <input name="note" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 font-bold" placeholder="Reference Note..." />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-100 text-black hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900">Update Stock</button>
                            </div>
                        </form>
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

export default InventoryPanel;
