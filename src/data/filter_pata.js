import { historicalData } from "./historicalData.js";

const filteredData = historicalData.filter(entry => {
    // Check if any item in the entry starts with "পাতা" or is exactly "পাতা"
    // The user data had "পাতা 120", "পাতা", etc. in raw. 
    // In my JSON I mapped "design" to "পাতা".
    const hasPata = entry.items.some(item => item.design.includes("পাতা"));
    return !hasPata;
});

console.log("export const historicalData = " + JSON.stringify(filteredData, null, 4) + ";");

