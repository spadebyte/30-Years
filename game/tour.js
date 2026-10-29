// 처음 들어왔을 때 보여 주는 안내. 용어는 가운데 카드로, 화면 부분은 그 자리를 밝게 비추며 설명한다.
(function (root) {
  // 2026년 9월 행정안전부 주민등록 인구로 직접 계산한 소멸위험지수 (20~39세 여성 ÷ 65세 이상)
  const REGIONS = [
    ['경기 화성시 동탄구', 1.999, '전국 시·군·구 중 가장 높아요 (신도시)'],
    ['경기 화성시', 1.040],
    ['서울 관악구', 0.998],
    ['세종시', 0.908],
    ['서울시', 0.707],
    ['경기도', 0.641],
    ['전국 평균', 0.517, '', 'avg'],
    ['부산시', 0.411],
    ['전북', 0.333],
    ['경북', 0.283],
    ['부산 영도구', 0.212],
    ['전북 순창군', 0.159],
    ['청솔군 (게임 시작)', 0.139, '전북 소멸 고위험 7개 군의 평균이에요', 'me'],
    ['경북 영양군', 0.111],
    ['전남 고흥군', 0.091],
    ['경북 의성군', 0.077],
    ['대구 군위군', 0.071, '가장 낮아요. 2023년 대구시에 편입됐어요'],
  ];
  const BANDS = [
    [1.5, '매우 낮음', 'ok'], [1.0, '보통', 'ok'], [0.5, '주의', 'warn'], [0.2, '소멸위험', 'danger'], [0, '소멸 고위험', 'danger'],
  ];
  const band = v => BANDS.find(b => v >= b[0]);

  const indexBody = () => `
    <p>한 지역의 <b>20~39세 여성 인구</b>를 <b>65세 이상 인구</b>로 나눈 값이에요. 아이를 낳을 수 있는 세대가 노인 세대보다 얼마나 많은지를 보는 숫자라, 낮을수록 인구가 스스로 유지되기 어려워요.</p>
    <div class="t-formula"><span>20~39세 여성</span><i>÷</i><span>65세 이상</span><i>=</i><b>소멸위험지수</b></div>
    <div class="t-bands">${BANDS.map(([min, name, cls], i) => `<div class="t-band ${cls}"><b>${name}</b><span>${i === 0 ? '1.5 이상' : i === 4 ? '0.2 미만' : `${min} ~ ${BANDS[i - 1][0]}`}</span></div>`).join('')}</div>
    <h3>우리나라 지역은 어느 정도일까?</h3>
    <div class="t-regions">${REGIONS.map(([n, v, note, kind]) => `
      <div class="t-region ${kind || ''}">
        <span class="n">${n}${note ? `<small>${note}</small>` : ''}</span>
        <span class="t-bar"><i class="${band(v)[2]}" style="width:${Math.min(100, v / 2 * 100)}%"></i></span>
        <span class="v num">${v.toFixed(3)}</span>
      </div>`).join('')}</div>
    <p class="small muted">행정안전부 주민등록 인구통계(2026년 9월)로 전국 268개 시·군·구를 직접 계산했어요.</p>`;

  const STEPS = [
    { title: '군수의 30년에 오신 걸 환영해요', body: () => `
        <p>당신은 인구가 빠르게 줄고 있는 가상의 군 <b>청솔군</b>의 군수예요. 2025년부터 2055년까지 30년 동안 스마트 기술 예산을 나누고, 중요한 순간마다 결정을 내려요.</p>
        <p>청솔군의 숫자는 실제로 소멸 위험이 가장 큰 전북 7개 군(진안·무주·장수·임실·순창·고창·부안)의 주민등록 인구 평균이에요. 아무것도 하지 않으면 30년 뒤 인구가 절반으로 줄어요.</p>
        <p><b>목표:</b> 2055년에 <b>총인구</b>와 <b>소멸위험지수</b>를 최대한 지키는 것. 둘을 함께 점수로 매겨 등급을 줘요.</p>
        <p class="small muted">이 안내는 1~2분이면 끝나요. 언제든 위쪽의 '? 안내' 버튼으로 다시 볼 수 있어요.</p>` },
    { title: '소멸위험지수란?', wide: true, body: indexBody },
    { target: '.area-village', title: '마을과 상태판', body: () => `
        <p><b>마을 지도:</b> 불 켜진 집 하나가 주민 약 100명이에요. 인구가 줄면 바깥쪽 마을부터 불이 꺼져요.</p>
        <p><b>상태판:</b> 총인구, 소멸위험지수, 청년(20~39세), 어린이(0~14세), 65세 이상 비율이 해마다 바뀌어요. 아래 작은 글씨는 2025년과 비교한 변화예요.</p>` },
    { target: '.clock', title: '시간 조작과 가정', body: () => `
        <p><b>▶ 시작</b>을 누르면 시간이 흘러요. 1×에서 1년은 2.8초예요. <b>2×, 4×</b>로 빠르게, <b>1년 진행</b>으로 한 해씩 넘길 수 있어요.</p>
        <p><b>정책 효과 가정:</b> 스마트 기술의 효과를 비관(절반), 보통, 낙관(1.6배) 중에서 골라요. 효과 크기는 아직 통계로 확인되지 않은 가정값이라 직접 바꿔 볼 수 있게 했어요.</p>
        <p><b>악순환 효과:</b> 켜면 청년이 줄수록 버스·병원·상권이 줄어 사람들이 더 빨리 떠나요.</p>
        <p><b>이동 가정:</b> '지금 추세'는 최근 5년의 전입·전출이 그대로 이어진다고 보고(기본), '공식 추계'는 전북 공식 장래인구추계처럼 들어오는 사람이 늘어난다고 봐요. 2042년 인구가 각각 −27%, −5%로 크게 달라요.</p>` },
    { target: '.area-budget', title: '스마트 기술 예산 나누기', body: () => `
        <p>해마다 <b>10포인트</b>(1포인트 = 연 10억 원이라고 가정)를 일자리, 교통, 의료, 교육 네 분야에 나눠요. <b>+ / −</b> 버튼으로 바꿔요.</p>
        <p>시간이 흐르는 동안에는 버튼이 잠겨요. 위의 <b>⏸ 예산 조정</b>을 누르면 시간이 멈추고, 다 고친 뒤 <b>✓ 조정 완료</b>를 누르면 다시 흘러요.</p>
        <p>효과는 <b>최근 3년 평균 투자</b>만큼 서서히 나타나요. 옅은 칸은 아직 자리 잡는 중인 효과예요. 한 분야에 몰아 넣을수록 추가 효과는 줄어들어요.</p>
        <p class="small muted">일자리는 청년을, 교통은 학생·학부모·어르신을, 의료는 어르신과 출생을, 교육(농촌유학)은 아이와 부모를 지켜요. 효과 크기는 실제 사례에 맞췄어요. 10포인트에 1년 일자리·교육은 약 15명, 교통·의료는 약 8명이 오래 남아요. 교통·의료는 인구보다 주민의 삶을 편하게 하는 효과가 더 커요.</p>` },
    { target: '.area-chart', title: '인구 곡선', body: () => `
        <p>군의 인구가 어떻게 변하는지 보여 주는 그래프예요.</p>
        <p><b class="c-muted">회색 선</b>은 2010~2025년 실제 인구(7개 군 평균), <b class="c-base">보라 점선</b>은 아무 정책도 안 썼을 때의 예측, <b class="c-lamp">주황 선</b>이 지금 우리 군이에요. 주황 선이 보라 점선보다 위에 있으면 잘하고 있는 거예요.</p>
        <p>위쪽 탭으로 <b>총인구, 청년, 소멸위험지수</b> 그래프를 바꿔 볼 수 있어요.</p>` },
    { target: '.area-log', title: '군정 일지', body: () => `
        <p>해마다 군에서 일어난 일이 위에서부터 쌓여요.</p>
        <p><b class="c-ok">초록 글씨</b>는 좋은 일(새 시설 개소, 청년 전입 증가), <b class="c-danger">빨간 글씨</b>는 나쁜 일(인구 감소, 폐교), <b class="c-lamp">주황 글씨</b>는 내가 고른 선택이에요. 5년마다 정책이 없었을 때와 비교한 결산도 나와요.</p>` },
    { title: '선택 이벤트와 결과 화면', body: () => `
        <p>2027년부터 2049년까지 <b>8번</b> 게임이 멈추고 선택지가 나와요. 학교 통폐합, 데이터센터 유치, 분만 병원, 행정 통합 같은 실제 농촌의 고민이에요. 고른 선택은 예산과 인구에 영향을 줘요.</p>
        <p>2055년이 되면 <b>결과 화면</b>이 열려요. 등급과 함께, 선택 하나하나가 최고의 결정이었는지, 10년마다 예산을 잘 나눴는지, 운은 얼마나 작용했는지 보여 줘요.</p>
        <p class="small muted">점수는 정책 없음을 0점, AI가 모든 결정을 최선으로 내렸을 때를 100점으로 잡아요.</p>` },
    { target: '.panel.ai', title: 'AI 군수와 전략 실험실', body: () => `
        <p><b>AI 군수에게 맡기기:</b> 목표를 고르면 AI가 286가지 예산 배분을 모두 시험해 가장 좋은 계획을 찾아 직접 플레이해요.</p>
        <p>아래쪽 <b>전략 실험실</b>에서는 여러 전략을 300번씩 돌려 2055년 결과를 비교할 수 있어요.</p>` },
    { target: '.source-link', title: '출처와 원리', body: () => `
        <p>인구를 어떻게 예측하는지 애니메이션으로 보고, 과거 자료로 얼마나 정확한지(5년 예측 오차 2.8%), 무엇이 가정이고 어떤 자료를 썼는지 확인할 수 있어요.</p>
        <p>이제 시작해 볼까요? 청솔군의 불빛을 지켜 주세요.</p>` },
  ];

  function create({ onOpen }) {
    const el = document.createElement('div');
    el.className = 'tour'; el.hidden = true;
    el.innerHTML = `
      <div class="tour-shade"></div>
      <div class="tour-spot"></div>
      <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle">
        <span class="eyebrow" id="tourStep"></span>
        <h2 id="tourTitle"></h2>
        <div class="tour-body" id="tourBody"></div>
        <div class="tour-nav">
          <button class="tour-skip">건너뛰기</button>
          <span class="tour-dots"></span>
          <button class="tour-prev">◀ 이전</button>
          <button class="tour-next primary">다음 ▶</button>
        </div>
      </div>`;
    document.body.append(el);
    const $ = s => el.querySelector(s);
    const shade = $('.tour-shade'), spot = $('.tour-spot'), card = $('.tour-card');
    let at = 0, target = null;

    function place() {
      if (el.hidden) return;
      const narrow = innerWidth < 700;
      card.classList.toggle('wide', !!STEPS[at].wide);
      if (!target) {
        shade.hidden = false; spot.hidden = true;
        card.className = 'tour-card center' + (STEPS[at].wide ? ' wide' : '');
        card.style.left = card.style.top = '';
        return;
      }
      shade.hidden = true; spot.hidden = false;
      const r = target.getBoundingClientRect(), pad = 8;
      Object.assign(spot.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      if (narrow) { card.className = 'tour-card dock'; card.style.left = card.style.top = ''; return; }
      card.className = 'tour-card float';
      const cw = card.offsetWidth, ch = card.offsetHeight, gap = 16;
      let left, top;
      if (innerWidth - r.right > cw + gap * 2) { left = r.right + gap; top = r.top; }          // 오른쪽
      else if (r.left > cw + gap * 2) { left = r.left - cw - gap; top = r.top; }              // 왼쪽
      else if (innerHeight - r.bottom > ch + gap * 2) { left = r.left; top = r.bottom + gap; } // 아래
      else { left = r.left; top = r.top - ch - gap; }                                         // 위
      left = Math.max(12, Math.min(innerWidth - cw - 12, left));
      top = Math.max(12, Math.min(innerHeight - ch - 12, top));
      card.style.left = left + 'px'; card.style.top = top + 'px';
    }

    function show(i) {
      at = Math.max(0, Math.min(STEPS.length - 1, i));
      const s = STEPS[at];
      $('#tourStep').textContent = `${at + 1} / ${STEPS.length}`;
      $('#tourTitle').textContent = s.title;
      $('#tourBody').innerHTML = s.body();
      $('#tourBody').scrollTop = 0;
      $('.tour-prev').hidden = at === 0;
      $('.tour-next').textContent = at === STEPS.length - 1 ? '시작하기' : at === 0 ? '안내 시작 ▶' : '다음 ▶';
      $('.tour-dots').innerHTML = STEPS.map((_, j) => `<i class="${j === at ? 'on' : ''}"></i>`).join('');
      target = s.target ? document.querySelector(s.target) : null;
      if (target) {
        const r = target.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) target.scrollIntoView({ block: r.height > innerHeight * 0.7 ? 'start' : 'center', behavior: 'instant' });
      }
      place();
      requestAnimationFrame(place);
    }

    function open() { onOpen && onOpen(); el.hidden = false; show(0); $('.tour-next').focus(); }
    function close() {
      el.hidden = true;
      try { localStorage.setItem('tour-seen', '1'); } catch (e) { /* 저장이 막혀 있으면 다음에 또 보여 준다 */ }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    $('.tour-next').onclick = () => (at === STEPS.length - 1 ? close() : show(at + 1));
    $('.tour-prev').onclick = () => show(at - 1);
    $('.tour-skip').onclick = close;
    addEventListener('resize', place);
    addEventListener('scroll', place, { passive: true });
    addEventListener('keydown', e => {
      if (el.hidden) return;
      if (e.key === 'ArrowRight') $('.tour-next').click();
      else if (e.key === 'ArrowLeft' && at > 0) show(at - 1);
      else if (e.key === 'Escape') close();
    });

    let seen = false;
    try { seen = localStorage.getItem('tour-seen') === '1'; } catch (e) { seen = false; }
    return { open, close, seen };
  }

  root.Tour = { create };
})(this);
