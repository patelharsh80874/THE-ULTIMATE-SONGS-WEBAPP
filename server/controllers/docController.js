import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller to render the API Documentation Dashboard
 */
export const renderApiDocs = (req, res) => {
  try {
    const docPath = path.join(__dirname, '..', '..', 'API_DOCUMENTATION.md');
    if (!fs.existsSync(docPath)) {
        return res.status(404).send('API_DOCUMENTATION.md not found in the root folder.');
    }

    const markdown = fs.readFileSync(docPath, 'utf8');
    
    // Markdown-to-HTML conversion logic
    const htmlContent = markdown
      .replace(/^# (.*$)/gm, '<h1 id="top" class="text-5xl font-black text-white mb-10 border-b-4 border-green-500 pb-6 uppercase tracking-tighter">$1</h1>')
      .replace(/^## (.*$)/gm, (match, p1) => {
        const cleanId = p1.split('(')[0].toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
        return `<h2 id="${cleanId}" class="text-3xl font-black text-green-400 mt-20 mb-10 uppercase tracking-widest flex items-center gap-3 border-l-8 border-green-500 pl-6 bg-green-500/5 py-5 rounded-r-2xl shadow-lg border-opacity-50">${p1}</h2>`;
      })
      .replace(/^### (.*$)/gm, '<h3 class="text-2xl font-bold text-white mt-14 mb-8 border-b border-white/10 pb-3">$1</h3>')
      .replace(/^\| (.*) \|/gm, (match) => {
        if (match.includes('---')) return '';
        const cells = match.split('|').filter(c => c.trim() !== '').map(c => `<td class="px-6 py-6 border-b border-white/5 text-sm font-medium leading-relaxed">${c.trim()}</td>`).join('');
        return `<tr class="hover:bg-white/5 transition-all duration-300 group cursor-default">${cells}</tr>`;
      })
      .replace(/```json([\s\S]*?)```/gm, '<div class="relative group my-12"><div class="absolute top-4 right-6 text-[10px] uppercase font-black text-zinc-600 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Example JSON</div><pre class="bg-slate-950 p-10 rounded-[2.5rem] border border-white/10 font-mono text-sm leading-relaxed overflow-x-auto text-green-400/90 shadow-2xl ring-1 ring-white/5"><code>$1</code></pre></div>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-white px-1 shadow-[inset_0_-2px_0_theme(colors.green.500)]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-green-500/80 italic">$1</em>')
      .replace(/`(.*?)`/gm, '<code class="bg-slate-800/80 px-2.5 py-1 rounded-md text-green-400 font-mono text-sm border border-white/10 shadow-sm">$1</code>')
      .replace(/^[-*] (.*$)/gm, '<li class="ml-10 mb-5 list-none relative before:content-[\'\'] before:absolute before:-left-6 before:top-3 before:w-2 before:h-2 before:bg-green-500 before:rounded-full text-zinc-400 font-medium leading-relaxed">$1</li>');

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en" class="scroll-smooth">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API DASHBOARD | THE ULTIMATE SONGS</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100;400;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Geist', sans-serif; background-color: #020617; color: #94a3b8; line-height: 1.8; }
          .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
          .sidebar-link:hover { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
          table { width: 100%; margin: 3rem 0; border-radius: 1.5rem; overflow: hidden; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); }
          th { background: rgba(30, 41, 59, 1); text-align: left; padding: 1.25rem 1.5rem; font-weight: 900; font-size: 0.7rem; color: #fff; text-transform: uppercase; letter-spacing: 0.2em; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
          pre::-webkit-scrollbar { height: 8px; }
          pre::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        </style>
      </head>
      <body class="selection:bg-green-500 selection:text-slate-900">
        <div class="flex min-h-screen">
          <aside class="w-80 hidden md:flex fixed h-screen glass border-r border-white/5 p-8 flex-col gap-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-slate-900 font-black shadow-lg shadow-green-500/20 text-xl">U</div>
              <h1 class="text-xl font-black text-white tracking-tighter uppercase">ULTIMATE <span class="text-green-500">API</span></h1>
            </div>
            
            <nav class="flex flex-col gap-2">
              <p class="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-4 mb-2">QUICK LINKS</p>
              <a href="#getting-started" class="sidebar-link px-4 py-3 rounded-xl transition-all font-bold text-sm">Getting Started</a>
              <a href="#authentication" class="sidebar-link px-4 py-3 rounded-xl transition-all font-bold text-sm">Authentication</a>
              <a href="#playlists" class="sidebar-link px-4 py-3 rounded-xl transition-all font-bold text-sm">Playlists</a>
              <a href="#user-customization" class="sidebar-link px-4 py-3 rounded-xl transition-all font-bold text-sm">User & Likes</a>
              <a href="#admin-controls" class="sidebar-link px-4 py-3 rounded-xl transition-all font-bold text-sm">Admin Access</a>
              <a href="#standard-status-codes" class="sidebar-link px-4 py-3 rounded-xl transition-all font-bold text-sm">Status Codes</a>
            </nav>
          </aside>

          <main class="flex-1 ml-0 md:ml-80 px-4 sm:px-8 md:px-20 py-10 md:py-20 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.05),transparent)]">
            <div class="max-w-4xl mx-auto">
              <div class="overflow-x-auto">
                 ${htmlContent}
              </div>
              <footer class="mt-20 md:mt-40 border-t border-white/5 pt-10 pb-20 text-center">
                <p class="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">Designed for THE ULTIMATE SONGS &bull; 2026</p>
              </footer>
            </div>
          </main>
        </div>
      </body>
      </html>
    `;
    res.send(fullHtml);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading documentation.');
  }
};
