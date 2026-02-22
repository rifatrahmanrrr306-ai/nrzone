const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyDVgJGENR7sVKupsCpjFbygxW0VdnyPEUE1wcXvAe4Lhc4iD4hrVriU7vMLv1cSLXv2A/exec";

export const syncToSheet = async (data) => {
    try {
        const payload = {
            timestamp: new Date().toLocaleString(),
            ...data
        };

        // Using fetch with no-cors for Google Apps Script
        // We use a simple text/plain body to avoid preflight issues in some browsers
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(payload)
        });
        console.log("Sync requested for:", data.type);
    } catch (error) {
        console.error("Sync Error:", error);
    }
};
