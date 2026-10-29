// backtest.js 결과를 게임 폴더로 옮긴다 (gamedata.js + engine.js 복사)
const fs = require('fs');
const path = require('path');
const R = require('./results.json');
const out = path.join(__dirname, '..', 'game');
fs.mkdirSync(out, { recursive: true });
const data = {
  params: R.avgParams,
  start: R.start,
  baseline: R.curve.map(c => ({ year: c.year, total: Math.round(c.total), index: +c.index.toFixed(4), young: Math.round(c.young) })),
  history: R.history.map(c => ({ year: c.year, total: Math.round(c.total), index: +c.index.toFixed(4), young: Math.round(c.young) })),
  tests: R.results.map(r => ({ label: r.label, mape: +r.mape.toFixed(1), nmape: +r.nmape.toFixed(1), rows: r.rows })),
};
fs.writeFileSync(path.join(out, 'gamedata.js'), 'window.GAME_DATA = ' + JSON.stringify(data) + ';\n');
fs.copyFileSync(path.join(__dirname, 'engine.js'), path.join(out, 'engine.js'));
console.log('ok', fs.statSync(path.join(out, 'gamedata.js')).size, 'bytes');
