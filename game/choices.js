// 선택 이벤트: 정해진 해에 게임이 멈추고 군수가 둘 중 하나를 고른다.
// 효과 크기는 사례를 참고한 가정값이다 (검증·전략 실험실에는 들어가지 않는다).
// mods: { years, adj: {연령구간: 연간 순이동률 변화}, birth: 출생 배수, budget: 예산 변화 }
// add: 즉시 전입 { groups: [...], n: 명 }
(function (root) {
  const YOUNG = [4, 5, 6, 7], KIDS = [1, 2], OLD = [13, 14, 15, 16, 17];
  const each = (groups, v) => Object.fromEntries(groups.map(g => [g, v]));

  // 크기는 사례 조사(정책효과_사례조사.md)에 맞췄다. 괄호 안은 2025년 청솔군 기준 1년 인원.
  const ALL = [...Array(18).keys()];
  const CHOICES = [
    {
      year: 2027, title: '작은 학교의 통폐합',
      text: '면 지역 초등학교 전교생이 12명이 됐어요. 교육청이 읍내 학교와 합치자고 제안했어요.',
      basis: '한국교육개발원 분석: 면 단위 초등학교가 폐교하면 3년 뒤 인구가 약 410명 줄었어요. 농촌유학으로 충남 서천은 22가구 52명, 강원 영월은 학생과 가족 315명이 들어왔지만, 강원 양양 한남초는 참여 학생 29명 중 8명(27%)만 정착했어요.',
      options: [
        { label: '작은 학교 살리기', desc: '도시 아이들이 가족과 함께 와서 다니는 농촌유학을 시작해요. 5년간 예산 -1. 1년에 약 50명이 머물지만 오래 남는 건 4분의 1쯤이라, 10년간 1년에 약 15명이 늘어요.',
          mods: [{ years: 5, budget: -1 }, { years: 10, adj: { ...each(KIDS, .0067), 7: .0027, 8: .0027 } }] },
        { label: '통폐합하고 통학버스', desc: '운영비를 아껴 5년간 예산 +1. 대신 3년 동안 아이 있는 가족이 1년에 약 130명씩 떠나요.',
          mods: [{ years: 5, budget: 1 }, { years: 3, adj: { 0: -.03, ...each(KIDS, -.04), 3: -.01, 7: -.02, 8: -.02 } }] },
      ],
    },
    {
      year: 2029, title: '데이터센터 유치 제안',
      text: '전기가 싸고 땅이 넓다며 한 기업이 데이터센터를 짓겠대요. 상시 일자리는 50~100개 정도인데, 산을 깎아야 해요.',
      basis: '100MW급 데이터센터의 상시 현장 인력은 50~100명 수준으로 추정돼요(전남 장성 사례). 건설 고용은 한시적이에요.',
      options: [
        { label: '유치한다', desc: '바로 25~39세 75명이 이사 와요. 대신 10년간 자연을 보고 오던 귀농·귀촌(50~69세)이 1년에 약 10명 줄어요.',
          add: { groups: [5, 6, 7], n: 75 }, mods: [{ years: 10, adj: each([11, 12, 13], -.001) }] },
        { label: '거절하고 생태관광', desc: '산과 계곡을 지켜 10년간 귀농·귀촌과 관광 창업이 1년에 약 10명 늘어요.',
          mods: [{ years: 10, adj: { ...each([10, 11, 12], .001), 4: .001, 5: .001 } }] },
      ],
    },
    {
      year: 2031, title: '마지막 분만 병원',
      text: '군에 하나 남은 분만 병원이 적자로 문을 닫겠대요. 닫으면 아기를 낳으러 1시간을 가야 해요.',
      basis: '분만 의료기관은 2003년 1,371곳에서 2023년 463곳으로 줄었어요. 분만실이 사라지면 출산을 원하는 주민이 떠나거나 출산을 미룬다는 연구가 있지만, 효과 크기는 가정값이에요.',
      options: [
        { label: '공공 분만실 지원', desc: '10년간 예산 -2. 아기를 군에서 낳을 수 있어 10년간 출생이 12% 늘어요.',
          mods: [{ years: 10, budget: -2, birth: 1.12 }] },
        { label: '이웃 시 병원과 원격 산전관리', desc: '예산은 그대로. 대신 10년간 출생이 8% 줄어요.',
          mods: [{ years: 10, birth: 0.92 }] },
      ],
    },
    {
      year: 2034, title: '청년이냐, 어르신이냐',
      text: '추가 예산이 생겼는데 의회 의견이 둘로 갈렸어요.',
      basis: '청년 정착지원금이 장기 정착을 늘렸다는 실증 근거는 아직 없어요. 국회예산정책처도 사업이 끝난 뒤 실제로 남았는지 알 수 없다고 지적했어요. 어르신 돌봄 효과도 잰 자료가 없어 가정값이에요.',
      options: [
        { label: '청년 정착금', desc: '이사 오는 청년에게 1천만 원씩. 5년간 예산 -2, 5년간 20~34세가 1년에 약 15명 더 머물러요.',
          mods: [{ years: 5, budget: -2, adj: each([4, 5, 6], .005) }] },
        { label: '어르신 돌봄 확대', desc: '경로당 냉난방과 방문 돌봄을 늘려요. 5년간 예산 -2, 10년간 어르신이 1년에 약 10명 덜 떠나요. 사는 동안의 편안함은 크게 좋아져요.',
          mods: [{ years: 5, budget: -2 }, { years: 10, adj: each(OLD, .0008) }] },
      ],
    },
    {
      year: 2037, title: '이웃 시와 행정 통합',
      text: '이웃 시가 하나로 합치자고 제안했어요. 2023년 경북 군위군이 대구시에 편입된 것처럼요.',
      basis: '군위군(주민등록 인구)은 통합 전 3년 동안 청년이 19%, 통합 후 3년 동안 22% 줄었어요. 큰 도시에 들어가도 청년 유출은 멈추지 않았고, 어르신의 5년 잔존율도 통합 전 0.820, 통합 후 0.818로 그대로였어요.',
      options: [
        { label: '통합한다', desc: '시 예산을 함께 써서 남은 기간 예산 +3. 청년 유출도, 어르신이 남는 비율도 그대로예요(군위군 사례).',
          mods: [{ years: 99, budget: 3 }], flag: 'merged' },
        { label: '군으로 남는다', desc: '이름과 자치권을 지켜요. 효과는 없어요.', mods: [] },
      ],
    },
    {
      year: 2041, title: '빈집 1,500채',
      text: '마을마다 빈집이 늘어 1,500채를 넘었어요.',
      basis: '경북 의성 이웃사촌마을은 2019~2025년 청년 97명이 정착했어요(1년 약 16명). 전남 신안군은 태양광·풍력 수익을 주민에게 나누는 햇빛·바람연금 뒤 2023년부터 인구가 늘었어요. 2025년에는 아이부터 어르신까지 모든 나이가 고르게 늘어 가족 단위 전입으로 보이지만, 실제로 사는지는 확인할 수 없어요.',
      options: [
        { label: '청년 임대주택으로 고치기', desc: '5년간 예산 -2. 바로 25~34세 20명이 들어오고, 10년간 청년이 1년에 약 10명 더 머물러요.',
          add: { groups: [5, 6], n: 20 }, mods: [{ years: 5, budget: -2 }, { years: 10, adj: each(YOUNG, .0026) }] },
        { label: '철거하고 태양광 단지', desc: '주민에게 전기 판매 수익을 나눠요. 남은 기간 예산 +2, 주민이 1년에 약 40명 덜 떠나요(신안군 사례, 효과는 불확실).',
          mods: [{ years: 99, budget: 2, adj: each(ALL, .0013) }] },
      ],
    },
    {
      year: 2045, title: '기록적인 폭우',
      text: '하룻밤에 400mm가 내려 마을 길과 논둑이 무너졌어요.',
      basis: '해외 연구에서 큰 홍수 뒤 영구 이주한 가구는 매우 적었고, 소득이 줄어드는 정도가 이주를 좌우했어요. 국내 연구는 찾지 못했어요.',
      options: [
        { label: '전부 복구', desc: '2년간 예산 -5. 대신 떠나는 사람은 늘지 않아요.',
          mods: [{ years: 2, budget: -5 }] },
        { label: '급한 곳만 복구', desc: '예산은 지키지만 2년간 주민이 1년에 약 50명 더 떠나요.',
          mods: [{ years: 2, adj: each(ALL, -.0016) }] },
      ],
    },
    {
      year: 2049, title: '자율주행 버스 시범지역',
      text: '정부가 농촌 자율주행 버스 시범지역을 공모해요.',
      basis: '경남 하동군 자율주행 버스는 2025년 9,822명이 이용했고 만족도가 90%를 넘었어요. 다만 인구 이동에 준 효과를 잰 자료는 없고, 1년 운영비 3억 원의 절반이 국비예요. 아이 호출버스를 도입한 화천도 아이 수 감소가 멈추지 않았어요.',
      options: [
        { label: '신청한다', desc: '3년간 예산 -2. 이동은 훨씬 편해지지만, 떠나는 사람은 1년에 약 5명 줄어드는 정도예요.',
          mods: [{ years: 3, budget: -2 }, { years: 99, adj: { ...each([15, 16, 17, 7, 8, 9], .0004), 3: .0004, 4: .0004 } }] },
        { label: '포기한다', desc: '효과는 없어요.', mods: [] },
      ],
    },
  ];

  // 지금 해에 켜져 있는 효과를 합친다
  function active(mods, year) {
    const extra = {};
    let birth = 1, budget = 0;
    for (const m of mods) {
      if (year < m.from || year >= m.from + m.years) continue;
      if (m.adj) for (const g in m.adj) extra[g] = (extra[g] || 0) + m.adj[g];
      if (m.birth) birth *= m.birth;
      if (m.budget) budget += m.budget;
    }
    return { extra, birth, budget: Math.max(3, Math.min(15, 10 + budget)) };
  }

  // 선택을 적용한다 (ctx: { state, mods, year, flags })
  function apply(ctx, opt) {
    for (const m of opt.mods || []) ctx.mods.push({ ...m, from: ctx.year });
    if (opt.add) {
      const per = opt.add.n / opt.add.groups.length / 2;
      for (const g of opt.add.groups) { ctx.state.m[g] += per; ctx.state.f[g] += per; }
    }
    if (opt.flag) ctx.flags[opt.flag] = true;
  }

  // 예산이 줄면 가장 많이 넣은 분야부터 1씩 뺀다
  function trim(alloc, budget) {
    const a = { ...alloc };
    let total = Object.values(a).reduce((s, v) => s + v, 0);
    while (total > budget) {
      const k = Object.keys(a).reduce((x, y) => (a[y] > a[x] ? y : x));
      a[k]--; total--;
    }
    return a;
  }

  root.Choices = { CHOICES, active, apply, trim };
})(this);
