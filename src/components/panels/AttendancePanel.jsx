import React, { useState, useMemo } from 'react';
import { Calendar, UserCheck, Users, CheckCircle, XCircle, Printer, DollarSign, Clock, Archive, X, Search, ChevronRight, Hash, AlertCircle, ArrowLeft } from 'lucide-react';
import { syncToSheet } from '../../utils/syncUtils';

const AttendancePanel = ({ masterData, setMasterData, showNotify, setActivePanel }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDepartment, setSelectedDepartment] = useState('sewing');
    const [showInvoice, setShowInvoice] = useState(false);
    const [viewMode, setViewMode] = useState('attendance'); // 'attendance' or 'duty'

    const workers = useMemo(() => {
        return masterData.workerCategories[selectedDepartment] || [];
    }, [masterData.workerCategories, selectedDepartment]);

    const getWorkerWage = (worker) => {
        const monthlySalary = masterData.workerWages?.[selectedDepartment]?.[worker] || 0;
        return Math.round(monthlySalary / 30);
    };

    const getAttendance = (worker) => {
        const record = masterData.attendance?.find(
            a => a.date === selectedDate && a.worker === worker && a.department === selectedDepartment
        );
        return record?.status || 'absent';
    };

    const markAttendance = (worker, status) => {
        setMasterData(prev => {
            const existingIndex = (prev.attendance || []).findIndex(
                a => a.date === selectedDate && a.worker === worker && a.department === selectedDepartment
            );

            let newAttendance = [...(prev.attendance || [])];
            const dailyWage = getWorkerWage(worker);

            let effectiveWage = 0;
            if (status === 'present') effectiveWage = dailyWage;
            else if (status === 'half-day') effectiveWage = Math.round(dailyWage / 2);

            if (existingIndex >= 0) {
                newAttendance[existingIndex] = {
                    ...newAttendance[existingIndex],
                    status,
                    wage: effectiveWage,
                    markedAt: new Date().toISOString()
                };
            } else {
                newAttendance.push({
                    id: Date.now(),
                    date: selectedDate,
                    worker,
                    department: selectedDepartment,
                    status,
                    wage: effectiveWage,
                    markedAt: new Date().toISOString()
                });
            }

            if (status !== 'absent') {
                syncToSheet({
                    type: "ATTENDANCE_MARK",
                    worker,
                    detail: `${selectedDepartment}: ${status}`,
                    amount: effectiveWage
                });
            }

            return { ...prev, attendance: newAttendance };
        });
        if (showNotify) showNotify(`${worker}-এর হাজিরা নিশ্চিত করা হয়েছে`);
    };

    const todayAttendance = useMemo(() => {
        return (masterData.attendance || []).filter(
            a => a.date === selectedDate && a.department === selectedDepartment
        );
    }, [masterData.attendance, selectedDate, selectedDepartment]);

    const stats = useMemo(() => {
        const present = todayAttendance.filter(a => a.status === 'present').length;
        const halfDay = todayAttendance.filter(a => a.status === 'half-day').length;
        const wages = todayAttendance.reduce((sum, a) => sum + (a.wage || 0), 0);
        return { present, halfDay, wages };
    }, [todayAttendance]);

    const getBengaliDay = (dateStr) => {
        const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        const date = new Date(dateStr);
        return days[date.getDay()];
    };

    const formatBengaliDate = (dateStr) => {
        const months = ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
        const date = new Date(dateStr);
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    const getWeeklySummary = () => {
        const today = new Date();
        const saturday = new Date(today);
        saturday.setDate(today.getDate() - today.getDay() - 1);
        const thursday = new Date(saturday);
        thursday.setDate(saturday.getDate() + 5);

        const workerSummary = workers.map(worker => {
            const records = (masterData.attendance || []).filter(a => a.worker === worker && a.department === selectedDepartment && new Date(a.date) >= saturday && new Date(a.date) <= thursday);
            const totalWage = records.reduce((sum, r) => sum + (r.wage || 0), 0);
            return { worker, presentDays: records.filter(r => r.status === 'present').length + records.filter(r => r.status === 'half-day').length * 0.5, wage: getWorkerWage(worker), totalWage };
        });

        return { saturday, thursday, workers: workerSummary, totalPayable: workerSummary.reduce((s, w) => s + w.totalWage, 0) };
    };

    const weeklySummary = getWeeklySummary();

    if (showInvoice) {
        return (
            <div className="space-y-12 p-12 bg-white text-black min-h-screen italic font-sans selection:bg-black selection:text-white">
                <style>{`@media print { .no-print { display: none; } }`}</style>
                <div className="flex justify-between items-center no-print mb-4">
                    <button onClick={() => setShowInvoice(false)} className="bg-slate-50 text-black px-10 py-5 rounded-full font-black uppercase text-xs border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all">ফিরে যান</button>
                    <button onClick={() => window.print()} className="bg-black text-white px-12 py-5 rounded-full font-black uppercase text-xs shadow-2xl border-b-[8px] border-zinc-900">প্রিন্ট ইনভয়েস</button>
                </div>
                <div className="max-w-4xl mx-auto border-[12px] border-slate-50 p-20 rounded-[5rem] shadow-3xl">
                    <div className="text-center mb-16">
                        <h1 className="text-7xl font-black italic tracking-tighter mb-4 text-black uppercase">NRZONE <span className="text-slate-400 font-bold">PRO</span></h1>
                        <div className="h-2 w-40 bg-black mx-auto mb-5 rounded-full"></div>
                        <p className="text-xl font-black uppercase tracking-[0.4em] text-slate-600 font-bold italic">Weekly Wage Statement</p>
                        <p className="text-sm font-black text-slate-500 font-bold mt-2 uppercase tracking-widest">{selectedDepartment.toUpperCase()} DEPT • {selectedDate}</p>
                    </div>

                    <table className="w-full text-left">
                        <thead className="border-b-4 border-slate-50">
                            <tr className="text-xs font-bold font-black uppercase tracking-[0.3em] text-slate-600 font-bold">
                                <th className="py-8">Identity (Master)</th>
                                <th className="py-8 text-center">Duty Days</th>
                                <th className="py-8 text-right">Day Rate</th>
                                <th className="py-8 text-right">Net Payable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 italic">
                            {weeklySummary.workers.map((w, i) => (
                                <tr key={i} className="text-2xl font-black group">
                                    <td className="py-8 uppercase tracking-tighter text-black">{w.worker}</td>
                                    <td className="py-8 text-center text-slate-600 font-bold">{w.presentDays} <span className="text-xs font-bold tracking-widest">DAYS</span></td>
                                    <td className="py-8 text-right text-slate-500 font-bold">৳{w.wage}</td>
                                    <td className="py-8 text-right text-black">৳{w.totalWage.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-[12px] border-slate-50 font-black text-5xl">
                                <td colSpan="3" className="py-12 text-right italic text-slate-400 font-bold">TOTAL:</td>
                                <td className="py-12 text-right italic text-black underline underline-offset-[12px] decoration-4">৳{weeklySummary.totalPayable.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div className="mt-24 pt-12 border-t border-slate-100 flex justify-between items-end opacity-20">
                        <p className="text-xs font-bold font-black uppercase tracking-[0.5em]">Auth Signature</p>
                        <p className="text-xs font-bold font-black uppercase tracking-[0.5em]">NRZONE INTELLIGENCE UNIT</p>
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
                    <div className="flex items-center gap-3 bg-white p-4 premium-card rounded-3xl border-4 border-slate-50 shadow-xl w-full md:w-auto">
                        <div className="p-4 bg-black text-white rounded-xl shadow-2xl rotate-3 transition-transform hover:rotate-0">
                            {viewMode === 'attendance' ? <UserCheck size={36} strokeWidth={3} /> : <Clock size={36} strokeWidth={3} />}
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">Workforce <span className="text-slate-100">Hub</span></h2>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setViewMode('attendance')} className={`text-xs font-bold font-black uppercase tracking-widest px-6 py-2 rounded-full border transition-all ${viewMode === 'attendance' ? 'bg-black text-white border-black shadow-xl' : 'text-slate-600 font-bold border-slate-100 hover:text-black'}`}>Attendance</button>
                                <button onClick={() => setViewMode('duty')} className={`text-xs font-bold font-black uppercase tracking-widest px-6 py-2 rounded-full border transition-all ${viewMode === 'duty' ? 'bg-black text-white border-black shadow-xl' : 'text-slate-600 font-bold border-slate-100 hover:text-black'}`}>Duty Logs</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl px-12 py-8 flex flex-col items-center md:items-end border-4 border-slate-50 shadow-xl min-w-[300px] w-full md:w-auto">
                    <p className="text-xs font-bold font-black text-slate-600 font-bold uppercase tracking-widest mb-2 font-black">Daily Expenditure</p>
                    <p className="text-5xl font-black italic tracking-tighter text-black">৳{stats.wages.toLocaleString()} <span className="text-sm not-italic text-slate-400 font-bold uppercase">Wages</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 -mr-4 -mt-4 group-hover:rotate-12 transition-transform opacity-10">
                        <Calendar size={120} strokeWidth={3} />
                    </div>
                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 block tracking-widest mb-2">Calendar Access</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full text-5xl font-black italic border-none outline-none bg-transparent text-black" />
                    <p className="mt-5 ml-6 text-xl font-black text-slate-100 uppercase tracking-widest italic">{getBengaliDay(selectedDate)} • {formatBengaliDate(selectedDate)}</p>
                </div>
                <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-5 text-slate-50 -mr-4 -mt-4 group-hover:-rotate-12 transition-transform opacity-10">
                        <Users size={120} strokeWidth={3} />
                    </div>
                    <label className="text-xs font-bold font-black text-slate-600 font-bold uppercase ml-6 block tracking-widest mb-2">Operational Dept</label>
                    <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full text-4xl font-black italic border-none outline-none bg-transparent uppercase text-black">
                        <option value="sewing">সুইং সেকশন</option>
                        <option value="stone">স্টোন সেকশন</option>
                        <option value="pata">পাতা সেকশন</option>
                        <option value="monthly">মাসিক স্টাফ</option>
                    </select>
                </div>
            </div>

            {viewMode === 'attendance' ? (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-xl flex flex-col justify-between h-56 italic">
                            <p className="text-xs font-bold font-black text-slate-500 font-bold uppercase tracking-widest">W_FORCE</p>
                            <h4 className="text-7xl font-black tracking-tighter leading-none">{workers.length}</h4>
                            <p className="text-[11px] font-bold font-black text-slate-400 font-bold uppercase tracking-widest">Total Active Staff</p>
                        </div>
                        <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-xl flex flex-col justify-between h-56 italic">
                            <p className="text-xs font-bold font-black text-emerald-200 uppercase tracking-widest">PRESENT</p>
                            <h4 className="text-7xl font-black tracking-tighter leading-none text-emerald-500">{stats.present}</h4>
                            <p className="text-[11px] font-bold font-black text-slate-400 font-bold uppercase tracking-widest">{stats.halfDay} PARTIAL DUTIES</p>
                        </div>
                        <button onClick={() => setShowInvoice(true)} className="bg-black text-white p-12 rounded-3xl flex flex-col justify-between h-56 group hover:scale-[1.02] transition-all relative overflow-hidden shadow-2xl">
                            <div className="absolute bottom-0 right-0 -mr-4 -mb-4 text-white/5 rotate-12 group-hover:rotate-0 transition-transform">
                                <Printer size={160} />
                            </div>
                            <p className="text-xs font-bold font-black text-white/40 uppercase tracking-widest">Print Weekly Receipt</p>
                            <h4 className="text-5xl font-black tracking-tighter leading-none uppercase italic border-b-4 border-white/20 pb-2 inline-block">Generate</h4>
                            <Printer className="text-emerald-400 self-end" size={24} />
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border-4 border-slate-50 shadow-2xl overflow-hidden p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {workers.length === 0 ? (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-10">
                                    <AlertCircle size={80} />
                                    <p className="text-2xl font-black uppercase mt-4">No Workers Configured</p>
                                </div>
                            ) : workers.map((worker, idx) => {
                                const status = getAttendance(worker);
                                const wage = getWorkerWage(worker);
                                return (
                                    <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-3 group hover:bg-white hover:border-black hover:shadow-2xl transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-20 bg-black text-white rounded-xl font-black text-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">{worker[0].toUpperCase()}</div>
                                            <div>
                                                <h4 className="text-3xl font-black italic uppercase leading-none text-black group-hover:scale-105 transition-transform origin-left">{worker}</h4>
                                                <p className="text-xs font-bold font-black text-slate-500 font-bold uppercase tracking-[0.3em] mt-3 group-hover:text-slate-600 font-bold decoration-slate-200 underline underline-offset-4 decoration-2">৳{wage.toLocaleString()} / Daily</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-white/50 backdrop-blur-3xl p-2 rounded-full border border-slate-100 shadow-inner w-full xl:w-auto">
                                            {['present', 'half-day', 'absent'].map(s => (
                                                <button key={s} onClick={() => markAttendance(worker, s)} className={`flex-1 min-w-[100px] py-4 rounded-full text-xs font-bold font-black uppercase tracking-widest transition-all ${status === s ? (s === 'present' ? 'bg-black text-white shadow-xl' : s === 'half-day' ? 'bg-amber-500 text-white shadow-xl' : 'bg-rose-500 text-white shadow-xl') : 'text-slate-500 font-bold hover:text-black hover:bg-slate-50'}`}>
                                                    {s === 'present' ? 'উপস্থিত' : s === 'half-day' ? 'হাফ' : 'নাই'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="bg-white p-12 rounded-[5rem] border-4 border-slate-50 shadow-2xl italic text-black">
                        <div className="flex items-center justify-between mb-16 px-6">
                            <div>
                                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">Live Duty Logs</h3>
                                <p className="text-xs font-bold font-black text-slate-500 font-bold uppercase tracking-[0.5em]">Real-time Work Assignments</p>
                            </div>
                            <Clock size={48} className="text-slate-50" />
                        </div>
                        <div className="space-y-6">
                            {(masterData.productions || [])
                                .filter(p => p.status === 'Pending' && (p.type === selectedDepartment || (selectedDepartment === 'sewing' && p.type === 'finishing')))
                                .length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center text-slate-100 gap-3">
                                    <Archive size={80} strokeWidth={1} />
                                    <p className="text-xl font-black uppercase tracking-[0.4em]">প্রতিষ্ঠানটি বর্তমানে অবমুক্ত</p>
                                </div>
                            ) : (
                                (masterData.productions || [])
                                    .filter(p => p.status === 'Pending' && (p.type === selectedDepartment || (selectedDepartment === 'sewing' && p.type === 'finishing')))
                                    .map(prod => (
                                        <div key={prod.id} className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 flex items-center justify-between group hover:border-black hover:bg-white hover:shadow-2xl transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-24 bg-black text-white rounded-2xl font-black italic text-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform border-4 border-slate-50">{prod.size}</div>
                                                <div>
                                                    <h4 className="text-4xl font-black italic uppercase leading-none mb-4 text-black">{prod.design}</h4>
                                                    <div className="flex gap-3">
                                                        <span className="text-[11px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100">{prod.worker}</span>
                                                        <span className="text-[11px] font-bold font-black text-slate-600 font-bold uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100">{prod.color}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-end gap-2 mb-2">
                                                    <p className="text-xs font-black text-slate-500 font-bold uppercase italic">Issued Units:</p>
                                                    <p className="text-5xl font-black italic text-black leading-none">B:{prod.issueBorka} / H:{prod.issueHijab}</p>
                                                </div>
                                                <p className="text-[11px] font-bold font-black text-emerald-500 uppercase tracking-[0.4em] mt-3 animate-pulse">Pending Collection • {prod.date}</p>
                                            </div>
                                        </div>
                                    ))
                            )}
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

export default AttendancePanel;
