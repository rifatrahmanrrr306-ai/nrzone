import React, { useMemo } from 'react';
import { Activity, Scissors, Layers, Hammer, Package, Truck, Users, Database, DollarSign, FileText, TrendingUp, AlertCircle, MessageSquare, LayoutGrid, Plus } from 'lucide-react';

const Overview = ({ masterData, setMasterData, setActivePanel, user }) => {
    const stats = useMemo(() => {
        const today = new Date().toLocaleDateString('en-GB');
        const productionToday = (masterData.productions || []).filter(p => p.date === today).length;
        const totalProduction = (masterData.productions || []).length;

        const activeCutting = (masterData.cuttingStock || []).filter(c => !c.isDistributed).length;
        const pendingPata = (masterData.pataEntries || []).filter(p => p.status !== 'Received').length;

        const clientPaymentsToday = (masterData.clientEntries || [])
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + (Number(e.payment) || 0), 0);

        const inventory = {};
        (masterData.rawInventory || []).forEach(log => {
            const key = log.color ? `${log.item} (${log.color})` : log.item;
            if (!inventory[key]) inventory[key] = { name: log.item, color: log.color, qty: 0 };
            if (log.type === 'in') inventory[key].qty += Number(log.qty);
            else if (log.type === 'out') inventory[key].qty -= Number(log.qty);
        });
        const lowStock = Object.values(inventory).filter(i => i.qty <= 5);

        // Recent Activity Feed (Last 10 items)
        const recentActivity = [
            ...(masterData.productions || []).map(p => ({ ...p, activityType: 'Factory', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50' })),
            ...(masterData.cuttingStock || []).map(c => ({ ...c, activityType: 'Cutting', icon: Scissors, color: 'text-black', bg: 'bg-slate-100' })),
            ...(masterData.pataEntries || []).map(p => ({ ...p, activityType: 'Pata', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' }))
        ].sort((a, b) => {
            // Sorting by date (assuming DD/MM/YYYY format, needs conversion for reliable sorting or use ID if timestamp)
            return (b.id || 0) - (a.id || 0);
        }).slice(0, 15);

        return { productionToday, totalProduction, activeCutting, pendingPata, clientPaymentsToday, lowStock, recentActivity };
    }, [masterData]);

    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';

    const [note, setNote] = React.useState('');
    const handleSendNote = () => {
        if (!note) return;
        const newNote = { id: Date.now(), from: user.name, text: note, date: new Date().toLocaleString() };
        setMasterData(prev => ({
            ...prev,
            adminNotes: [...(prev.adminNotes || []), newNote]
        }));
        setNote('');
    };

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">

            <div className="flex flex-col lg:flex-row justify-between items-start md:items-end gap-12">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-black text-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700">
                        <Activity size={32} strokeWidth={3} className="md:w-[48px] md:h-[48px] animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mb-3">SYSTEM ALIVE</p>
                        <h1 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-none text-black">FACTORY <span className="text-slate-400 font-bold">LIVE</span></h1>
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar w-full md:w-auto">
                    <div className="bg-white px-10 py-8 rounded-3xl border-4 border-slate-50 shadow-2xl min-w-[220px]">
                        <p className="text-xs font-bold font-black uppercase tracking-widest text-slate-600 font-bold mb-3 italic">Output Today</p>
                        <p className="text-4xl font-black italic tracking-tighter text-black">+{stats.productionToday}<span className="text-xs ml-2 text-slate-400 font-bold">PCS</span></p>
                    </div>
                    <div className="bg-white px-10 py-8 rounded-3xl border-4 border-slate-50 shadow-2xl min-w-[220px]">
                        <p className="text-xs font-bold font-black uppercase tracking-widest text-slate-600 font-bold mb-3 italic">Cutting Queue</p>
                        <p className="text-4xl font-black italic tracking-tighter text-black">{stats.activeCutting}<span className="text-xs ml-2 text-slate-400 font-bold">LOTS</span></p>
                    </div>
                    <div className="bg-white px-10 py-8 rounded-3xl border-4 border-slate-50 shadow-2xl min-w-[220px]">
                        <p className="text-xs font-bold font-black uppercase tracking-widest text-slate-600 font-bold mb-3 italic">Pata Hub</p>
                        <p className="text-4xl font-black italic tracking-tighter text-black">{stats.pendingPata}<span className="text-xs ml-2 text-slate-400 font-bold">ACTIVE</span></p>
                    </div>

                    <button
                        onClick={() => setActivePanel('Menu')}
                        className="bg-black text-white px-12 py-8 rounded-3xl shadow-2xl min-w-[240px] flex items-center justify-center gap-3 hover:scale-105 transition-all group border-b-[12px] border-zinc-900"
                    >
                        <div className="p-4 bg-white/10 rounded-2xl group-hover:rotate-12 transition-transform">
                            <LayoutGrid size={24} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-xl font-black italic leading-none uppercase">Main Menu</p>
                            <p className="text-[8px] font-black uppercase text-slate-600 font-bold tracking-widest mt-1">Full System Hub</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActivePanel('Swing')}
                        className="bg-indigo-600 text-white px-12 py-8 rounded-3xl shadow-2xl min-w-[240px] flex items-center justify-center gap-3 hover:scale-105 transition-all group border-b-[12px] border-indigo-900"
                    >
                        <div className="p-4 bg-white/10 rounded-2xl group-hover:rotate-12 transition-transform">
                            <Plus size={24} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-xl font-black italic leading-none uppercase">Issue Work</p>
                            <p className="text-[8px] font-black uppercase text-indigo-200 tracking-widest mt-1">Quick Action</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: Active Monitor List */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white p-12 rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden min-h-[600px]">
                        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-50 pb-8">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse"></div>
                                Live Production Stream
                            </h3>
                            <button onClick={() => window.location.reload()} className="p-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-black hover:text-white transition-all"><TrendingUp size={18} /></button>
                        </div>

                        <div className="space-y-6">
                            {stats.recentActivity.map((act, i) => (
                                <div key={act.id || i} className="group bg-slate-50/50 hover:bg-white p-4 md:p-5 rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-xl transition-all duration-500 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform ${act.bg}`}>
                                            <act.icon size={24} className={act.color} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${act.activityType === 'Factory' ? 'bg-blue-500' : act.activityType === 'Cutting' ? 'bg-black' : 'bg-amber-500'}`}>
                                                    {act.activityType}
                                                </span>
                                                <p className="text-xs font-bold font-black text-slate-400 font-bold uppercase tracking-widest">{act.date}</p>
                                            </div>
                                            <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter leading-none mt-2 text-black">
                                                {act.activityType === 'Factory' ? `${act.worker} - ${act.design}` : act.activityType === 'Cutting' ? `Cutting: ${act.design}` : `${act.worker} - ${act.pataType}`}
                                            </h4>
                                            <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mt-2">{act.color || act.pataStoneColors}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none text-black">
                                            +{act.issueBorka || act.issueHijab || act.borka || act.pataQty || 0}
                                        </p>
                                        <p className="text-[8px] font-black text-slate-400 font-bold uppercase tracking-widest mt-1">TOTAL ASSETS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Insights & Alerts */}
                <div className="space-y-10">
                    {isAdmin && (masterData.adminNotes || []).length > 0 && (
                        <div className="bg-black text-white p-12 rounded-[5rem] shadow-2xl space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                <MessageSquare size={120} />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic flex items-center gap-3 relative z-10">Manager Notes</h3>
                            <div className="space-y-6 relative z-10 max-h-[300px] overflow-y-auto no-scrollbar">
                                {(masterData.adminNotes || []).slice().reverse().map(n => (
                                    <div key={n.id} className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-3xl">
                                        <p className="text-lg font-bold italic leading-tight">{n.text}</p>
                                        <div className="mt-4 flex justify-between items-center opacity-40">
                                            <p className="text-[11px] font-bold font-black uppercase text-amber-500">{n.from}</p>
                                            <p className="text-[11px] font-bold font-black uppercase">{n.date.split(',')[0]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isManager && (
                        <div className="bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-2xl space-y-8">
                            <label className="bg-black text-white px-3 py-1 rounded-sm text-xs font-bold font-black uppercase italic tracking-widest inline-block shadow-lg">New Note</label>
                            <textarea
                                className="w-full h-40 bg-slate-50 text-xl font-black italic p-5 rounded-2xl border-none outline-none placeholder:text-slate-100 text-black uppercase resize-none shadow-inner"
                                placeholder="TYPE SOMETHING..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <button onClick={handleSendNote} className="w-full py-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:translate-y-2 transition-all shadow-xl text-xs border-b-[8px] border-zinc-900">
                                POST NOTE
                            </button>
                        </div>
                    )}

                    {stats.lowStock.length > 0 && (
                        <div className="bg-rose-50 border-4 border-slate-50 rounded-[5rem] p-12 space-y-8 shadow-2xl border-b-[20px] border-rose-100">
                            <div className="flex items-center gap-3">
                                <div className="p-5 bg-rose-500 text-white rounded-3xl shadow-xl rotate-6 group-hover:rotate-0 transition-transform">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-3xl font-black uppercase italic text-black leading-none tracking-tighter">Inventory <br />Warnings</h3>
                            </div>
                            <div className="space-y-4">
                                {stats.lowStock.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border-2 border-rose-100 flex items-center justify-between shadow-sm">
                                        <span className="text-xs font-black text-black uppercase italic tracking-tighter">{item.name}</span>
                                        <span className="bg-rose-500 text-white px-4 py-1 rounded-full text-xs font-bold font-black shadow-lg">ONLY {item.qty}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setActivePanel('Stock')} className="w-full py-6 mt-4 bg-white text-rose-500 border-2 border-rose-100 rounded-full text-xs font-bold font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Resolve Stock Items</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-20 border-t border-slate-50 flex justify-between items-center opacity-40">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-xs font-bold font-black uppercase tracking-widest">Master Node Link Established</p>
                </div>
                <p className="text-xs font-bold font-black uppercase tracking-widest">NRZONE INDUSTRIAL © 2026</p>
            </div>
        </div>
    );

};

export default Overview;
