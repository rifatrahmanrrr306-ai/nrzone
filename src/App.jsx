import React, { useState } from 'react';
// Build trigger: 2026-02-22
import { LogOut, ArrowLeft, Settings, User, AlertCircle, Activity, Scissors, Layers, Hammer, Package, Truck, Users, Database, DollarSign, FileText, LayoutGrid, MessageSquare, AlertTriangle, Send } from 'lucide-react';
import Overview from './components/Overview';
import CuttingPanel from './components/panels/CuttingPanel';
import FactoryPanel from './components/panels/FactoryPanel';
import PataFactoryPanel from './components/panels/PataFactoryPanel';
import WorkerSummary from './components/WorkerSummary';
import WeeklyInvoice from './components/WeeklyInvoice';
import ReportsPanel from './components/panels/ReportsPanel';
import AttendancePanel from './components/panels/AttendancePanel';
import SettingsPanel from './components/panels/SettingsPanel';
import ExpensePanel from './components/panels/ExpensePanel';
import InventoryPanel from './components/panels/InventoryPanel';
import OutsideWorkPanel from './components/panels/OutsideWorkPanel';
import { useMasterData } from './hooks/useMasterData';
import { Toast } from './components/UIComponents';

const GlobalStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        
        :root {
            --font-outfit: 'Outfit', sans-serif;
            --bg-main: #f8fafc;
            --bg-card: #ffffff; 
            --bg-surface: #ffffff;
            --border: rgba(0,0,0,0.06);
            --primary: #000000;
            --text-main: #0f172a;
            --text-muted: #64748b; 
        }

        body {
            font-family: var(--font-outfit);
            background-color: var(--bg-main);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(0,0,0,0.01) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(0,0,0,0.01) 0%, transparent 40%);
            background-attachment: fixed;
            font-weight: 500;
        }

        .animate-fade-up {
            animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .premium-card {
            background: var(--bg-card);
            border-radius: 2rem;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
        }

        .black-button {
            background: #000000;
            color: #ffffff;
            padding: 8px 20px;
            border-radius: 1rem;
            font-weight: 800;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .black-button:hover {
            transform: translateY(-2px);
            background: #18181b;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .form-input {
            width: 100%;
            background: #ffffff;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 1rem;
            padding: 0.8rem 1.2rem;
            color: #000000;
            font-weight: 600;
            transition: all 0.2s ease;
            outline: none;
        }

        .form-input::placeholder {
            color: #94a3b8;
            opacity: 0.5;
        }

        .form-input:focus {
            background: #ffffff;
            border-color: #000000;
            box-shadow: 0 0 0 4px rgba(0,0,0,0.02);
        }

        .stat-card-label {
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
            display: block;
        }

        .stat-card-value {
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: -0.05em;
            color: #000000;
        }

        .nav-card-title {
            font-size: 0.9rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #000000;
        }

        .nav-card-sub {
            font-size: 0.65rem;
            font-weight: 600;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.05em;
        }

        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        `
    }} />
);

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 italic">
                    <div className="w-24 h-24 bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-5 border border-rose-500/20">
                        <AlertCircle size={40} className="animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">Core Failure</h1>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-white text-black px-12 py-5 rounded-full font-black uppercase text-xs font-bold tracking-[0.4em] italic hover:scale-105 transition-transform">Restart System</button>




                </div>
            );
        }
        return this.props.children;
    }
}

const MENU_ITEMS = [
    { id: 'Menu', label: 'Main Menu', icon: LayoutGrid, sub: 'All Depts' },
    { id: 'Overview', label: 'Dashboard', icon: Activity, sub: 'Live Monitor' },
    { id: 'Cutting', label: 'Cutting', icon: Scissors, sub: 'Raw' },
    { id: 'Swing', label: 'Sewing', icon: Layers, sub: 'Factory' },
    { id: 'Stone', label: 'Stone', icon: Hammer, sub: 'Factory' },
    { id: 'Pata', label: 'Pata Hub', icon: Package, sub: 'Logistics' },
    { id: 'Outside', label: 'Outside Work', icon: Truck, sub: 'External' },
    { id: 'Attendance', label: 'Attendance', icon: Users, sub: 'Staff' },
    { id: 'Stock', label: 'Inventory', icon: Database, sub: 'Vault' },
    { id: 'Accounts', label: 'Accounts', icon: DollarSign, sub: 'Financial' },
    { id: 'Reports', label: 'Reports', icon: FileText, sub: 'Analytics' },
    { id: 'Settings', label: 'System Settings', icon: Settings, sub: 'Config' },
];

const MenuPanel = ({ setActivePanel, user }) => {
    const filteredItems = MENU_ITEMS.filter(item => {
        if (user.role === 'manager') return item.id !== 'Settings' && item.id !== 'Reports';
        return item.id !== 'Menu';
    });

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-up">
            {filteredItems.map(item => {
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActivePanel(item.id)}
                        className="bg-white p-4 rounded-2xl border-4 border-slate-50 shadow-xl hover:border-black transition-all group italic flex flex-col items-center text-center gap-3 group"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:rotate-12 transition-all shadow-inner">
                            <Icon size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-black">{item.label}</h3>
                            <p className="text-xs font-bold font-black uppercase text-slate-500 font-bold tracking-widest mt-1 opacity-60">{item.sub}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

const App = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

const Sidebar = ({ activePanel, setActivePanel, user, setUser, setEmergencyOpen }) => {
    const filteredItems = MENU_ITEMS.filter(item => {
        if (user.role === 'manager') return item.id !== 'Settings' && item.id !== 'Reports';
        return true;
    });

    return (
        <div className="fixed left-0 top-0 h-full w-20 md:w-80 bg-white border-r border-slate-100 z-[100] flex flex-col pt-10 pb-10">
            <div className="px-8 mb-16 hidden md:block">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center rotate-6 shadow-xl font-black italic">N</div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter">NRZONE <span className="text-slate-400 font-bold">PRO</span></h1>
                        <p className="text-[8px] font-black uppercase text-slate-500 font-bold tracking-[0.4em]">Intelligence Division</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-2">
                {filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePanel(item.id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all group ${isActive ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold hover:bg-slate-50 hover:text-black'}`}
                        >
                            <div className={`p-2 rounded-xl group-hover:rotate-6 transition-transform ${isActive ? 'bg-white/10' : 'bg-slate-50'}`}>
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-600 font-bold'} />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-xs font-black uppercase italic tracking-widest leading-none">{item.label}</p>
                                <p className={`text-[8px] font-black uppercase mt-1 tracking-widest ${isActive ? 'text-white/40' : 'text-slate-400 font-bold'}`}>{item.sub}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="px-4 pt-10 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-lg mb-4 hidden md:block">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 shadow-xl border-2 border-white"></div>
                        <p className="text-xs font-bold font-black uppercase italic tracking-widest text-black truncate">{user.name}</p>
                    </div>
                    <div className="px-3 py-1 bg-white inline-block rounded-full border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black uppercase text-slate-500 font-bold tracking-widest">{user.role}</p>
                    </div>
                </div>
                <button
                    onClick={() => setEmergencyOpen(true)}
                    className="w-full flex items-center justify-center md:justify-start gap-3 p-4 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all group mb-4"
                >
                    <div className="p-2 rounded-xl bg-white shadow-sm transition-colors text-rose-600">
                        <AlertTriangle size={20} />
                    </div>
                    <span className="hidden md:block text-xs font-black uppercase italic tracking-widest">Emergency Note</span>
                </button>

                <button
                    onClick={() => {
                        localStorage.removeItem('nrzone_user');
                        setUser(null);
                    }}
                    className="w-full flex items-center justify-center md:justify-start gap-3 p-4 rounded-lg text-slate-600 font-bold hover:bg-slate-100 hover:text-black transition-all group"
                >
                    <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-slate-200 transition-colors">
                        <LogOut size={20} />
                    </div>
                    <span className="hidden md:block text-xs font-black uppercase italic tracking-widest">Logout System</span>
                </button>
            </div>
        </div>
    );
};

