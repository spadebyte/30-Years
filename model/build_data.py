# 행안부 주민등록 연령별 인구(CSV)를 군별·연도별·성별 5세 연령표로 정리한다.
# 2024년 전북특별자치도 출범으로 행정코드가 45→52로 바뀌어서 두 줄을 합친다.
import csv, json, os

DATA = os.path.join(os.path.dirname(__file__), '..', 'data')
COUNTIES = {
    'jinan': '진안군', 'muju': '무주군', 'jangsu': '장수군', 'imsil': '임실군',
    'sunchang': '순창군', 'gochang': '고창군', 'buan': '부안군',
}
YEARS = range(2010, 2026)
AGES = ['0~4세', '5~9세', '10~14세', '15~19세', '20~24세', '25~29세', '30~34세',
        '35~39세', '40~44세', '45~49세', '50~54세', '55~59세', '60~64세', '65~69세',
        '70~74세', '75~79세', '80~84세', '85~89세', '90~94세', '95~99세', '100세 이상']


def num(s):
    return int(s.replace(',', '') or 0)


out = {}
for key, name in COUNTIES.items():
    rows = list(csv.reader(open(os.path.join(DATA, key + '.csv'), encoding='utf-8')))
    head = rows[0]
    # 군 전체 줄만 (읍·면 줄은 제외): 코드 끝이 000000
    county_rows = [r for r in rows[1:] if r[0].rstrip(')').endswith('000000')]
    years = {}
    for y in YEARS:
        rec = {}
        for sex, tag in (('m', '남'), ('f', '여')):
            groups = [sum(num(r[head.index(f'{y}년_{tag}_{a}')]) for r in county_rows) for a in AGES]
            # 85세 이상은 하나로 묶는다 (인원이 적어 변동이 크다)
            rec[sex] = groups[:17] + [sum(groups[17:])]
        years[y] = rec
    out[key] = {'name': name, 'years': years}

json.dump(out, open(os.path.join(DATA, 'population.json'), 'w', encoding='utf-8'), ensure_ascii=False)
for key, c in out.items():
    tot = {y: sum(c['years'][y]['m']) + sum(c['years'][y]['f']) for y in (2010, 2015, 2020, 2025)}
    print(c['name'], tot)
