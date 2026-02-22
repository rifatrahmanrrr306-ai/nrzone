const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Decrease paddings
    content = content.replace(/\bp-12\b/g, 'p-6');
    content = content.replace(/\bp-10\b/g, 'p-5');
    content = content.replace(/\bp-8\b/g, 'p-4');
    content = content.replace(/\bp-20\b/g, 'p-8');

    // Decrease gap sizes
    content = content.replace(/\bgap-12\b/g, 'gap-6');
    content = content.replace(/\bgap-10\b/g, 'gap-5');
    content = content.replace(/\bgap-8\b/g, 'gap-4');

    // Decrease margin
    content = content.replace(/\bmb-12\b/g, 'mb-6');
    content = content.replace(/\bmb-10\b/g, 'mb-5');
    content = content.replace(/\bmb-8\b/g, 'mb-4');

    // Decrease border radius
    content = content.replace(/rounded-\[5rem\]/g, 'rounded-[2rem]');
    content = content.replace(/rounded-\[4rem\]/g, 'rounded-[1.5rem]');
    content = content.replace(/rounded-\[3\.5rem\]/g, 'rounded-[1.5rem]');
    content = content.replace(/rounded-\[3rem\]/g, 'rounded-[1.25rem]');
    content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-xl');
    content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-lg');
    content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
    content = content.replace(/\brounded-3xl\b/g, 'rounded-xl');

    // Decrease font sizes
    content = content.replace(/\btext-8xl\b/g, 'text-5xl');
    content = content.replace(/\btext-7xl\b/g, 'text-4xl');
    content = content.replace(/\btext-6xl\b/g, 'text-4xl');
    content = content.replace(/\btext-5xl\b/g, 'text-3xl');
    content = content.replace(/\btext-4xl\b/g, 'text-2xl');
    content = content.replace(/\btext-3xl\b/g, 'text-xl');
    content = content.replace(/\btext-2xl\b/g, 'text-lg');
    content = content.replace(/\btext-xl\b/g, 'text-base');

    // Fix huge icon sizing manually if it matches commonly used ones
    content = content.replace(/size={120}/g, 'size={60}');
    content = content.replace(/size={64}/g, 'size={32}');
    content = content.replace(/size={48}/g, 'size={28}');
    content = content.replace(/size={40}/g, 'size={24}');
    content = content.replace(/size={32}/g, 'size={20}');

    // Box dimensions
    content = content.replace(/\bw-24\b/g, 'w-16');
    content = content.replace(/\bh-24\b/g, 'h-16');
    content = content.replace(/\bw-20\b/g, 'w-12');
    content = content.replace(/\bh-20\b/g, 'h-12');
    content = content.replace(/\bw-16\b/g, 'w-10');
    content = content.replace(/\bh-16\b/g, 'h-10');

    // Borders
    content = content.replace(/\bborder-4\b/g, 'border-2');
    content = content.replace(/\bborder-b-\[12px\]/g, 'border-b-[6px]');
    content = content.replace(/\bborder-[12px]/g, 'border-[6px]');
    content = content.replace(/\bborder-b-\[8px\]/g, 'border-b-[4px]');

    fs.writeFileSync(file, content, 'utf8');
});
console.log('UI resizing complete.');
