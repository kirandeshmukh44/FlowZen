const fs = require('fs');
const p = 'e:/FSD/Node Project/FlowZen/Client/src/pages/LandingPage.jsx';
const chunk = `
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['12k+', 'Tasks prioritized'], ['94%', 'AI accuracy'], ['3.2x', 'Faster delivery'], ['500+', 'Teams']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-rose-400 to-violet-400 bg-clip-text text-transparent">{v}</div>
              <div className="text-xs text-white/60 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>
`;
fs.appendFileSync(p, chunk);
console.log('done1');`;
fs.writeFileSync('e:/FSD/Node Project/FlowZen/Client/_a1.cjs', chunk.replace('const fs = require(\'fs\');\n',''))