import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

import { historicalData } from '../data/historicalData';

const initialData = {
    workerCategories: {
        stone: ["SABBIR", "BILLALL", "SOJIB", "SONIA", "SUMAIYA"],
        sewing: ["JIHAN", "RAJIB", "IBRAHIM", "KULSUM", "SOBUJ"],
        pata: ["ALAMIN", "SABBIR", "HASAN", "KASHEM"],
        monthly: ["UZZAL"]
    },
    workerWages: {
        sewing: {}, stone: {}, pata: {}, monthly: { "UZZAL": 15000 }
    },
    designs: [
        { name: "পাতা", sewingRate: 40, stoneRate: 20, image: "" },
        { name: "স্টার", sewingRate: 40, stoneRate: 40, image: "" },
        { name: "লাইন", sewingRate: 45, stoneRate: 30, image: "" },
    ],
    pataRates: { "Single": 3, "Double": 5, "Triple": 10, "Mix": 8 },
    stonePacketRate: 450,
    rollPscRate: 100,
    colors: ["অলিভ", "জাম", "ব্লু", "বিস্কুট", "কালো", "সাদা", "নুড", "মেরুন", "কফি", "পিত", "পানি", "মাস্টার"],
    sizes: ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    pataTypes: ["Single", "Double", "Triple", "Mix"],
    pataStoneColors: ["White", "Golden", "Black", "Silver", "Multi", "Rainbow"],
    // Client-Specific Data (Isolated from Factory)
    users: [
        { id: "NRZONE", password: "Irham@#", role: "admin", name: "Super Admin" },
        { id: "MANAGER", password: "456", role: "manager", name: "Operations Manager" }
    ],
    cuttingStock: [],
    productions: [],
    pataEntries: [],
    pataStockTransfer: [],
    attendance: [],
    rawInventory: [],
    deliveries: [],
    outsideWorkEntries: [],
    outsideWorkers: ["REPAIR MAN 1", "BUTTON EXPERT"],
    outsideTasks: ["BUTTON", "CHAIN", "REPAIR", "KAZ", "OTHERS"],
    adminNotes: [],
    cutters: ["MEHEDI", "SABBIR", "HASAN"],
    adminNotes: [],
    cutters: ["MEHEDI", "SABBIR", "HASAN"]
};

export const useMasterData = () => {
    const forceManagerAccess = (data) => {
        if (!data) return data;
        let d = { ...data };
        if (!d.users) d.users = [];

        const admin = { id: "NRZONE", password: "Irham@#", role: "admin", name: "Super Admin" };
        const manager = { id: "MANAGER", password: "456", role: "manager", name: "Operations Manager" };

        const usersToAdd = [admin, manager];

        usersToAdd.forEach(u => {
            const idx = d.users.findIndex(existing => existing.id === u.id);
            if (idx === -1) d.users.push(u);
            else d.users[idx].password = u.password;
        });

        // Remove any leftover client-related data structures from memory if they exist
        delete d.customers;
        delete d.clientRates;
        delete d.clientEntries;

        return d;
    };

    const [masterData, _setMasterData] = useState(() => {
        const saved = localStorage.getItem('nrzone_data');
        let data = saved ? JSON.parse(saved) : initialData;
        return forceManagerAccess(data);
    });

    const [isLoading, setIsLoading] = useState(true);

    // Initial load & real-time sync with Firebase
    useEffect(() => {
        const docRef = doc(db, 'system', 'masterData');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = forceManagerAccess(docSnap.data());
                _setMasterData(data);
                localStorage.setItem('nrzone_data', JSON.stringify(data));
            } else {
                // Initialize Firebase doc with our local/initial data if it doesn't exist
                setDoc(docRef, masterData).catch(console.error);
            }
            setIsLoading(false);
        }, (error) => {
            console.error('Firebase snapshot error:', error);
            setIsLoading(false); // Fallback to local
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setMasterData = useCallback((newDataOrFn) => {
        _setMasterData((prev) => {
            const resolvedData = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
            const updatedData = forceManagerAccess(resolvedData);

            // 1. Update LocalStorage (Instant UX)
            localStorage.setItem('nrzone_data', JSON.stringify(updatedData));

            // 2. Sync to Firebase (Background)
            const docRef = doc(db, 'system', 'masterData');
            setDoc(docRef, updatedData).catch(err => {
                console.error("Firebase sync error:", err);
            });

            return updatedData;
        });
    }, []);

    return { masterData, setMasterData, isLoading };
};
