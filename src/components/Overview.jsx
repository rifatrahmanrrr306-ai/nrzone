import React, { useMemo } from 'react';
import { Activity, Scissors, Layers, Hammer, Package, Truck, Users, Database, DollarSign, FileText, TrendingUp, AlertCircle, MessageSquare, LayoutGrid, Plus } from 'lucide-react';

const mockStats = {
    lowStock: [
        { name: 'HYDRAULIC PUMP', qty: 2 },
        { name: 'THERMAL SHIELD', qty: 5 },
        { name: 'CORE SENSOR', qty: 1 },
        { name: 'VALVE GASKET', qty: 3 },
        { name: 'POWER RELAY', qty: 4 }
    ]
};

const Overview = ({ masterData, setMasterData, setActivePanel, user }) => {
    const stats = useMemo(() => {
        const today = new Date().toLocaleDateString('en-GB');
        const productionToday = (masterData.productions || []).filter(p => p.date === today).length;
        const totalProduction = (masterData.productions || []).length;

        const activeCutting = (masterData.cuttingStock || []).reduce((sum, c) => sum + (Number(c.borka || 0) + Number(c.hijab || 0)), 0);

        const sewingWIP = (masterData.productions || [])
            .filter(p => p.type === 'sewing' && p.status === 'Pending')
            .reduce((sum, p) => sum + (Number(p.issueBorka || 0) + Number(p.issueHijab || 0)), 0);

        const stoneWIP = (masterData.productions || [])
            .filter(p => p.type === 'stone' && p.status === 'Pending')
            .reduce((sum, p) => sum + (Number(p.issueBorka || 0) + Number(p.issueHijab || 0)), 0);

        const pataStock = (masterData.pataEntries || [])
            .filter(p => p.status === 'Received')
            .reduce((sum, p) => sum + Number(p.pataQty || 0), 0) - (masterData.productions || [])
                .filter(p => p.type === 'stone')
                .reduce((sum, p) => sum + Number(p.pataQty || 0), 0);

        const finishedStock = (masterData.productions || [])
            .filter(p => p.status === 'Received')
            .reduce((sum, p) => sum + (Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)), 0) -
            (masterData.deliveries || []).reduce((sum, d) => sum + (Number(d.borka || 0) + Number(d.hijab || 0)), 0);


        const inventory = {};
        (masterData.rawInventory || []).forEach(log => {
            const key = log.color ? `${log.item} (${log.color})` : log.item;
            if (!inventory[key]) inventory[key] = { name: log.item, color: log.color, qty: 0 };
            if (log.type === 'in') inventory[key].qty += Number(log.qty);
            else if (log.type === 'out') inventory[key].qty -= Number(log.qty);
        });
        const lowStock = [...Object.values(inventory).filter(i => i.qty <= 5), ...mockStats.lowStock];

        // Recent Activity Feed (Last 15 items)
        const recentActivity = [
            ...(masterData.productions || []).map(p => ({ ...p, activityType: 'Factory', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50' })),
            ...(masterData.cuttingStock || []).map(c => ({ ...c, activityType: 'Cutting', icon: Scissors, color: 'text-black', bg: 'bg-slate-100' })),
            ...(masterData.pataEntries || []).map(p => ({ ...p, activityType: 'Pata', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' }))
        ].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 15);

        return { productionToday, totalProduction, activeCutting, sewingWIP, stoneWIP, pataStock, finishedStock, lowStock, recentActivity };
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
        <div className="space-y-8 pb-16 animate-fade-up px-2 italic text-black font-outfit">

            <div className="flex flex-col lg:flex-row justify-between items-start md:items-end gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-black text-white rounded-[1.25rem] md:rounded-[1.75rem] flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700">
                        <Activity size={24} strokeWidth={3} className="md:w-[32px] md:h-[32px] animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold font-black text-slate-600 font-bold uppercase tracking-[0.3em] mb-1.5">SYSTEM ALIVE</p>
                        <h1 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-black">FACTORY <span className="text-slate-400 font-bold">LIVE</span></h1>
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
                    <div className="bg-white px-6 py-4 rounded-[1.75rem] border-2 border-slate-50 shadow-xl min-w-[160px]">
                        <p className="text-[11px] font-bold font-black uppercase tracking-widest text-slate-600 font-bold mb-2 italic">Output Today</p>
                        <p className="text-2xl font-black italic tracking-tighter text-black">+{stats.productionToday}<span className="text-xs font-bold ml-1 text-slate-400 font-bold">PCS</span></p>
                    </div>

                    <button
                        onClick={() => setActivePanel('Menu')}
                        className="bg-black text-white px-8 py-4 rounded-[1.75rem] shadow-xl min-w-[180px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all group border-b-[6px] border-zinc-900"
                    >
                        <div className="p-2 bg-white/10 rounded-xl group-hover:rotate-12 transition-transform">
                            <LayoutGrid size={18} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black italic leading-none uppercase">Main Menu</p>
                            <p className="text-xs font-bold font-bold font-black uppercase text-slate-600 font-bold tracking-widest mt-0.5">Full System Hub</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActivePanel('Swing')}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-[1.75rem] shadow-xl min-w-[180px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all group border-b-[6px] border-indigo-900"
                    >
                        <div className="p-2 bg-white/10 rounded-xl group-hover:rotate-12 transition-transform">
                            <Plus size={18} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black italic leading-none uppercase">Issue Work</p>
                            <p className="text-xs font-bold font-bold font-black uppercase text-indigo-200 tracking-widest mt-0.5">Quick Action</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Departmental Live Stock Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Cutting Stock', value: stats.activeCutting, unit: 'PCS', color: 'text-black', bg: 'bg-white', icon: Scissors, panel: 'Cutting', roles: ['admin', 'manager'] },
                    { label: 'Swing WIP', value: stats.sewingWIP, unit: 'PCS', color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: Layers, panel: 'Swing', roles: ['admin', 'manager'] },
                    { label: 'Stone WIP', value: stats.stoneWIP, unit: 'PCS', color: 'text-amber-600', bg: 'bg-amber-50/50', icon: Hammer, panel: 'Stone', roles: ['admin', 'manager'] },
                    { label: 'Pata Ready', value: stats.pataStock, unit: 'PCS', color: 'text-blue-600', bg: 'bg-blue-50/50', icon: Database, panel: 'Pata', roles: ['admin', 'manager'] },
                    { label: 'Finished', value: stats.finishedStock, unit: 'PCS', color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: Truck, panel: 'Stock', roles: ['admin', 'manager'] }
                ].map((item, idx) => {
                    const hasAccess = !item.roles || item.roles.includes(user?.role);
                    return (
                        <button
                            key={idx}
                            onClick={() => hasAccess ? setActivePanel(item.panel) : null}
                            className={`${item.bg} p-4 rounded-lg border-2 border-slate-50 shadow-lg transition-all group text-left relative overflow-hidden ${hasAccess ? 'hover:shadow-xl hover:border-black' : 'opacity-60 cursor-not-allowed filter grayscale'}`}
                        >
                            <div className="absolute -right-3 -top-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <item.icon size={80} />
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 font-bold mb-1.5 italic">{item.label}</p>
                            <p className={`text-2xl font-black italic tracking-tighter ${item.color}`}>{item.value.toLocaleString()}<span className="text-[11px] font-bold ml-1 not-italic opacity-40">{item.unit}</span></p>
                            {hasAccess ? (
                                <div className="mt-3 w-6 h-1 bg-slate-100 rounded-full group-hover:w-12 transition-all duration-500"></div>
                            ) : (
                                <div className="mt-3 flex items-center gap-1.5">
                                    <AlertCircle size={8} className="text-rose-500" />
                                    <span className="text-[6.5px] font-black uppercase text-rose-500 tracking-widest">Locked</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Left: Active Monitor List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-5 rounded-xl border-2 border-slate-50 shadow-xl overflow-hidden min-h-[500px]">
                        <div className="flex justify-between items-center mb-5 border-b-2 border-slate-50 pb-6">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                Live Production Stream
                            </h3>
                            <button onClick={() => window.location.reload()} className="p-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-black hover:text-white transition-all"><TrendingUp size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            {stats.recentActivity.map((act, i) => (
                                <div key={act.id || i} className="group bg-slate-50/50 hover:bg-white p-4 md:p-5 rounded-lg border border-transparent hover:border-slate-100 hover:shadow-lg transition-all duration-500 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform ${act.bg}`}>
                                            <act.icon size={20} className={act.color} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-sm text-xs font-bold font-bold font-black uppercase tracking-widest text-white shadow-sm ${act.activityType === 'Factory' ? 'bg-blue-500' : act.activityType === 'Cutting' ? 'bg-black' : 'bg-amber-500'}`}>
                                                    {act.activityType}
                                                </span>
                                                <p className="text-[8px] font-black text-slate-400 font-bold uppercase tracking-widest">{act.date}</p>
                                            </div>
                                            <h4 className="text-lg md:text-xl font-black italic uppercase tracking-tighter leading-none mt-1.5 text-black">
                                                {act.activityType === 'Factory' ? `${act.worker} - ${act.design}` : act.activityType === 'Cutting' ? `Cutting: ${act.design}` : `${act.worker} - ${act.pataType}`}
                                            </h4>
                                            <p className="text-[11px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest mt-1">{act.color || act.pataStoneColors}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none text-black">
                                            +{act.issueBorka || act.issueHijab || act.borka || act.pataQty || 0}
                                        </p>
                                        <p className="text-xs font-bold font-bold font-black text-slate-400 font-bold uppercase tracking-widest mt-0.5">TOTAL ASSETS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Insights & Alerts */}
                <div className="space-y-8">
                    {isAdmin && (masterData.adminNotes || []).length > 0 && (
                        <div className="bg-black text-white p-5 rounded-xl shadow-xl space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-5 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                <MessageSquare size={80} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic flex items-center gap-3 relative z-10">Manager Notes</h3>
                            <div className="space-y-4 relative z-10 max-h-[250px] overflow-y-auto no-scrollbar">
                                {(masterData.adminNotes || []).slice().reverse().map(n => (
                                    <div key={n.id} className="bg-white/10 p-4 rounded-[1.25rem] border border-white/5 backdrop-blur-3xl">
                                        <p className="text-sm font-bold italic leading-tight">{n.text}</p>
                                        <div className="mt-3 flex justify-between items-center opacity-40">
                                            <p className="text-[8px] font-black uppercase text-amber-500">{n.from}</p>
                                            <p className="text-[8px] font-black uppercase">{n.date.split(',')[0]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isManager && (
                        <div className="bg-white p-4 rounded-xl border-2 border-slate-50 shadow-xl space-y-6">
                            <label className="bg-black text-white px-2 py-0.5 rounded-sm text-[8px] font-black uppercase italic tracking-widest inline-block shadow-lg">New Note</label>
                            <textarea
                                className="w-full h-24 bg-slate-50 text-base font-black italic p-4 rounded-[1.25rem] border-none outline-none placeholder:text-slate-100 text-black uppercase resize-none shadow-inner"
                                placeholder="TYPE SOMETHING..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <button onClick={handleSendNote} className="w-full py-4 bg-black text-white rounded-[1.25rem] font-black uppercase tracking-widest hover:scale-[1.02] active:translate-y-1 transition-all shadow-xl text-xs font-bold border-b-[4px] border-zinc-900">
                                POST NOTE
                            </button>
                        </div>
                    )}

                    {stats.lowStock.length > 0 && (
                        <div className="bg-rose-50 border-2 border-slate-50 rounded-xl p-5 space-y-6 shadow-xl border-b-[10px] border-rose-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-xl rotate-6 group-hover:rotate-0 transition-transform">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic text-black leading-none tracking-tighter">Inventory <br />Warnings</h3>
                            </div>
                            <div className="space-y-3">
                                {stats.lowStock.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 flex items-center justify-between shadow-sm">
                                        <span className="text-xs font-bold font-black text-black uppercase italic tracking-tighter">{item.name}</span>
                                        <span className="bg-rose-500 text-white px-3 py-0.5 rounded-full text-[8px] font-black shadow-lg">ONLY {item.qty}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setActivePanel('Stock')} className="w-full py-4 mt-2 bg-white text-rose-500 border-2 border-rose-100 rounded-full text-[11px] font-bold font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Resolve Stock Items</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-12 border-t border-slate-50 flex justify-between items-center opacity-40">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <p className="text-[8px] font-black uppercase tracking-widest">Master Node Link Established</p>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest">NRZONE INDUSTRIAL © 2026</p>
            </div>
        </div>
    );

};

export default Overview;
// End of Overview Component
