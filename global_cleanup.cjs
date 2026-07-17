const fs = require('fs');
const glob = require('glob');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace utility: replaces a class only if it doesn't already have dark: prefix
  // Since regex in JS doesn't have good variable lookbehind, we'll do it by replacing the exact words.
  // Actually, standard regex with word boundaries is fine.

  // We only want to replace these classes when they are NOT preceded by `dark:`
  const replaceClass = (regex, replacement) => {
    // regex should match the class with a negative lookbehind for `dark:` if possible,
    // but JS supports lookbehind now!
    // Example: /(?<!dark:)bg-black/g
    content = content.replace(regex, replacement);
  };

  // Backgrounds
  const darkBgs = [
    'bg-black', 'bg-gray-800', 'bg-gray-900', 'bg-gray-950',
    'bg-slate-800', 'bg-slate-900', 'bg-slate-950',
    'bg-zinc-800', 'bg-zinc-900', 'bg-zinc-950',
    'bg-neutral-800', 'bg-neutral-900', 'bg-neutral-950',
    'bg-\\[\\#0B0B0C\\]', 'bg-\\[\\#18181B\\]', 'bg-\\[\\#0B1528\\]', 
    'bg-\\[\\#111e38\\]', 'bg-\\[\\#1A1A1A\\]', 'bg-\\[\\#050505\\]', 'bg-\\[\\#0a0a0a\\]'
  ];

  darkBgs.forEach(bg => {
    // If we find e.g. bg-black, replace with bg-white dark:bg-black
    // But be careful not to replace bg-black/50 directly with bg-white if it's meant to be an overlay.
    // Let's handle overlays separately or just leave them if they have opacity.
    // We only replace exact bg matches (followed by word boundary or space/quote)
    const exactRegex = new RegExp(`(?<!dark:)(?<!\\w)${bg}(?!\\/[0-9]+)(?!\\w)`, 'g');
    // Replace with bg-white dark:bg-...
    content = content.replace(exactRegex, `bg-white dark:${bg.replace(/\\/g, '')}`);
  });
  
  // Overlays with opacity (e.g., bg-black/80). For light mode, maybe bg-white/80 or bg-gray-900/80?
  // The user says "O fundo base de absolutamente TODAS as seções do site... deve ser bg-white ou bg-gray-50."
  // Modals overlays are usually dark even in light mode. Let's leave bg-black/80 alone, as it's an overlay.

  // Borders
  const darkBorders = [
    'border-gray-700', 'border-gray-800', 'border-gray-900',
    'border-slate-700', 'border-slate-800', 'border-slate-900',
    'border-zinc-700', 'border-zinc-800', 'border-zinc-900',
    'border-neutral-700', 'border-neutral-800', 'border-neutral-900',
    'border-\\[\\#1A1A1A\\]', 'border-blue-800', 'border-blue-900'
  ];
  darkBorders.forEach(border => {
    const exactRegex = new RegExp(`(?<!dark:)(?<!\\w)${border}(?!\\/[0-9]+)(?!\\w)`, 'g');
    content = content.replace(exactRegex, `border-gray-200 dark:${border.replace(/\\/g, '')}`);
  });

  // Texts
  // For text-white, replace with text-gray-900 dark:text-white
  content = content.replace(/(?<!dark:)(?<!\w)text-white(?!\w)/g, 'text-gray-900 dark:text-white');
  
  // For text-gray-300, 400, 500, replace with text-gray-600 dark:text-gray-X
  content = content.replace(/(?<!dark:)(?<!\w)text-gray-300(?!\w)/g, 'text-gray-600 dark:text-gray-300');
  content = content.replace(/(?<!dark:)(?<!\w)text-gray-400(?!\w)/g, 'text-gray-600 dark:text-gray-400');
  content = content.replace(/(?<!dark:)(?<!\w)text-gray-500(?!\w)/g, 'text-gray-500 dark:text-gray-400');
  
  // Also neutral/zinc/slate texts
  content = content.replace(/(?<!dark:)(?<!\w)text-neutral-300(?!\w)/g, 'text-gray-600 dark:text-neutral-300');
  content = content.replace(/(?<!dark:)(?<!\w)text-neutral-400(?!\w)/g, 'text-gray-600 dark:text-neutral-400');
  
  // Text blue 900 removal
  content = content.replace(/(?<!dark:)(?<!\w)text-blue-900(?!\w)/g, 'text-gray-900 dark:text-white');
  content = content.replace(/(?<!dark:)(?<!\w)text-blue-800(?!\w)/g, 'text-gray-900 dark:text-white');

  // Fix up buttons that are pink or emerald (they should be text-white in both modes)
  // E.g. bg-[#FF2D8D] text-gray-900 dark:text-white -> bg-[#FF2D8D] text-white
  // Or bg-[var(--brand-color)] text-gray-900 dark:text-white -> bg-[var(--brand-color)] text-white
  const brandBgs = [
    'bg-\\[\\#FF2D8D\\]', 'bg-\\[\\#FF2A7A\\]', 'bg-\\[var\\(--brand-color\\)\\]', 
    'bg-emerald-500', 'bg-emerald-600', 'bg-red-500', 'bg-red-600', 'bg-[#FF6FB5]'
  ];
  
  // We can just run a generic replace for any element with a brand background and text-gray-900 dark:text-white
  // It's easier to do this by finding "text-gray-900 dark:text-white" on lines that have the brand bg.
  // We'll just do a global replace for all common button patterns.
  // A safe way is to find instances where brand bg and the text class are in the same className string.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

const files = glob.sync('src/**/*.{tsx,ts}', { nodir: true });
files.forEach(processFile);
