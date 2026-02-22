const fs = require('fs');
const path = require('path');

const directory = './src';

function replaceInFile(filePath) {
    const ext = path.extname(filePath);
    if (ext !== '.jsx' && ext !== '.js' && ext !== '.css') return;

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Reduce padding
    content = content.replace(/p-10/g, 'p-6');
    content = content.replace(/p-8/g, 'p-5');
    content = content.replace(/p-6/g, 'p-4');

    // Reduce gaps
    content = content.replace(/gap-8/g, 'gap-5');
    content = content.replace(/gap-6/g, 'gap-4');
    content = content.replace(/gap-4/g, 'gap-3');
    content = content.replace(/gap-5/g, 'gap-3');

    // Reduce margins
    content = content.replace(/mb-10/g, 'mb-6');
    content = content.replace(/mb-12/g, 'mb-6');
    content = content.replace(/mt-12/g, 'mt-6');
    content = content.replace(/mb-8/g, 'mb-5');
    content = content.replace(/mt-8/g, 'mt-5');
    content = content.replace(/mb-6/g, 'mb-4');
    content = content.replace(/mt-6/g, 'mt-4');

    // Reduce rounded corners for smaller boxes
    content = content.replace(/rounded-\[4rem\]/g, 'rounded-3xl');
    content = content.replace(/rounded-\[3.5rem\]/g, 'rounded-3xl');
    content = content.replace(/rounded-\[3rem\]/g, 'rounded-2xl');
    content = content.replace(/rounded-\[2.5rem\]/g, 'rounded-2xl');
    content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
    content = content.replace(/rounded-\[1.5rem\]/g, 'rounded-lg');

    // Make texts more legible and catchy ("sohoje choke pore text")
    content = content.replace(/text-\[7px\]/g, 'text-[10px] font-bold');
    content = content.replace(/text-\[9px\]/g, 'text-[11px] font-bold');
    content = content.replace(/text-\[10px\]/g, 'text-xs font-bold');
    content = content.replace(/text-slate-400/g, 'text-slate-600 font-bold');
    content = content.replace(/text-slate-300/g, 'text-slate-500 font-bold');
    content = content.replace(/text-slate-200/g, 'text-slate-400 font-bold');

    // Convert to more solid colors where black/white might look too dull or lacks contrast:
    // (Already mostly black and white, making text bolder and slightly darker slate increases contrast)

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(directory);
console.log('Update complete.');
