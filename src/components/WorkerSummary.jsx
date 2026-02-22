import React, { useState } from 'react';
import { UserCheck, Search, Download, TrendingUp } from 'lucide-react';

const WorkerSummary = ({ masterData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');

    const getAllWorkers = () => {
        const sewing = (masterData.workerCategories?.sewing || []).map(w => ({ name: w, dept: 'sewing' }));
        const stone = (masterData.workerCategories?.stone || []).map(w => ({ name: w, dept: 'stone' }));
        const pata = (masterData.workerCategories?.pata || []).map(w => ({ name: w, dept: 'pata' }));
        return [...sewing, ...stone, ...pata];
    };

    const getWorkerStats = (name, dept) => {
        const paid = (masterData.workerPayments || [])
            .filter(p => p.worker === name && p.dept === dept)
            .reduce((s, e) => s + Number(e.amount || 0), 0);

        const monthlySalary = masterData.workerWages?.[dept]?.[name];
        if (monthlySalary) {
            const workerRecords = (masterData.attendance || []).filter(a => a.worker === name && a.department === dept);
            const presentDaysCount = workerRecords.filter(a => a.status === 'present').length;
            const halfDaysCount = workerRecords.filter(a => a.status === 'half-day').length;
            const totalEffectiveDays = presentDaysCount + (halfDaysCount * 0.5);
            const totalBill = workerRecords.reduce((sum, r) => sum + (r.wage || 0), 0);
            return { qty: totalEffectiveDays, bill: totalBill, paid, balance: totalBill - paid, label: 'PRESENT DAYS', subLabel: `SALARY: ৳${monthlySalary}` };
        }

        if (dept === 'pata') {
            const entries = (masterData.pataEntries || []).filter(e => e.worker === name && e.status === 'Received');
            const totalBill = entries.reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const actualQty = entries.reduce((a, b) => a + Number(b.pataQty || 0), 0);
            return { qty: actualQty, bill: totalBill, paid, balance: totalBill - paid, label: 'PATA PRODUCED', subLabel: 'PIECE RATE' };
        } else {
            const entries = (masterData.productions || []).filter(p => p.worker === name && p.type === dept && p.status === 'Received');
            const totalQty = entries.reduce((a, b) => a + Number(b.receivedBorka || 0) + Number(b.receivedHijab || 0), 0);
            const totalBill = entries.reduce((acc, b) => {
                const design = masterData.designs.find(d => d.name === b.design);
                const netBorka = Number(b.receivedBorka || 0);
                const netHijab = Number(b.receivedHijab || 0);
                if (dept === 'sewing') {
                    const bRate = design?.sewingRate || 0;
                    const hRate = design?.hijabRate || bRate;
                    return acc + (netBorka * bRate) + (netHijab * hRate);
                } else {
                    const rate = design?.stoneRate || 0;
                    return acc + ((netBorka + netHijab) * rate);
                }
            }, 0);

            return { qty: totalQty, bill: totalBill, paid, balance: totalBill - paid, label: 'FINISHED GOODS', subLabel: 'PIECE RATE' };
        }
    };

    const filteredWorkers = getAllWorkers()
        .filter(w => (filterDept === 'all' || w.dept === filterDept) && w.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(w => ({ ...w, ...getWorkerStats(w.name, w.dept) }));

    const totalBillAll = filteredWorkers.reduce((a, b) => a + b.bill, 0);

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-2xl">
                    <div className="p-4 bg-black text-white rounded-xl shadow-2xl rotate-3 hover:rotate-0 transition-transform"><UserCheck size={32} /></div>
                    <div>
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Worker <span className="text-slate-100">Stats</span></h2>
                        <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">PERFORMANCE ANALYTICS</p>
                    </div>
                </div>
                <div className="bg-white px-12 py-8 rounded-2xl border-4 border-slate-50 flex flex-col items-end min-w-[300px] shadow-xl">
                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-2">Total Payable</p>
                    <p className="text-5xl font-black italic tracking-tighter text-black">৳{totalBillAll.toLocaleString()}</p>
                </div>
            </div>


            <div className="bg-white p-5 rounded-2xl border-4 border-slate-50 shadow-2xl flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-slate-50 p-4 rounded-full flex items-center gap-3 px-8 border border-slate-100 shadow-inner">
                    <Search size={24} className="text-slate-100" />
                    <input type="text" placeholder="Search Identity..." className="bg-transparent font-black italic border-none outline-none w-full uppercase text-xl text-black placeholder:text-slate-400 font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-slate-50 text-black px-10 rounded-full font-black uppercase text-xs tracking-widest border border-slate-100" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="all">All Dept</option>
                    <option value="sewing">Sewing</option>
                    <option value="stone">Stone</option>
                    <option value="pata">Pata</option>
                </select>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredWorkers.map((w, idx) => (
                    <div key={idx} className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl relative overflow-hidden group hover:border-black transition-all flex flex-col h-96">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-3xl font-black italic uppercase leading-none mb-3 text-black">{w.name}</h4>
                                <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest">{w.dept} DEPT</p>
                            </div>
                        </div>
                        <div className="space-y-6 mt-auto">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner flex justify-between items-center">
                                <div>
                                    <p className="text-[11px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-1">{w.label}</p>
                                    <p className="text-2xl font-black italic text-black">{w.qty} <span className="text-xs font-bold text-slate-500 font-bold">{w.label === 'PRESENT DAYS' ? 'DAYS' : 'PCS'}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-1">Payable</p>
                                    <p className="text-2xl font-black italic text-black">৳{w.bill.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                    <p className="text-[11px] font-bold font-black uppercase tracking-widest mb-1">Paid</p>
                                    <p className="text-2xl font-black italic">৳{w.paid.toLocaleString()}</p>
                                </div>
                                <div className="bg-black text-white p-4 rounded-2xl shadow-xl">
                                    <p className="text-[11px] font-bold font-black text-white/40 uppercase tracking-widest mb-1">Balance</p>
                                    <p className="text-2xl font-black italic">৳{w.balance.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkerSummary;
