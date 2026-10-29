// 지역 인구 모델 (게임과 검증이 같은 코드를 쓴다)
// 18개 연령 구간(0~4세 … 80~84세, 85세 이상) × 남녀.
// 매년 각 구간의 1/5이 다음 구간으로 넘어가고, 구간별 '연간 잔존율' f를 곱한다.
// f에는 사망과 전입·전출이 함께 들어 있다 (과거 실제 인구 변화에서 계산).
(function (root) {
  const G = 18;           // 연령 구간 수
  const FERTILE = [3, 4, 5, 6, 7, 8, 9];  // 15~49세 여성
  const YOUNG_F = [4, 5, 6, 7];            // 20~39세 여성 (소멸위험지수 분자)
  const OLD = [13, 14, 15, 16, 17];        // 65세 이상

  function age(pop, f, births) {
    const next = new Array(G);
    next[0] = births + f[0] * 0.8 * pop[0];
    for (let g = 1; g < G - 1; g++) next[g] = f[g] * (0.8 * pop[g] + 0.2 * pop[g - 1]);
    next[G - 1] = f[G - 1] * (pop[G - 1] + 0.2 * pop[G - 2]);
    return next;
  }

  const sum = (a, idx) => (idx ? idx.reduce((s, i) => s + a[i], 0) : a.reduce((s, v) => s + v, 0));

  // 과거 연속된 해들의 인구(years[y] = {m:[18], f:[18]})로 연간 잔존율과 출생률을 맞춘다.
  function fit(years, from, to) {
    const params = { m: new Array(G).fill(0), f: new Array(G).fill(0), birth: 0, boyShare: 0 };
    const n = to - from;
    for (const sex of ['m', 'f']) {
      for (let g = 1; g < G; g++) {
        let logSum = 0;
        for (let y = from; y < to; y++) {
          const p = years[y][sex], q = years[y + 1][sex];
          const base = g === G - 1 ? p[g] + 0.2 * p[g - 1] : 0.8 * p[g] + 0.2 * p[g - 1];
          logSum += Math.log(q[g] / base);
        }
        params[sex][g] = Math.exp(logSum / n);
      }
      params[sex][0] = params[sex][1];
    }
    let birthSum = 0, boys = 0, all = 0;
    for (let y = from; y < to; y++) {
      const p = years[y], q = years[y + 1];
      const births = (q.m[0] - params.m[0] * 0.8 * p.m[0]) + (q.f[0] - params.f[0] * 0.8 * p.f[0]);
      birthSum += births / sum(p.f, FERTILE);
      boys += q.m[0]; all += q.m[0] + q.f[0];
    }
    params.birth = birthSum / n;
    params.boyShare = boys / all;
    return params;
  }

  // 여러 군의 인구를 합쳐서 한 번에 맞춘다 (교차 검증용)
  function pool(list) {
    const out = {};
    for (const y of Object.keys(list[0])) {
      out[y] = { m: new Array(G).fill(0), f: new Array(G).fill(0) };
      for (const c of list) for (const s of ['m', 'f']) for (let g = 0; g < G; g++) out[y][s][g] += c[y][s][g];
    }
    return out;
  }

  // 1년 진행. adj는 정책·사건이 바꾸는 '연간 순이동률' 변화 (구간별, 예: +0.01 = 1% 더 남음)
  // 출생률 배수 birthMul도 받을 수 있다.
  function step(state, params, adj, birthMul) {
    const births = params.birth * (birthMul || 1) * sum(state.f, FERTILE);
    const fm = params.m.map((v, g) => v + ((adj && adj[g]) || 0));
    const ff = params.f.map((v, g) => v + ((adj && adj[g]) || 0));
    return {
      m: age(state.m, fm, births * params.boyShare),
      f: age(state.f, ff, births * (1 - params.boyShare)),
    };
  }

  function stats(state) {
    const total = sum(state.m) + sum(state.f);
    const youngF = sum(state.f, YOUNG_F);
    const old = sum(state.m, OLD) + sum(state.f, OLD);
    const young = sum(state.m, YOUNG_F) + youngF;   // 20~39세 남녀
    const kids = state.m[0] + state.m[1] + state.m[2] + state.f[0] + state.f[1] + state.f[2];
    return { total, index: youngF / old, young, old, kids, oldShare: old / total };
  }

  // ---- 정책 (여기부터는 검증된 부분이 아니라 '가정'이다) ----
  // 투자 포인트 p에 대한 효과는 점점 줄어든다: 1 - e^(-p/4)  (10포인트 ≈ 92%)
  // max: 포인트를 충분히 넣었을 때 해당 연령 구간의 연간 순이동률이 최대 얼마나 좋아지는가
  // 크기는 사례 조사(정책효과_사례조사.md)에 맞췄다. 2025년 청솔군에 10포인트를 넣었을 때 1년에
  //   일자리 약 15명 (경북 스마트팜 보육센터 5년간 90명 정착, 상주 혁신밸리 47명)
  //   교통·의료 약 8명 (삶의 질 효과는 확인되지만 인구이동 효과는 근거가 없음. 화천·정선 인구에서도 효과가 안 보임)
  //   교육 약 15명 (농촌유학으로 1년 약 45명이 머물지만(영월), 오래 남는 건 약 27%(양양 한남초 정주율))
  const POLICIES = {
    job:   { name: '일자리', tech: '스마트팜·원격근무 거점', groups: { 4: .0035, 5: .0035, 6: .0035, 7: .0035, 0: .0025, 1: .0025 } },
    bus:   { name: '교통', tech: '수요응답형 버스', groups: { 1: .00075, 2: .00075, 3: .00075, 7: .00075, 8: .00075, 9: .00075, 15: .0005, 16: .0005, 17: .0005 } },
    med:   { name: '의료', tech: '원격협진', groups: { 13: .00065, 14: .00065, 15: .00065, 16: .00065, 17: .00065 }, birth: .05 },
    edu:   { name: '교육', tech: '농촌유학·원격 공동수업', groups: { 1: .0067, 2: .0067, 7: .002, 8: .002, 3: .001 } },
  };
  const LEVELS = { low: .5, mid: 1, high: 1.6 };   // 비관·보통·낙관

  const eff = p => 1 - Math.exp(-p / 4);

  // alloc: 최근 3년 평균 투자 {job, bus, med, edu}. 기술이 자리 잡는 데 시간이 걸린다는 가정.
  function policyAdj(alloc, level) {
    const k = LEVELS[level] || 1;
    const adj = new Array(G).fill(0);
    let birthMul = 1;
    for (const id in POLICIES) {
      const e = eff(alloc[id] || 0) * k;
      for (const g in POLICIES[id].groups) adj[g] += POLICIES[id].groups[g] * e;
      if (POLICIES[id].birth) birthMul += POLICIES[id].birth * e;
    }
    return { adj, birthMul };
  }

  // 악순환 가정 (선택): 청년이 2025년보다 줄수록 상권·버스·병원이 줄어 이탈이 더 빨라진다
  function spiralAdj(adj, youngRatio) {
    const drop = Math.max(0, 1 - youngRatio);
    const extra = -0.02 * drop;          // 청년이 절반으로 줄면 연 1%p 추가 이탈
    for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17]) adj[g] += extra;
  }

  function gauss(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const NOISE = 0.02;   // 해마다 청년 이동의 랜덤 변동 (실측 잔차 3.3%에 모델 근사 오차가 섞여 있어 2%로 잡음)

  // ---- 이동 시나리오 ----
  // 'trend': 2020~2025년 주민등록 이동 추세가 그대로 이어진다 (기본, 과거 재현으로 검증)
  // 'official': 전북 시군 장래인구추계(2022~2042)처럼 들어오는 사람이 늘어난다.
  //   해마다 추가로 들어오는 인원(평균 군 하나 기준)을 2025년 252명에서 2042년 593명까지 늘리고, 그 뒤는 유지한다.
  //   이 크기는 2025→2042년 총인구 변화를 공식 추계(7개 군 −5.5%)에 맞춘 값이다 (모델 −5.4%).
  //   맞춘 결과 2042년 0~14세 7,611명(공식 8,222명), 65세 이상 54.3%(공식 57.0%). 공식 추계는 출생을 더 높게 본다.
  const OFFICIAL = { from: 252, to: 593, ramp: 17 };
  // 들어오는 사람의 나이: 50~60대 은퇴 귀촌이 가장 많고, 30~40대 가족이 그다음 (합 = 1)
  const MOVER_AGE = [.02, .02, .02, .01, .03, .05, .05, .05, .06, .07, .10, .12, .15, .13, .07, .03, .02, .00];
  function scenarioInflow(t) {
    return OFFICIAL.from + (OFFICIAL.to - OFFICIAL.from) * Math.min(t, OFFICIAL.ramp) / OFFICIAL.ramp;
  }
  function addMovers(state, n) {
    for (let g = 0; g < G; g++) { state.m[g] += n * MOVER_AGE[g] / 2; state.f[g] += n * MOVER_AGE[g] / 2; }
    return state;
  }

  // 한 해 진행 (게임과 실험이 함께 쓴다). hist: 지난 투자 기록 배열
  function yearStep(state, params, hist, opts, rng, start) {
    const recent = hist.slice(-3);
    const avg = {};
    for (const id in POLICIES) avg[id] = recent.reduce((s, a) => s + (a[id] || 0), 0) / Math.max(1, recent.length);
    let { adj, birthMul } = policyAdj(avg, opts.level);
    if (opts.spiral) spiralAdj(adj, stats(state).young / stats(start).young);
    // 게임 이벤트에서 고른 선택의 효과 (가정값)
    if (opts.extra) for (const g in opts.extra) adj[g] += opts.extra[g];
    if (opts.birthExtra) birthMul *= opts.birthExtra;
    const shock = rng ? NOISE * gauss(rng) : 0;
    for (const g of [4, 5, 6, 7]) adj[g] += shock;
    let next = step(state, params, adj, birthMul);
    if (opts.scenario === 'official') next = addMovers(next, scenarioInflow(hist.length - 1));
    return { state: next, shock };
  }

  // 같은 전략을 30년 동안 고정해서 돌린다 (전략 비교 실험용)
  function simulate(params, start, alloc, years, opts, rng) {
    let s = start;
    const hist = [];
    for (let i = 0; i < years; i++) { hist.push(alloc); s = yearStep(s, params, hist, opts, rng, start).state; }
    return stats(s);
  }

  // 해마다 다른 배분을 쓰는 계획(plan[i] = i년째 배분)으로 돌린다. rng가 없으면 랜덤 없이 평균 경로.
  function simulatePlan(params, start, plan, opts, rng) {
    let s = start;
    const hist = [];
    for (const a of plan) { hist.push(a); s = yearStep(s, params, hist, opts, rng, start).state; }
    return stats(s);
  }

  // 10포인트를 4개 분야에 나누는 모든 방법 (286가지)
  function allSplits(total) {
    const ids = Object.keys(POLICIES), out = [];
    (function rec(i, left, cur) {
      if (i === ids.length - 1) { out.push({ ...cur, [ids[i]]: left }); return; }
      for (let p = 0; p <= left; p++) rec(i + 1, left - p, { ...cur, [ids[i]]: p });
    })(0, total, {});
    return out;
  }

  // AI: 목표(goal: total | young | index)를 가장 크게 만드는 계획을 찾는다.
  // 1단계: 30년 내내 같은 배분 중 최고를 전부 비교해서 찾는다.
  // 2단계: 30년을 10년씩 3구간으로 나눠, 한 구간씩 바꿔 보며 더 좋아지면 채택한다 (2바퀴).
  function optimize(params, start, years, opts, goal) {
    const splits = allSplits(10);
    // goal은 지표 이름('total' 등)이거나, 결과 stats를 받아 점수를 돌려주는 함수
    const score = plan => { const s = simulatePlan(params, start, plan, opts); return typeof goal === 'function' ? goal(s) : s[goal]; };
    const BLOCKS = 3, len = Math.ceil(years / BLOCKS);
    const expand = blocks => Array.from({ length: years }, (_, i) => blocks[Math.min(BLOCKS - 1, Math.floor(i / len))]);
    let best = null, bestScore = -Infinity;
    for (const a of splits) {
      const sc = score(expand([a, a, a]));
      if (sc > bestScore) { bestScore = sc; best = a; }
    }
    const constant = { alloc: best, score: bestScore };
    let blocks = [best, best, best];
    for (let round = 0; round < 2; round++) {
      for (let b = 0; b < BLOCKS; b++) {
        for (const a of splits) {
          const trial = blocks.slice(); trial[b] = a;
          const sc = score(expand(trial));
          if (sc > bestScore + 1e-9) { bestScore = sc; blocks = trial; }
        }
      }
    }
    return { constant, blocks, plan: expand(blocks), score: bestScore, tried: splits.length * (1 + 2 * BLOCKS) };
  }

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const api = { G, fit, pool, step, stats, sum, FERTILE, YOUNG_F, OLD,
    POLICIES, LEVELS, eff, policyAdj, yearStep, simulate, simulatePlan, allSplits, optimize, mulberry, NOISE, OFFICIAL, scenarioInflow };
  if (typeof module !== 'undefined') module.exports = api; else root.PopModel = api;
})(this);