const AppContent = () => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('nrzone_user');
            if (!savedUser || savedUser === 'undefined') return null;
            return JSON.parse(savedUser);
        } catch (e) {
            console.error("Auth Restore Error:", e);
            return null;
        }
    });

    const [activePanel, setActivePanel] = useState(() => {
        return localStorage.getItem('nrzone_active_panel') || 'Overview';
    });

    React.useEffect(() => {
        if (user) {
            localStorage.setItem('nrzone_user', JSON.stringify(user));
        }
    }, [user]);

    React.useEffect(() => {
        localStorage.setItem('nrzone_active_panel', activePanel);
    }, [activePanel]);

    const [toast, setToast] = useState(null);
    const { masterData, setMasterData, isLoading } = useMasterData();

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [emergencyOpen, setEmergencyOpen] = useState(false);
    const [emergencyNote, setEmergencyNote] = useState('');

    const showNotify = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (isLoading) return null;

    const renderPanel = () => {
        switch (activePanel) {
            case 'Overview': return <Overview masterData={masterData} setMasterData={setMasterData} setActivePanel={setActivePanel} user={user} />;
            case 'Menu': return <MenuPanel setActivePanel={setActivePanel} user={user} />;
            case 'Cutting': return <CuttingPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} setActivePanel={setActivePanel} />;
            case 'Swing': return <FactoryPanel type="sewing" masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} setActivePanel={setActivePanel} />;
            case 'Stone': return <FactoryPanel type="stone" masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} setActivePanel={setActivePanel} />;
            case 'Pata': return <PataFactoryPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} setActivePanel={setActivePanel} />;
            case 'Attendance': return <AttendancePanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} setActivePanel={setActivePanel} />;
            case 'Reports': return <ReportsPanel masterData={masterData} user={user} setActivePanel={setActivePanel} />;
            case 'Settings': return <SettingsPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} />;
            case 'Accounts': return <ExpensePanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} />;
            case 'Stock': return <InventoryPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} setActivePanel={setActivePanel} />;
            case 'Outside': return <OutsideWorkPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} />;
            default: return <Overview masterData={masterData} setMasterData={setMasterData} setActivePanel={setActivePanel} user={user} />;
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-4 relative overflow-hidden italic text-black font-outfit">
                <GlobalStyles />
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-black blur-[160px] rounded-full opacity-5"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black blur-[160px] rounded-full opacity-5"></div>
                </div>

                <div className="w-full max-w-lg bg-white/70 backdrop-blur-3xl p-5 sm:p-20 rounded-2xl sm:rounded-3xl border-4 border-white shadow-3xl relative z-10 animate-fade-up">
                    <div className="flex flex-col items-center mb-4 sm:mb-16 text-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-black text-white rounded-lg sm:rounded-[2.2rem] flex items-center justify-center rotate-6 shadow-2xl mb-4 sm:mb-4 transition-transform hover:rotate-0">
                            <span className="font-black text-3xl sm:text-5xl tracking-tighter italic">N</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none text-black">NRZONE <span className="text-slate-400 font-bold">PRO</span></h1>
                        <p className="text-xs font-bold sm:text-[12px] font-black uppercase tracking-[0.6em] text-slate-600 font-bold mt-3 sm:mt-5 italic text-center">ইন্টেলিজেন্স ডিভিশন</p>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setLoggingIn(true);
                        setTimeout(() => {
                            const trimmedId = id.trim().toUpperCase();
                            const trimmedPass = password.trim();
                            const found = masterData.users.find(u => u.id === trimmedId && u.password === trimmedPass);
                            if (found) {
                                setUser(found);
                                showNotify(`স্বাগতম ${found.name.toUpperCase()}।`);
                            } else {
                                if (trimmedId === 'NRZONE' && trimmedPass === 'Irham@#') {
                                    const admin = { id: 'NRZONE', name: 'Super Admin', role: 'admin' };
                                    setUser(admin);
                                    showNotify('স্বাগতম এডমিন।');
                                } else {
                                    showNotify('ভুল তথ্য। আবার চেষ্টা করুন।', 'error');
                                }
                            }
                            setLoggingIn(false);
                        }, 800);
                    }} className="space-y-8 uppercase">
                        <div className="space-y-3">
                            <label className="text-xs font-bold font-black uppercase tracking-[0.4em] text-slate-600 font-bold ml-5 italic text-left block">আইডি</label>
                            <input value={id} onChange={(e) => setId(e.target.value)} type="text" className="form-input text-lg sm:text-2xl uppercase tracking-widest py-5 sm:py-8 bg-slate-50 border-slate-100 focus:border-black text-black" placeholder="NRZONE" required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold font-black uppercase tracking-[0.4em] text-slate-600 font-bold ml-5 italic text-left block">গোপন পাসওয়ার্ড</label>
                            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="form-input text-lg sm:text-2xl tracking-[0.6em] py-5 sm:py-8 bg-slate-50 border-slate-100 focus:border-black text-black placeholder:text-slate-100" placeholder="••••••" required />
                        </div>
                        <button type="submit" disabled={loggingIn} className="w-full bg-black text-white py-5 sm:py-8 rounded-xl font-black uppercase text-xs font-bold sm:text-xs tracking-[0.6em] shadow-xl hover:translate-y-[-4px] active:translate-y-[0] transition-all italic border-b-4 sm:border-b-8 border-zinc-900 flex justify-center items-center group">
                            {loggingIn ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="group-hover:scale-105 transition-transform">সিস্টেম চালু করুন</span>}
                        </button>
                    </form>
                    {toast && <Toast message={toast.message} type={toast.type} />}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex selection:bg-black selection:text-white font-outfit text-black italic">
            <GlobalStyles />

            <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} user={user} setUser={setUser} setEmergencyOpen={setEmergencyOpen} />

            {/* Emergency Note Modal */}
            {emergencyOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-white rounded-2xl border-4 border-rose-100 shadow-2xl p-12 relative animate-in zoom-in-95 duration-300 italic">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-5 bg-rose-500 text-white rounded-3xl shadow-xl rotate-6">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Emergency <span className="text-rose-500">Note</span></h3>
                                <p className="text-xs font-bold font-black uppercase text-slate-600 font-bold tracking-widest mt-1">Direct alert to Super Admin</p>
                            </div>
                        </div>

                        <textarea
                            className="w-full h-48 bg-slate-50 text-xl font-black italic p-5 rounded-2xl border-none outline-none placeholder:text-slate-100 text-black uppercase resize-none shadow-inner mb-5"
                            placeholder="WHAT'S THE EMERGENCY?"
                            value={emergencyNote}
                            onChange={(e) => setEmergencyNote(e.target.value)}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setEmergencyOpen(false); setEmergencyNote(''); }}
                                className="flex-1 py-6 bg-slate-100 text-slate-600 font-bold rounded-full font-black uppercase text-xs tracking-widest hover:text-black transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!emergencyNote.trim()) return;
                                    const newNote = {
                                        id: Date.now(),
                                        from: user.name,
                                        role: user.role,
                                        text: `[EMERGENCY] ${emergencyNote}`,
                                        date: new Date().toLocaleString()
                                    };
                                    setMasterData(prev => ({
                                        ...prev,
                                        adminNotes: [...(prev.adminNotes || []), newNote]
                                    }));
                                    showNotify('Emergency reported to Admin.');
                                    setEmergencyOpen(false);
                                    setEmergencyNote('');
                                }}
                                className="flex-[2] py-8 bg-black text-white rounded-full font-black uppercase text-lg shadow-2xl border-b-[8px] border-zinc-900 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Send size={20} /> SEND ALERT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 ml-20 md:ml-80 min-h-screen overflow-x-hidden pt-10 px-4 md:px-10 pb-20">
                <div className="max-w-[1600px] mx-auto">
                    <header className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-xs font-bold font-black uppercase text-slate-600 font-bold tracking-[0.4em] italic mb-2">Operational Terminal</p>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{activePanel === 'Overview' ? 'Live Monitor' : activePanel}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="p-1.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/20"></div>
                                <span className="text-[11px] font-black uppercase italic tracking-widest leading-none text-slate-600 font-bold select-none">SYSTEMS STABLE</span>
                            </div>
                        </div>
                    </header>

                    <div className="animate-fade-up">
                        {renderPanel()}
                    </div>
                </div>
            </main>

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default App;
