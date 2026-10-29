// 선택 이벤트 삽화 (코드로 그린 SVG). 색은 페이지의 CSS 변수를 그대로 쓴다.
// 모든 그림은 같은 틀: 640×300, 밤하늘 · 능선 · 땅 위에 장면 하나.
(function (root) {
  const W = 640, H = 300;

  // 공통 배경: 밤하늘, 별, 달, 두 겹 능선, 땅 (storm이면 별과 달 대신 먹구름)
  function backdrop(seed, storm, noMoon) {
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const stars = Array.from({ length: 26 }, () =>
      `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 110).toFixed(0)}" r="${(0.6 + r() * 1.1).toFixed(1)}" fill="#f3ead6" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`).join('');
    return `
      <defs>
        <linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--night)"/>
          <stop offset="1" stop-color="color-mix(in srgb, var(--night) 75%, var(--field))"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky${seed})"/>
      ${storm ? '' : stars}
      ${storm || noMoon ? '' : '<path d="M566 34 A18 18 0 1 0 566 70 A22 22 0 0 1 566 34 Z" fill="#f3ead6" opacity=".9"/>'}
      <path d="M0 170 L70 120 L130 150 L210 95 L290 145 L360 110 L450 150 L530 100 L640 140 L640 300 L0 300 Z" fill="color-mix(in srgb, var(--night) 82%, #ffffff)" opacity=".55"/>
      <path d="M0 200 L90 160 L170 185 L260 150 L350 180 L430 155 L520 185 L640 165 L640 300 L0 300 Z" fill="color-mix(in srgb, var(--night) 70%, var(--field))"/>
      <rect y="232" width="${W}" height="${H - 232}" fill="color-mix(in srgb, var(--night) 55%, var(--field))"/>`;
  }

  const lamp = 'var(--lamp)';
  const wall = 'color-mix(in srgb, var(--night) 45%, #e8e2d4)';
  const dim = 'color-mix(in srgb, var(--night) 70%, #8a9a90)';

  // 사람 실루엣 (키 h, 색 c)
  const person = (x, y, h, c) => `
    <g transform="translate(${x} ${y})">
      <circle cx="0" cy="${-h + h * 0.16}" r="${h * 0.16}" fill="${c}"/>
      <path d="M${-h * 0.16} ${-h * 0.62} Q0 ${-h * 0.75} ${h * 0.16} ${-h * 0.62} L${h * 0.14} ${-h * 0.18} L${-h * 0.14} ${-h * 0.18} Z" fill="${c}"/>
      <rect x="${-h * 0.12}" y="${-h * 0.2}" width="${h * 0.09}" height="${h * 0.2}" fill="${c}"/>
      <rect x="${h * 0.03}" y="${-h * 0.2}" width="${h * 0.09}" height="${h * 0.2}" fill="${c}"/>
    </g>`;

  const tree = (x, y, h) => `
    <g transform="translate(${x} ${y})">
      <rect x="-2" y="${-h * 0.3}" width="4" height="${h * 0.3}" fill="color-mix(in srgb, var(--night) 60%, #6b5640)"/>
      <path d="M0 ${-h} L${h * 0.32} ${-h * 0.3} L${-h * 0.32} ${-h * 0.3} Z" fill="color-mix(in srgb, var(--night) 45%, var(--field))"/>
    </g>`;

  // 창문 격자: lit 배열에 있는 칸만 불이 켜진다
  function windows(x0, y0, cols, rows, w, h, gap, lit) {
    let out = '';
    for (let rIdx = 0; rIdx < rows; rIdx++) for (let c = 0; c < cols; c++) {
      const on = lit.includes(rIdx * cols + c);
      const x = x0 + c * (w + gap), y = y0 + rIdx * (h + gap);
      if (on) out += `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="4" fill="${lamp}" opacity=".18"/>`;
      out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${on ? lamp : dim}"/>`;
    }
    return out;
  }

  // 박공지붕 집 (lit: 창 불빛)
  const house = (x, y, w, lit, roof) => {
    const h = w * 0.62;
    return `<g transform="translate(${x} ${y})">
      <path d="M${-w * 0.08} ${-h} L${w / 2} ${-h - w * 0.42} L${w * 1.08} ${-h} Z" fill="${roof || 'color-mix(in srgb, var(--night) 55%, #7a4b3a)'}"/>
      <rect x="0" y="${-h}" width="${w}" height="${h}" fill="${wall}"/>
      ${lit ? `<rect x="${w * 0.2 - 4}" y="${-h * 0.72 - 4}" width="${w * 0.26 + 8}" height="${h * 0.32 + 8}" rx="3" fill="${lamp}" opacity=".2"/>` : ''}
      <rect x="${w * 0.2}" y="${-h * 0.72}" width="${w * 0.26}" height="${h * 0.32}" fill="${lit ? lamp : dim}"/>
      <rect x="${w * 0.6}" y="${-h * 0.62}" width="${w * 0.22}" height="${h * 0.62}" fill="color-mix(in srgb, var(--night) 40%, #6b5640)"/>
    </g>`;
  };
  const text = (x, y, t, size, weight, color) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight || 400}" font-family="IBM Plex Sans KR, sans-serif" fill="${color || 'var(--night)'}">${t}</text>`;
  const sign = (x, y, w, lines) => `
    <rect x="${x - w / 2}" y="${y}" width="${w}" height="${12 + lines.length * 12}" rx="3" fill="color-mix(in srgb, var(--night) 25%, #f3ead6)"/>
    <rect x="${x - 1.5}" y="${y + 12 + lines.length * 12}" width="3" height="20" fill="${dim}"/>
    ${lines.map((l, i) => text(x, y + 15 + i * 12, l, 10, i === lines.length - 1 ? 700 : 400)).join('')}`;
  const elder = (x, y, h, c) => `${person(x, y, h, c)}<path d="M${x + h * 0.22} ${y - h * 0.5} L${x + h * 0.3} ${y}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  const grey = 'color-mix(in srgb, var(--night) 40%, #9aa3a6)';
  const water = 'color-mix(in srgb, var(--night) 45%, #4f7ea8)';

  const ART = {
    // 2027 작은 학교의 통폐합: 산자락 2층 학교, 창문 몇 개만 불이 켜져 있고 운동장에 아이 셋
    2027: () => `
      ${backdrop(27)}
      ${tree(60, 240, 46)}${tree(92, 236, 34)}${tree(585, 240, 50)}${tree(612, 238, 36)}
      <!-- 학교 건물 -->
      <rect x="170" y="128" width="250" height="104" fill="${wall}"/>
      <rect x="170" y="122" width="250" height="8" fill="color-mix(in srgb, var(--night) 35%, #b8ae9a)"/>
      <rect x="270" y="98" width="50" height="30" fill="${wall}"/>
      <circle cx="295" cy="112" r="9" fill="color-mix(in srgb, var(--night) 20%, #f3ead6)"/>
      <path d="M295 112 L295 106 M295 112 L300 114" stroke="var(--night)" stroke-width="1.6" stroke-linecap="round"/>
      ${windows(184, 140, 7, 2, 22, 20, 10, [1, 9, 10])}
      <rect x="282" y="198" width="26" height="34" fill="color-mix(in srgb, var(--night) 40%, #6b5640)"/>
      <rect x="286" y="202" width="8" height="26" fill="${lamp}" opacity=".85"/>
      <!-- 국기 게양대 -->
      <rect x="440" y="140" width="2.5" height="92" fill="${dim}"/>
      <path d="M442.5 142 L466 149 L442.5 156 Z" fill="${lamp}" opacity=".7"/>
      <!-- 운동장 -->
      <ellipse cx="330" cy="262" rx="250" ry="22" fill="color-mix(in srgb, var(--night) 40%, #b39a6e)" opacity=".55"/>
      <path d="M150 262 Q330 230 510 262" fill="none" stroke="#f3ead6" stroke-width="1.2" stroke-dasharray="4 6" opacity=".4"/>
      ${person(245, 272, 28, '#f3ead6')}${person(272, 270, 24, '#f3ead6')}${person(398, 274, 27, '#f3ead6')}
      <circle cx="322" cy="268" r="5" fill="${lamp}"/>
      <!-- 표지판 -->
      <rect x="470" y="208" width="104" height="30" rx="3" fill="color-mix(in srgb, var(--night) 25%, #f3ead6)"/>
      <rect x="520" y="238" width="3" height="22" fill="${dim}"/>
      <text x="522" y="221" text-anchor="middle" font-size="10" font-family="IBM Plex Sans KR, sans-serif" fill="var(--night)">청솔초등학교</text>
      <text x="522" y="233" text-anchor="middle" font-size="10" font-family="IBM Plex Sans KR, sans-serif" fill="var(--night)" font-weight="700">전교생 12명</text>`,

    // 2029 데이터센터: 왼쪽은 계곡이 흐르는 숲, 오른쪽은 깎인 산 위의 데이터센터와 송전탑
    2029: () => `
      ${backdrop(29)}
      <path d="M0 232 L0 175 L60 150 L120 170 L190 140 L260 180 L300 232 Z" fill="color-mix(in srgb, var(--night) 40%, var(--field))"/>
      ${tree(30, 232, 40)}${tree(70, 226, 52)}${tree(115, 230, 44)}${tree(160, 228, 56)}${tree(205, 232, 42)}${tree(245, 232, 36)}
      <path d="M150 300 C170 270 120 258 150 240 C170 228 200 236 215 232" fill="none" stroke="${water}" stroke-width="10" stroke-linecap="round"/>
      <path d="M150 300 C170 270 120 258 150 240" fill="none" stroke="#f3ead6" stroke-width="1.2" opacity=".35" stroke-dasharray="3 7"/>
      <!-- 깎인 산 -->
      <path d="M330 232 L360 182 L620 182 L640 200 L640 232 Z" fill="color-mix(in srgb, var(--night) 55%, #8a7a62)"/>
      <path d="M345 207 L630 207" stroke="color-mix(in srgb, var(--night) 40%, #a8977a)" stroke-width="2"/>
      <!-- 데이터센터 -->
      <rect x="390" y="128" width="200" height="56" fill="${grey}"/>
      <rect x="390" y="122" width="200" height="8" fill="color-mix(in srgb, var(--night) 30%, #b9c0c2)"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${402 + i * 20}" y="140" width="12" height="34" fill="color-mix(in srgb, var(--night) 75%, #3d4a52)"/>
        <circle cx="${405 + i * 20}" cy="${147 + (i % 3) * 8}" r="1.6" fill="${i % 2 ? '#7fd0ff' : 'var(--field)'}"/>
        <circle cx="${410 + i * 20}" cy="${160 - (i % 2) * 6}" r="1.6" fill="#7fd0ff" opacity=".8"/>`).join('')}
      <rect x="420" y="108" width="24" height="16" fill="${grey}"/><rect x="536" y="108" width="24" height="16" fill="${grey}"/>
      <!-- 송전탑 -->
      <path d="M318 232 L330 120 L342 232 M322 190 L338 190 M325 160 L335 160 M316 128 L344 128" fill="none" stroke="${dim}" stroke-width="2"/>
      <path d="M344 128 Q370 140 392 132" fill="none" stroke="${dim}" stroke-width="1"/>
      ${sign(500, 196, 104, ['일자리 50~100개', '데이터센터 예정지'])}`,

    // 2031 마지막 분만 병원: 불이 꺼져 가는 병원, 멀리 1시간 떨어진 도시 불빛까지 이어진 길
    2031: () => `
      ${backdrop(31)}
      ${Array.from({ length: 14 }, (_, i) => `<circle cx="${556 + (i * 37) % 70}" cy="${178 + (i * 13) % 10}" r="1.6" fill="${lamp}" opacity=".8"/>`).join('')}
      <path d="M180 300 C260 260 380 250 470 215 C520 196 560 190 600 186" fill="none" stroke="color-mix(in srgb, var(--night) 35%, #4a4a44)" stroke-width="16" stroke-linecap="round"/>
      <path d="M180 300 C260 260 380 250 470 215 C520 196 560 190 600 186" fill="none" stroke="${lamp}" stroke-width="1.4" stroke-dasharray="8 10" opacity=".5"/>
      <rect x="60" y="112" width="170" height="120" fill="${wall}"/>
      <rect x="60" y="106" width="170" height="8" fill="color-mix(in srgb, var(--night) 35%, #b8ae9a)"/>
      ${windows(74, 124, 5, 3, 20, 18, 12, [7])}
      <rect x="128" y="200" width="34" height="32" fill="color-mix(in srgb, var(--night) 40%, #6b5640)"/>
      <rect x="125" y="72" width="40" height="40" rx="6" fill="#f3ead6"/>
      <rect x="140" y="78" width="10" height="28" fill="var(--danger)"/><rect x="131" y="87" width="28" height="10" fill="var(--danger)"/>
      ${sign(290, 192, 104, ['군내 마지막 분만실', '폐업 예정'])}
      <g transform="translate(470 218)">
        <rect x="-16" y="-10" width="32" height="12" rx="3" fill="#f3ead6"/>
        <circle cx="-9" cy="3" r="3" fill="var(--night)"/><circle cx="9" cy="3" r="3" fill="var(--night)"/>
        <path d="M16 -6 L44 -14 L44 2 Z" fill="${lamp}" opacity=".35"/>
      </g>
      ${text(590, 170, '이웃 도시 · 1시간', 10, 700, '#f3ead6')}`,

    // 2034 청년이냐, 어르신이냐: 갈림길 표지판, 왼쪽은 이삿짐 트럭과 청년, 오른쪽은 경로당과 어르신
    2034: () => `
      ${backdrop(34)}
      <path d="M320 300 L320 258 Q320 246 300 244 L170 238 M320 258 Q320 246 340 244 L480 238" fill="none" stroke="color-mix(in srgb, var(--night) 35%, #4a4a44)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M320 300 L320 262 M308 244 L180 238 M332 244 L470 238" fill="none" stroke="${lamp}" stroke-width="1.4" stroke-dasharray="8 9" opacity=".5"/>
      <rect x="318" y="182" width="4" height="70" fill="${dim}"/>
      <path d="M318 188 L262 188 L252 198 L262 208 L318 208 Z" fill="#f3ead6"/>${text(287, 202, '청년 정착', 10, 700)}
      <path d="M322 214 L378 214 L388 224 L378 234 L322 234 Z" fill="#f3ead6"/>${text(353, 228, '어르신 돌봄', 10, 700)}
      <!-- 왼쪽: 이삿짐 트럭 -->
      <g transform="translate(70 232)">
        <rect x="0" y="-46" width="70" height="40" fill="#f3ead6"/>
        <rect x="70" y="-32" width="26" height="26" rx="3" fill="${lamp}"/>
        <rect x="76" y="-28" width="12" height="10" fill="var(--night)" opacity=".7"/>
        <circle cx="18" cy="-4" r="7" fill="var(--night)"/><circle cx="80" cy="-4" r="7" fill="var(--night)"/>
        ${text(35, -22, '이사', 12, 700)}
      </g>
      ${person(190, 232, 34, '#f3ead6')}
      <rect x="200" y="206" width="16" height="12" fill="color-mix(in srgb, var(--night) 30%, #c9a46a)"/>
      <!-- 오른쪽: 경로당 -->
      <path d="M470 168 L540 140 L610 168 Z" fill="color-mix(in srgb, var(--night) 55%, #3e5a6b)"/>
      <rect x="482" y="168" width="116" height="64" fill="${wall}"/>
      ${windows(494, 180, 3, 1, 22, 18, 12, [0, 1, 2])}
      ${text(540, 222, '경로당', 11, 700)}
      ${elder(458, 232, 32, '#f3ead6')}${elder(620, 234, 30, '#f3ead6')}`,

    // 2037 행정 통합: 왼쪽 작은 군 마을과 오른쪽 큰 도시 사이 강 위의 다리
    2037: () => `
      ${backdrop(37, false, true)}
      <path d="M86 34 A18 18 0 1 0 86 70 A22 22 0 0 1 86 34 Z" fill="#f3ead6" opacity=".9"/>
      ${[[420, 120, 34, 112], [458, 90, 30, 142], [492, 136, 40, 96], [536, 76, 34, 156], [574, 110, 32, 122], [610, 140, 30, 92]].map(([x, y, w, h]) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="color-mix(in srgb, var(--night) 55%, #6a7a86)"/>` +
        Array.from({ length: Math.floor(h / 14) * 2 }, (_, i) => `<rect x="${x + 6 + (i % 2) * (w / 2 - 2)}" y="${y + 8 + Math.floor(i / 2) * 14}" width="${w / 2 - 10}" height="6" fill="${(i * 7) % 5 ? lamp : dim}" opacity=".9"/>`).join('')).join('')}
      <rect y="236" width="${W}" height="64" fill="${water}"/>
      <path d="M0 250 Q160 244 320 250 T640 250" fill="none" stroke="#f3ead6" stroke-width="1" opacity=".3"/>
      <path d="M60 230 Q330 140 600 230" fill="none" stroke="#f3ead6" stroke-width="3"/>
      <rect x="40" y="230" width="580" height="8" fill="#f3ead6"/>
      ${Array.from({ length: 11 }, (_, i) => { const t = (i + 1) / 12; const x = 60 + 540 * t; const y = 230 - 2 * 90 * t * (1 - t); return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} 230" stroke="#f3ead6" stroke-width="1.5"/>`; }).join('')}
      ${house(40, 230, 34, true)}${house(84, 228, 28, false)}${house(122, 230, 30, true)}
      ${text(90, 160, '청솔군', 13, 700, '#f3ead6')}${text(520, 66, '이웃 시', 13, 700, '#f3ead6')}`,

    // 2041 빈집 1,500채: 불 꺼진 지붕들 사이 단 한 채만 불이 켜져 있다
    2041: () => `
      ${backdrop(41)}
      ${[[30, 236, 44], [92, 230, 38], [148, 238, 46], [214, 230, 40], [330, 236, 44], [392, 230, 38], [450, 238, 46], [520, 232, 40], [580, 236, 42]].map(([x, y, w]) => house(x, y, w, false)).join('')}
      ${house(266, 240, 52, true, 'color-mix(in srgb, var(--night) 40%, #9a5a3a)')}
      ${[[22, 262], [140, 270], [380, 266], [540, 272], [600, 262]].map(([x, y]) => `<path d="M${x} ${y} l4 -14 l4 14 m2 0 l5 -18 l3 18 m2 0 l4 -11 l3 11" fill="none" stroke="color-mix(in srgb, var(--night) 40%, var(--field))" stroke-width="2"/>`).join('')}
      <path d="M100 210 L120 196 M118 210 L104 196" stroke="var(--danger)" stroke-width="2" opacity=".6"/>
      <path d="M470 214 L490 200 M488 214 L474 200" stroke="var(--danger)" stroke-width="2" opacity=".6"/>
      ${sign(292, 112, 92, ['빈집', '1,500채'])}`,

    // 2045 기록적인 폭우: 먹구름과 빗줄기, 불어난 냇물, 무너진 논둑
    2045: () => `
      ${backdrop(45, true)}
      ${[[90, 52, 90], [230, 40, 120], [400, 56, 110], [560, 44, 100]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.36}" fill="color-mix(in srgb, var(--night) 70%, #5a646a)"/>`).join('')}
      <path d="M0 232 L640 232 L640 300 L0 300 Z" fill="color-mix(in srgb, var(--night) 55%, var(--field))"/>
      <path d="M0 262 C120 246 220 276 330 256 C430 238 520 270 640 252 L640 300 L0 300 Z" fill="${water}"/>
      <path d="M40 270 C140 256 240 282 330 266" fill="none" stroke="#f3ead6" stroke-width="1" opacity=".35"/>
      <!-- 무너진 논둑 -->
      <path d="M200 232 L250 232 L262 244 L272 236 L286 250 L300 240 L320 232 L380 232 L380 238 L200 238 Z" fill="color-mix(in srgb, var(--night) 45%, #8a6a4a)"/>
      <path d="M262 244 L286 268 L300 240" fill="${water}" opacity=".9"/>
      ${house(470, 236, 48, true)}
      ${tree(80, 236, 42)}${tree(600, 236, 40)}
      ${Array.from({ length: 70 }, (_, i) => { const x = (i * 53) % W, y = 70 + (i * 31) % 190; return `<path d="M${x} ${y} l-6 16" stroke="#cfe3f2" stroke-width="1.3" opacity=".55"/>`; }).join('')}
      ${sign(150, 180, 92, ['하룻밤 강수량', '400mm'])}`,

    // 2049 자율주행 버스: 시골길 정류장에서 기다리는 어르신과 학생, 센서 빛을 내며 오는 작은 버스
    2049: () => `
      ${backdrop(49)}
      <path d="M0 250 L640 238 L640 268 L0 282 Z" fill="color-mix(in srgb, var(--night) 35%, #4a4a44)"/>
      <path d="M0 266 L640 253" stroke="${lamp}" stroke-width="1.4" stroke-dasharray="12 12" opacity=".5"/>
      ${tree(40, 238, 44)}${tree(600, 230, 46)}${tree(560, 232, 34)}
      <!-- 정류장 -->
      <rect x="430" y="176" width="110" height="6" fill="#f3ead6"/>
      <rect x="434" y="182" width="4" height="62" fill="${dim}"/><rect x="532" y="182" width="4" height="60" fill="${dim}"/>
      <rect x="440" y="186" width="90" height="40" fill="#f3ead6" opacity=".12"/>
      ${elder(462, 244, 30, '#f3ead6')}${person(504, 242, 28, '#f3ead6')}
      <rect x="498" y="222" width="12" height="9" fill="${lamp}" opacity=".8"/>
      ${sign(580, 168, 70, ['청솔군청', '3분 후'])}
      <!-- 버스 -->
      <g transform="translate(150 262)">
        <path d="M150 -30 L250 -48 L250 -8 L150 -6 Z" fill="${lamp}" opacity=".18"/>
        <rect x="0" y="-62" width="150" height="56" rx="14" fill="#f3ead6"/>
        <rect x="12" y="-52" width="100" height="20" rx="4" fill="color-mix(in srgb, var(--night) 70%, #3d4a52)"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${16 + i * 24}" y="-49" width="18" height="14" rx="2" fill="${lamp}" opacity=".7"/>`).join('')}
        <rect x="120" y="-52" width="22" height="30" rx="4" fill="color-mix(in srgb, var(--night) 70%, #3d4a52)"/>
        <rect x="10" y="-26" width="70" height="10" rx="2" fill="var(--field)"/>${text(45, -18, '자율주행', 9, 700, '#f3ead6')}
        <circle cx="144" cy="-14" r="4" fill="${lamp}"/>
        <circle cx="30" cy="-4" r="9" fill="var(--night)"/><circle cx="118" cy="-4" r="9" fill="var(--night)"/>
        <path d="M75 -62 l0 -8 m-6 2 a8 8 0 0 1 12 0 m-16 -4 a14 14 0 0 1 20 0" fill="none" stroke="#7fd0ff" stroke-width="1.5" opacity=".8"/>
      </g>`,
  };

  function svg(year, label) {
    const draw = ART[year];
    if (!draw) return '';
    return `<svg class="event-art" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label || ''}" xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
  }

  root.EventArt = { svg, has: y => !!ART[y] };
})(this);
