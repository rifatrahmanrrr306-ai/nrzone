import React, { useState } from 'react';
import { Settings, Users, User, Package, DollarSign, Plus, Edit2, Trash2, Save, X, Clock, Download, ChevronRight, ShieldCheck, Database, LayoutGrid, Image as ImageIcon, Upload, ArrowLeft } from 'lucide-react';
// Firebase removed for local-only usage

const SettingsPanel = ({ masterData, setMasterData, user: currentUser, showNotify, setActivePanel }) => {
    const [activeTab, setActiveTab] = useState('users');
    const [editingItem, setEditingItem] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newWorkerDept, setNewWorkerDept] = useState('sewing');
    const [uploading, setUploading] = useState(false);
    const [temppImgUrl, setTempImgUrl] = useState(null);

    const handleImageUpload = async (file) => {
        if (!file) return null;
        setUploading(true);
        try {
            // Local preview handler instead of Firebase Upload
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUploading(false);
                    resolve(reader.result); // Returns Base64 string
                };
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error("Local preview failed", error);
            setUploading(false);
            return null;
        }
    };

    const handleAddListItem = (category, value) => {
        if (!value.trim()) return;
        setMasterData(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), value.toUpperCase()]
        }));
        setShowAddModal(false);
    };

    const handleDeleteListItem = (category, index) => {
        if (!confirm('Delete this item?')) return;
        setMasterData(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    const handleUpdateListItem = (category, index, newValue) => {
        if (!newValue.trim()) return;
        setMasterData(prev => ({
            ...prev,
            [category]: prev[category].map((item, i) => i === index ? newValue.toUpperCase() : item)
        }));
        setEditingItem(null);
    };

    const handleAddWorker = (department, workerName, wage) => {
        if (!workerName.trim()) return;
        setMasterData(prev => ({
            ...prev,
            workerCategories: {
                ...prev.workerCategories,
                [department]: [...(prev.workerCategories[department] || []), workerName.toUpperCase()]
            },
            workerWages: {
                ...prev.workerWages,
                [department]: {
                    ...prev.workerWages[department],
                    [workerName.toUpperCase()]: Number(wage) || 0
                }
            }
        }));
        setShowAddModal(false);
    };

    const handleDeleteWorker = (department, worker) => {
        if (!confirm(`Delete worker ${worker}?`)) return;
        setMasterData(prev => ({
            ...prev,
            workerCategories: {
                ...prev.workerCategories,
                [department]: prev.workerCategories[department].filter(w => w !== worker)
            }
        }));
    };

    const handleUpdateWorkerFull = (department, oldName, newName, newWage) => {
        if (!newName.trim()) return;
        const upperNewName = newName.toUpperCase();
        setMasterData(prev => {
            const newCategories = prev.workerCategories[department].map(w => w === oldName ? upperNewName : w);
            const newWages = { ...prev.workerWages[department] };
            if (oldName !== upperNewName) delete newWages[oldName];
            newWages[upperNewName] = Number(newWage) || 0;
            return {
                ...prev,
                workerCategories: { ...prev.workerCategories, [department]: newCategories },
                workerWages: { ...prev.workerWages, [department]: newWages }
            };
        });
        setEditingItem(null);
    };

    const handleAddUser = (id, password, name, role) => {
        if (!id.trim() || !password.trim()) return;
        setMasterData(prev => ({
            ...prev,
            users: [...(prev.users || []), { id: id.toUpperCase(), password, name: name || id, role: role || 'manager' }]
        }));
        setShowAddModal(false);
    };

    const handleUpdateUser = (index, updatedUser) => {
        setMasterData(prev => ({
            ...prev,
            users: prev.users.map((u, i) => i === index ? { ...u, ...updatedUser } : u)
        }));
        setEditingItem(null);
        showNotify('User updated successfully');
    };

    const handleDeleteUser = (id) => {
        if (id === 'NRZONE') return alert('Cannot delete Super Admin');
        if (!confirm(`Delete user ${id}?`)) return;
        setMasterData(prev => ({
            ...prev,
            users: prev.users.filter(u => u.id !== id)
        }));
    };

    const handleAddDesign = (name, sewingRate, stoneRate, pataRate, hijabRate, materialCost, sellingPrice) => {
        if (!name.trim()) return;
        setMasterData(prev => ({
            ...prev,
            designs: [...prev.designs, {
                name,
                sewingRate: Number(sewingRate) || 0,
                stoneRate: Number(stoneRate) || 0,
                pataRate: Number(pataRate) || 0,
                hijabRate: Number(hijabRate) || 0,
                materialCost: Number(materialCost) || 0,
                sellingPrice: Number(sellingPrice) || 0,
                image: temppImgUrl || ''
            }]
        }));
        setTempImgUrl(null);
        setShowAddModal(false);
    };

    const handleUpdateDesign = (index, field, value) => {
        setMasterData(prev => ({
            ...prev,
            designs: prev.designs.map((d, i) => i === index ? { ...d, [field]: Number(value) || 0 } : d)
        }));
    };

    const handleDeleteDesign = (index) => {
        if (!confirm('Delete this design?')) return;
        setMasterData(prev => ({ ...prev, designs: prev.designs.filter((_, i) => i !== index) }));
    };


    const ListSection = ({ category, title, items, icon }) => (
        <div className="space-y-10 animate-fade-up text-black">
            <div className="bg-white p-12 rounded-3xl border-4 border-slate-50 shadow-2xl flex justify-between items-center italic relative overflow-hidden group">
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-4 bg-black text-white rounded-3xl group-hover:rotate-6 transition-transform">
                        {icon ? React.cloneElement(icon, { size: 32 }) : <Database size={32} />}
                    </div>
                    <div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{title}</h3>
                        <p className="text-[11px] text-slate-600 font-bold font-black uppercase tracking-[0.5em] mt-4 italic">{items?.length || 0} NODES CONFIGURED</p>
                    </div>
                </div>
                <button onClick={() => setShowAddModal(category)} className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-2xl border-b-[12px] border-zinc-900 relative z-10">
                    <Plus size={36} strokeWidth={3} />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items?.map((item, idx) => {
                    const isEditing = editingItem === `${category}-${idx}`;
                    return (
                        <div key={idx} className="bg-white p-4 rounded-3xl border-4 border-slate-50 flex flex-col justify-between group hover:border-black transition-all italic shadow-2xl relative overflow-hidden h-64">
                            {isEditing ? (
                                <div className="space-y-6 relative z-10 h-full flex flex-col">
                                    <input autoFocus id={`edit-${category}-${idx}`} className="form-input bg-slate-50 border-slate-100 text-xl font-black text-center py-6 italic appearance-none" defaultValue={item} />
                                    <button onClick={() => handleUpdateListItem(category, idx, document.getElementById(`edit-${category}-${idx}`).value)} className="w-full bg-black text-white py-4 rounded-full font-black uppercase text-xs font-bold tracking-widest shadow-2xl mt-auto">SAVE</button>
                                </div>
                            ) : (
                                <>
                                    <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-5 relative z-10 italic">{item}</p>
                                    <div className="flex gap-3 opacity-10 group-hover:opacity-100 transition-all relative z-10">
                                        <button onClick={() => setEditingItem(`${category}-${idx}`)} className="flex-1 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold hover:text-black transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteListItem(category, index)} className="flex-1 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Overview')} className="p-4 bg-white text-black rounded-2xl border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border-4 border-slate-50 shadow-2xl">
                        <div className="p-4 bg-black text-white rounded-xl shadow-2xl rotate-3">
                            <Settings size={36} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">System <span className="text-slate-100">Config</span></h2>
                            <p className="text-[11px] font-black text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 italic">Infrastructure Archive</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
                {[
                    { id: 'profile', label: 'MY PROFILE', icon: <User size={20} /> },
                    { id: 'users', label: 'IDENTITY', icon: <ShieldCheck size={20} /> },
                    { id: 'workers', label: 'WORKERS', icon: <Users size={20} /> },
                    { id: 'designs', label: 'DESIGNS', icon: <Package size={20} /> },
                    { id: 'colors', label: 'COLORS', icon: <Plus size={20} /> },
                    { id: 'sizes', label: 'SIZES', icon: <LayoutGrid size={20} /> },
                    { id: 'pata', label: 'PATA', icon: <LayoutGrid size={20} /> }
                ].map(tab => {
                    // Only show IDENITY tab to admins
                    if (tab.id === 'users' && currentUser?.role !== 'admin' && currentUser?.id !== 'NRZONE') return null;

                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[150px] py-10 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all italic flex flex-col items-center gap-3 ${activeTab === tab.id ? 'bg-black text-white shadow-2xl' : 'text-slate-600 font-bold'}`}>
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-12">
                {activeTab === 'workers' && (
                    <div className="space-y-12">
                        {['sewing', 'stone', 'pata', 'cutting', 'finishing', 'logistics', 'monthly'].map(dept => (
                            <div key={dept} className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
                                <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-black animate-pulse"></div>
                                        {dept === 'monthly' ? 'OFFICE STAFF' : dept === 'logistics' ? 'OUTSIDE / LOGISTICS' : `${dept.toUpperCase()} DEPT`}
                                    </h3>
                                    <button onClick={() => { setNewWorkerDept(dept); setShowAddModal('worker'); }} className="p-4 bg-black text-white rounded-3xl shadow-xl hover:rotate-12 transition-transform"><Plus size={24} /></button>
                                </div>
                                <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {masterData.workerCategories[dept]?.map((worker, idx) => {
                                        const wage = masterData.workerWages?.[dept]?.[worker] || 0;
                                        const isEditing = editingItem === `${dept}-${worker}`;
                                        return (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-3xl group hover:bg-black hover:text-white transition-all relative overflow-hidden h-64 flex flex-col justify-between shadow-inner">
                                                {isEditing ? (
                                                    <div className="space-y-4">
                                                        <input id={`name-${dept}-${idx}`} className="form-input bg-white border-slate-100 py-4 italic font-black uppercase text-sm text-black" defaultValue={worker} />
                                                        <input id={`wage-${dept}-${worker}`} type="number" className="form-input bg-white border-slate-100 py-4 italic font-black text-center text-xl text-black" defaultValue={wage} />
                                                        <button onClick={() => handleUpdateWorkerFull(dept, worker, document.getElementById(`name-${dept}-${idx}`).value, document.getElementById(`wage-${dept}-${worker}`).value)} className="w-full bg-black text-white py-4 rounded-full font-black text-xs font-bold uppercase shadow-2xl">SAVE</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="font-black text-2xl uppercase tracking-tighter italic leading-none">{worker}</p>
                                                            <p className="text-xs font-bold text-slate-600 font-bold mt-2">
                                                                {wage > 0
                                                                    ? (dept === 'monthly' ? `৳${wage.toLocaleString()} / FIXED SALARY` : `৳${wage.toLocaleString()} / PER PIECE`)
                                                                    : 'FOLLOWS DESIGN RATE'}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all self-end">
                                                            <button onClick={() => setEditingItem(`${dept}-${worker}`)} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><Edit2 size={14} /></button>
                                                            <button onClick={() => handleDeleteWorker(dept, worker)} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><Trash2 size={14} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'designs' && (
                    <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
                        <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic">STYLE REPOSITORY</h3>
                            <button onClick={() => setShowAddModal('design')} className="p-4 bg-black text-white rounded-2xl shadow-2xl border-b-[12px] border-zinc-800 font-black text-sm uppercase tracking-widest">ADD NEW STYLE</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase font-black text-xs font-bold tracking-widest">
                                    <tr>
                                        <th className="px-12 py-8">PREVIEW</th>
                                        <th className="px-6 py-8">IDENTITY</th>
                                        <th className="px-6 py-8 text-center">SEWING ৳</th>
                                        <th className="px-6 py-8 text-center">HIJAB ৳</th>
                                        <th className="px-6 py-8 text-center">STONE ৳</th>
                                        <th className="px-6 py-8 text-center">PATA ৳</th>
                                        <th className="px-6 py-8 text-center">SELL ৳</th>
                                        <th className="px-12 py-8 text-right">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {masterData.designs.map((design, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-all group">
                                            <td className="px-12 py-6">
                                                <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200">
                                                    {design.image ? (
                                                        <img src={design.image} alt={design.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                                            <ImageIcon size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="font-black text-2xl uppercase tracking-tighter italic">{design.name}</p>
                                            </td>
                                            <td className="px-6 py-10 text-center font-black text-xl italic">৳{design.sewingRate}</td>
                                            <td className="px-6 py-10 text-center font-black text-xl italic">৳{design.hijabRate}</td>
                                            <td className="px-6 py-10 text-center font-black text-xl italic">৳{design.stoneRate}</td>
                                            <td className="px-6 py-10 text-center font-black text-xl italic">৳{design.pataRate || 0}</td>
                                            <td className="px-6 py-10 text-center font-black text-xl italic text-emerald-500">৳{design.sellingPrice}</td>
                                            <td className="px-12 py-10 text-right">
                                                <button onClick={() => handleDeleteDesign(idx)} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold hover:text-rose-500 mx-auto transition-all"><Trash2 size={20} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
                        <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic">Personal Security</h3>
                        </div>
                        <div className="p-12 max-w-2xl mx-auto space-y-10">
                            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 flex items-center gap-3">
                                <div className="w-20 h-20 bg-black text-white rounded-xl flex items-center justify-center font-black text-4xl italic shadow-xl">
                                    {currentUser?.id?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{currentUser?.name}</h4>
                                    <p className="text-[11px] font-black text-slate-500 font-bold uppercase tracking-widest mt-2">ID: {currentUser?.id} • ROLE: {currentUser?.role}</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const newPass = e.target.newPass.value;
                                const confirmPass = e.target.confirmPass.value;
                                if (newPass !== confirmPass) return alert('Passwords do not match');

                                const userIdx = masterData.users.findIndex(u => u.id === currentUser.id);
                                handleUpdateUser(userIdx, { password: newPass });
                                e.target.reset();
                            }} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="bg-black text-white px-3 py-1 rounded-sm text-xs font-bold font-black uppercase italic tracking-widest inline-block mb-3 shadow-lg ml-5">NEW PASSWORD</label>
                                    <input name="newPass" type="password" className="form-input text-2xl tracking-[0.6em] py-8 bg-slate-50 border-slate-100 focus:border-black text-black" placeholder="••••••" required />
                                </div>
                                <div className="space-y-3">
                                    <label className="bg-black text-white px-3 py-1 rounded-sm text-xs font-bold font-black uppercase italic tracking-widest inline-block mb-3 shadow-lg ml-5">CONFIRM PASSWORD</label>
                                    <input name="confirmPass" type="password" className="form-input text-2xl tracking-[0.6em] py-8 bg-slate-50 border-slate-100 focus:border-black text-black" placeholder="••••••" required />
                                </div>
                                <button type="submit" className="w-full bg-black text-white py-8 rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-xl border-b-8 border-zinc-900 transition-all hover:translate-y-[-4px]">Update Security Settings</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
                        <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic">User Directory</h3>
                            <button onClick={() => setShowAddModal('user')} className="p-4 bg-black text-white rounded-3xl shadow-xl hover:rotate-12 transition-transform"><Plus size={24} /></button>
                        </div>
                        <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {masterData.users?.map((u, idx) => {
                                const isEditing = editingItem === `user-${idx}`;
                                return (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 italic relative group shadow-inner min-h-[300px] flex flex-col justify-between">
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <input id={`edit-user-id-${idx}`} className="form-input py-4 text-xs font-black bg-white uppercase" defaultValue={u.id} placeholder="USER ID" />
                                                <input id={`edit-user-name-${idx}`} className="form-input py-4 text-xs font-black bg-white" defaultValue={u.name} placeholder="NAME" />
                                                <input id={`edit-user-pass-${idx}`} className="form-input py-4 text-xs font-black bg-white tracking-widest" defaultValue={u.password} placeholder="PASSWORD" />
                                                <select id={`edit-user-role-${idx}`} className="form-input py-4 text-xs font-black bg-white" defaultValue={u.role}>
                                                    <option value="manager">MANAGER</option>
                                                    <option value="admin">ADMIN</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingItem(null)} className="flex-1 bg-white text-slate-600 font-bold py-3 rounded-2xl font-black text-xs font-bold uppercase">Cancel</button>
                                                    <button onClick={() => handleUpdateUser(idx, {
                                                        id: document.getElementById(`edit-user-id-${idx}`).value.toUpperCase(),
                                                        name: document.getElementById(`edit-user-name-${idx}`).value,
                                                        password: document.getElementById(`edit-user-pass-${idx}`).value,
                                                        role: document.getElementById(`edit-user-role-${idx}`).value
                                                    })} className="flex-[2] bg-black text-white py-3 rounded-2xl font-black text-xs font-bold uppercase">Save Changes</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-black text-white' : 'bg-white text-slate-600 font-bold'}`}>
                                                        {u.role}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingItem(`user-${idx}`)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 font-bold hover:text-black transition-all">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {u.id !== 'NRZONE' && (
                                                            <button onClick={() => handleDeleteUser(u.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-500 transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <h4 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{u.name}</h4>
                                                    <p className="text-[11px] font-black text-slate-500 font-bold uppercase tracking-widest mt-2">{u.id}</p>
                                                </div>
                                                <div className="mt-5 pt-6 border-t border-slate-200/50 flex justify-between items-center">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-slate-500 font-bold uppercase tracking-widest">ACCESS KEY</p>
                                                        <p className="font-black tracking-[0.3em] text-slate-600 font-bold">••••••</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {activeTab === 'colors' && <ListSection category="colors" title="COLOR PALETTE" items={masterData.colors} icon={<LayoutGrid />} />}
                {activeTab === 'sizes' && <ListSection category="sizes" title="SIZE REPOSITORY" items={masterData.sizes} icon={<LayoutGrid />} />}

                {activeTab === 'pata' && (
                    <div className="space-y-12">
                        <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
                            <div className="p-12 border-b-2 border-slate-50 flex items-center justify-between">
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Pata Rate Matrix</h3>
                                <p className="text-xs font-bold text-slate-600 font-bold uppercase tracking-widest italic">PRICING ARCHIVE</p>
                            </div>
                            <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {masterData.pataTypes?.map((type) => (
                                    <div key={type} className="bg-slate-50 p-4 rounded-3xl flex flex-col justify-between shadow-inner h-64">
                                        <p className="font-black text-2xl uppercase tracking-tighter mb-5 italic">{type}</p>
                                        <div className="flex items-end gap-3 pt-8 border-t-2 border-slate-100">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold opacity-20 font-black italic uppercase mb-2">YIELD RATE</p>
                                                <input
                                                    type="number"
                                                    defaultValue={masterData.pataRates?.[type] || 0}
                                                    className="bg-transparent text-5xl font-black text-black text-left w-full outline-none italic leading-none"
                                                    onBlur={(e) => {
                                                        setMasterData(prev => ({
                                                            ...prev,
                                                            pataRates: { ...prev.pataRates, [type]: Number(e.target.value) || 0 }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <div className="text-3xl font-black opacity-10 italic">৳</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <ListSection category="pataTypes" title="Pata Taxonomy" items={masterData.pataTypes} icon={<LayoutGrid />} />
                    </div>
                )}
            </div>



            {
                showAddModal === 'user' && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 text-black">
                        <div className="bg-white w-full max-w-lg rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden p-16 space-y-12">
                            <div className="text-center">
                                <h3 className="text-4xl font-black uppercase italic mb-2">নতুন ইউজার</h3>
                                <p className="text-xl font-black tracking-widest text-slate-400 font-bold italic">Identity Provisioning</p>
                            </div>
                            <div className="space-y-8">
                                <input id="new-user-id" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 uppercase" placeholder="USER ID" />
                                <input id="new-user-pass" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100" placeholder="PASSWORD" />
                                <input id="new-user-name" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 uppercase" placeholder="DISPLAY NAME" />
                                <select id="new-user-role" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100">
                                    <option value="manager">MANAGER</option>
                                    <option value="admin">ADMIN</option>
                                </select>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-600 font-bold">Cancel</button>
                                    <button onClick={() => handleAddUser(
                                        document.getElementById('new-user-id').value,
                                        document.getElementById('new-user-pass').value,
                                        document.getElementById('new-user-name').value,
                                        document.getElementById('new-user-role').value
                                    )} className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900">Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                (showAddModal && !['user', 'worker', 'design'].includes(showAddModal)) && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 text-black italic">
                        <div className="bg-white w-full max-w-lg rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden p-16 space-y-12 animate-fade-up">
                            <div className="text-center">
                                <h3 className="text-4xl font-black uppercase italic mb-2">ADD {showAddModal.toUpperCase()}</h3>
                                <p className="text-xl font-black tracking-widest text-slate-400 font-bold italic">Core configuration</p>
                            </div>
                            <div className="space-y-8 uppercase">
                                <input id="new-list-item-value" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 italic" placeholder="ENTER VALUE..." autoFocus />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-600 font-bold">Cancel</button>
                                    <button onClick={() => handleAddListItem(showAddModal, document.getElementById('new-list-item-value').value)} className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900">Confirm Creation</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showAddModal === 'worker' && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 text-black">
                        <div className="bg-white w-full max-w-lg rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden p-16 space-y-12">
                            <div className="text-center">
                                <h3 className="text-4xl font-black uppercase italic mb-2">নতুন কর্মী</h3>
                                <p className="text-xl font-black tracking-widest text-slate-400 font-bold italic">User Deployment</p>
                            </div>
                            <div className="space-y-8 uppercase">
                                <select id="new-worker-dept" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100" value={newWorkerDept} onChange={(e) => setNewWorkerDept(e.target.value)}>
                                    <option value="sewing">Sewing Dept</option>
                                    <option value="stone">Stone Dept</option>
                                    <option value="pata">Pata Dept</option>
                                    <option value="logistics">Outside / Logistics</option>
                                    <option value="monthly">Monthly Staff</option>
                                </select>
                                <input id="new-worker-name" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100" placeholder="NAME" />
                                <input id="new-worker-wage" type="number" className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100" placeholder={newWorkerDept === 'monthly' ? "SALARY (৳)" : "SPECIFIC RATE (৳ - OPTIONAL)"} />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-600 font-bold">Cancel</button>
                                    <button onClick={() => handleAddWorker(newWorkerDept, document.getElementById('new-worker-name').value, document.getElementById('new-worker-wage')?.value || 0)} className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900">Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showAddModal === 'design' && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 text-black italic">
                        <div className="bg-white w-full max-w-2xl rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden p-16 space-y-10 max-h-[90vh] overflow-y-auto">
                            <div className="text-center">
                                <h3 className="text-4xl font-black uppercase italic mb-2">নতুন ডিজাইন</h3>
                                <p className="text-xl font-black tracking-widest text-slate-400 font-bold italic">Product Development</p>
                            </div>

                            <div className="flex justify-center">
                                <label className="w-40 h-40 bg-slate-50 rounded-2xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all relative overflow-hidden group">
                                    {temppImgUrl ? (
                                        <img src={temppImgUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            {uploading ? <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full"></div> : <Upload size={32} className="text-slate-500 font-bold group-hover:text-black transition-colors" />}
                                            <span className="text-[11px] font-bold font-black uppercase tracking-widest text-slate-500 font-bold mt-2">Upload Photo</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        if (e.target.files[0]) {
                                            const url = await handleImageUpload(e.target.files[0]);
                                            if (url) setTempImgUrl(url);
                                        }
                                    }} />
                                </label>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-center mb-4">
                                    <label className="bg-black text-white px-4 py-2 rounded-sm text-xs font-black uppercase italic tracking-[0.2em] shadow-2xl">Design Name</label>
                                </div>
                                <input id="new-design-name" className="form-input py-6 text-xl font-black bg-white border-slate-100 uppercase text-center" placeholder="DESIGN NAME" autoFocus />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2 text-center">
                                        <label className="bg-black text-white px-2 py-1 rounded-sm text-[11px] font-bold font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">Sewing Rate</label>
                                        <input id="new-design-sewing" type="number" className="form-input py-4 text-center font-black bg-white border-slate-100" placeholder="0" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <label className="bg-black text-white px-2 py-1 rounded-sm text-[11px] font-bold font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">Hijab Rate</label>
                                        <input id="new-design-hijab" type="number" className="form-input py-4 text-center font-black bg-white border-slate-100" placeholder="0" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <label className="bg-black text-white px-2 py-1 rounded-sm text-[11px] font-bold font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">Stone Rate</label>
                                        <input id="new-design-stone" type="number" className="form-input py-4 text-center font-black bg-white border-slate-100" placeholder="0" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <label className="bg-black text-white px-2 py-1 rounded-sm text-[11px] font-bold font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">Pata Rate</label>
                                        <input id="new-design-pata" type="number" className="form-input py-4 text-center font-black bg-white border-slate-100" placeholder="0" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <label className="bg-black text-white px-2 py-1 rounded-sm text-[11px] font-bold font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">Material Cost</label>
                                        <input id="new-design-cost" type="number" className="form-input py-4 text-center font-black bg-white border-slate-100 placeholder:text-slate-400 font-bold" placeholder="0" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <label className="bg-black text-white px-2 py-1 rounded-sm text-[11px] font-bold font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">Selling Price</label>
                                        <input id="new-design-sell" type="number" className="form-input py-4 text-center font-black text-emerald-600 bg-white border-emerald-100 placeholder:text-emerald-200" placeholder="0" />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-600 font-bold">Cancel</button>
                                    <button onClick={() => handleAddDesign(
                                        document.getElementById('new-design-name').value,
                                        document.getElementById('new-design-sewing').value,
                                        document.getElementById('new-design-stone').value,
                                        document.getElementById('new-design-pata').value,
                                        document.getElementById('new-design-hijab').value,
                                        document.getElementById('new-design-cost').value,
                                        document.getElementById('new-design-sell').value
                                    )} className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900">Confirm Creation</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
};

export default SettingsPanel;
