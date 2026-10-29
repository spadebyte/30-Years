// 모델 점검: 정책·이벤트 값을 사람 수로 바꿔 보고, 점수 기준(최선)이 정말 최선인지 확인한다.
const fs = require('fs');
const path = require('path');
const M = require('./engine');
const R = require('./results.json');
const win = {};
new Function('window', fs.readFileSync(path.join(__dirname, '..', 'game', 'choices.js'), 'utf8').replace('(this)', '(window)'))(win);
const C = win.Choices;
const START = 2025, END = 2055, YEARS = END - START;
const s0 = R.start, g = i => s0.m[i] + s0.f[i];
const opts = { level: 'mid' };

// 1) 정책 10포인트의 1년 효과 (2025년 기준 인원)
console.log('== 정책 10포인트, 1년 효과');
for (const id in M.POLICIES) {
  const { adj, birthMul } = M.policyAdj({ [id]: 10 }, 'mid');
  console.log(id, Math.round(adj.reduce((a, v, i) => a + v * g(i), 0)), '명', birthMul > 1 ? `출생 x${birthMul.toFixed(3)}` : '');
}

// 2) 이벤트 선택지의 효과 (1년 인원, 기간, 즉시 전입, 예산)
console.log('\n== 이벤트 선택지');
for (const ev of C.CHOICES) for (const o of ev.options) {
  const parts = (o.mods || []).map(m => {
    const p = m.adj ? Math.round(Object.entries(m.adj).reduce((a, [k, v]) => a + v * g(+k), 0)) : 0;
    return `${m.years}년: ${p ? p + '명/년 ' : ''}${m.budget ? '예산' + (m.budget > 0 ? '+' : '') + m.budget + ' ' : ''}${m.birth ? '출생x' + m.birth : ''}`.trim();
  });
  console.log(ev.year, o.label.padEnd(16), o.add ? `즉시 +${o.add.n}명` : '', parts.join(' / '));
}

// 3) 랜덤 없이 끝까지 돌리기
function run(plan, picks) {
  const ctx = { state: JSON.parse(JSON.stringify(s0)), mods: [], year: START, flags: {} };
  const hist = [];
  while (ctx.year < END) {
    const ev = C.CHOICES.find(e => e.year === ctx.year);
    if (ev) C.apply(ctx, ev.options[picks[ev.year]]);
    const act = C.active(ctx.mods, ctx.year);
    hist.push(C.trim(plan[hist.length], act.budget));
    ctx.state = M.yearStep(ctx.state, R.avgParams, hist, { ...opts, extra: act.extra, birthExtra: act.birth }, null, s0).state;
    ctx.year++;
  }
  return M.stats(ctx.state);
}
// 게임과 같은 방식: 목표별 최선 계획 + 이벤트는 하나씩 앞을 내다보며 고름
function greedy(goal) {
  const plan = M.optimize(R.avgParams, s0, YEARS, opts, goal).plan;
  const picks = {};
  for (const ev of C.CHOICES) {
    let best = -Infinity, bi = 0;
    for (let i = 0; i < 2; i++) {
      // 앞으로 남은 이벤트는 아직 안 정했으니 0번으로 두고 비교 (게임은 '이후 이벤트 없음'으로 계산)
      const trial = { ...picks, [ev.year]: i };
      for (const e of C.CHOICES) if (trial[e.year] === undefined) trial[e.year] = -1;
      const st = runPartial(plan, trial)[goal];
      if (st > best) { best = st; bi = i; }
    }
    picks[ev.year] = bi;
  }
  return { plan, picks, value: run(plan, picks)[goal] };
}
function runPartial(plan, picks) {
  const ctx = { state: JSON.parse(JSON.stringify(s0)), mods: [], year: START, flags: {} };
  const hist = [];
  while (ctx.year < END) {
    const ev = C.CHOICES.find(e => e.year === ctx.year);
    if (ev && picks[ev.year] >= 0) C.apply(ctx, ev.options[picks[ev.year]]);
    const act = C.active(ctx.mods, ctx.year);
    hist.push(C.trim(plan[hist.length], act.budget));
    ctx.state = M.yearStep(ctx.state, R.avgParams, hist, { ...opts, extra: act.extra, birthExtra: act.birth }, null, s0).state;
    ctx.year++;
  }
  return M.stats(ctx.state);
}

console.log('\n== 점수 기준(최선) 점검: 게임 방식 vs 이벤트 256가지 전부');
for (const goal of ['total', 'index']) {
  const gr = greedy(goal);
  let best = -Infinity, bestPicks = null;
  for (let mask = 0; mask < 256; mask++) {
    const picks = {};
    C.CHOICES.forEach((e, i) => { picks[e.year] = (mask >> i) & 1; });
    const v = run(gr.plan, picks)[goal];
    if (v > best) { best = v; bestPicks = picks; }
  }
  const diffPicks = C.CHOICES.filter(e => bestPicks[e.year] !== gr.picks[e.year]).map(e => e.year);
  console.log(goal, '게임 방식', goal === 'index' ? gr.value.toFixed(4) : Math.round(gr.value), '| 전부 시험', goal === 'index' ? best.toFixed(4) : Math.round(best), '| 다른 선택', diffPicks.join(',') || '없음');
}
