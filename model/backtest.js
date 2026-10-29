// 백테스트: 과거 자료로 모델을 맞춘 뒤, 그 뒤 몇 년을 예측해서 실제와 비교한다.
const fs = require('fs');
const path = require('path');
const M = require('./engine');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'population.json'), 'utf8'));
const keys = Object.keys(data);

function project(start, params, years) {
  let s = start;
  for (let i = 0; i < years; i++) s = M.step(s, params);
  return s;
}

function compare(label, fitFrom, fitTo, predictTo, paramsFor) {
  const rows = [];
  for (const k of keys) {
    const yrs = data[k].years;
    const params = paramsFor(k);
    const pred = M.stats(project(yrs[fitTo], params, predictTo - fitTo));
    const real = M.stats(yrs[predictTo]);
    // 비교 기준: '인구가 직전 기간과 같은 비율로 줄어든다'는 단순 추세
    const rate = M.stats(yrs[fitTo]).total / M.stats(yrs[fitFrom]).total;
    const naive = M.stats(yrs[fitTo]).total * Math.pow(rate, (predictTo - fitTo) / (fitTo - fitFrom));
    rows.push({
      군: data[k].name,
      실제인구: Math.round(real.total),
      모델인구: Math.round(pred.total),
      모델오차: ((pred.total - real.total) / real.total * 100).toFixed(1) + '%',
      단순추세오차: ((naive - real.total) / real.total * 100).toFixed(1) + '%',
      실제지수: real.index.toFixed(3),
      모델지수: pred.index.toFixed(3),
      실제청년: Math.round(real.young),
      모델청년: Math.round(pred.young),
    });
  }
  const mape = rows.reduce((s, r) => s + Math.abs(parseFloat(r.모델오차)), 0) / rows.length;
  const nmape = rows.reduce((s, r) => s + Math.abs(parseFloat(r.단순추세오차)), 0) / rows.length;
  const youngErr = rows.reduce((s, r) => s + Math.abs(r.모델청년 - r.실제청년) / r.실제청년 * 100, 0) / rows.length;
  console.log(`\n=== ${label} ===`);
  console.table(rows);
  console.log(`평균 오차: 모델 ${mape.toFixed(1)}% / 단순추세 ${nmape.toFixed(1)}% / 청년(20~39세) ${youngErr.toFixed(1)}%`);
  return { label, rows, mape, nmape, youngErr };
}

const results = [];
// 1) 각 군 자기 자료로: 2015~2020 맞춤 → 2025 예측
results.push(compare('검증 1: 2015~2020으로 맞추고 2025 예측 (5년)', 2015, 2020, 2025,
  k => M.fit(data[k].years, 2015, 2020)));
// 2) 더 길게: 2010~2015 맞춤 → 2025 예측 (10년)
results.push(compare('검증 2: 2010~2015로 맞추고 2025 예측 (10년)', 2010, 2015, 2025,
  k => M.fit(data[k].years, 2010, 2015)));
// 3) 교차 검증: 진안·무주·장수 3곳을 합쳐 맞춘 숫자를 나머지 4곳에 그대로 적용
const train = ['jinan', 'muju', 'jangsu'];
const pooled = M.fit(M.pool(train.map(k => data[k].years)), 2015, 2020);
const r3 = compare('검증 3: 3개 군으로 맞춘 숫자를 다른 4개 군에 적용 (2020→2025)', 2015, 2020, 2025, () => pooled);
r3.rows = r3.rows.filter(r => !['진안군', '무주군', '장수군'].includes(r.군));
r3.mape = r3.rows.reduce((s, r) => s + Math.abs(parseFloat(r.모델오차)), 0) / r3.rows.length;
r3.nmape = r3.rows.reduce((s, r) => s + Math.abs(parseFloat(r.단순추세오차)), 0) / r3.rows.length;
console.log(`(시험용 4개 군만) 평균 오차: 모델 ${r3.mape.toFixed(1)}% / 단순추세 ${r3.nmape.toFixed(1)}%`);
results.push(r3);

// 게임에서 쓸 '가상의 군': 7개 군 평균 (2020~2025 추세로 맞춤, 2025년 인구에서 출발)
const all = M.pool(keys.map(k => data[k].years));
const avgParams = M.fit(all, 2020, 2025);
// 출생은 2024·2025년 반등을 반영해 최근 2년(2023~2025)으로 다시 맞춘다 (0.0199 → 0.0206)
avgParams.birth = M.fit(all, 2023, 2025).birth;
const start = { m: all[2025].m.map(v => v / keys.length), f: all[2025].f.map(v => v / keys.length) };
let s = start;
const curve = [{ year: 2025, ...M.stats(s) }];
for (let y = 2026; y <= 2055; y++) { s = M.step(s, avgParams); curve.push({ year: y, ...M.stats(s) }); }
console.log('\n=== 가상의 군 (7개 군 평균), 정책 없이 30년 ===');
for (const c of curve.filter(c => c.year % 5 === 0)) console.log(c.year, Math.round(c.total), '명  지수', c.index.toFixed(3), ' 청년', Math.round(c.young));

// 실제 과거 곡선 (게임의 백테스트 그래프용)
const history = [];
for (let y = 2010; y <= 2025; y++) history.push({ year: y, ...M.stats({ m: all[y].m.map(v => v / keys.length), f: all[y].f.map(v => v / keys.length) }) });

fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ results, avgParams, start, curve, history }, null, 1));
