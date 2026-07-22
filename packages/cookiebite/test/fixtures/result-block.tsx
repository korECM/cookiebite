import { Report, Section, Panel, ResultBlock } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

const columns = [
  { key: 'gameCode', label: '게임', type: 'text' as const },
  { key: 'users', label: '쿠폰 사용자', type: 'number' as const },
  { key: 'posts', label: '쿠폰 사용 횟수', type: 'number' as const },
];

const rows = [
  { gameCode: 'ck', users: 5821157, posts: 59540329 },
  { gameCode: 'crg', users: 4639922, posts: 12155844 },
  { gameCode: 'cba', users: 106072, posts: 471451 },
  { gameCode: 'cos', users: 81463, posts: 245198 },
  { gameCode: 'cwc', users: 25479, posts: 31872 },
  { gameCode: 'mars', users: 12, posts: 12 },
];

const SQL = `SELECT
  gameCode,
  COUNT(DISTINCT mid) AS total_coupon_user_count
FROM devplay.log_prod.platform_analytics_track_submitcoupon
WHERE date BETWEEN '2025-07-22' AND '2026-07-21'
GROUP BY gameCode
ORDER BY total_coupon_user_count DESC`;

export default function ReportDoc() {
  return (
    <Report title="쿠폰 사용 현황">
      <Section id="shape" title="크기 비교라 차트가 표와 함께 선다">
        <Panel title="게임별 쿠폰 사용자" description="지난 1년">
          <ResultBlock
            title="게임별 쿠폰 사용자"
            columns={columns}
            rows={rows}
            chart={{ type: 'bar', x: 'gameCode', y: 'users', mode: 'both' }}
            query={{ text: SQL }}
            meta={{ engine: 'BigQuery', ranAt: '2026-07-22 14:17:19', duration: '6.4s' }}
            totals
          />
        </Panel>
      </Section>

      <Section id="lookup" title="조회라 차트는 토글 뒤로 물러난다">
        <Panel title="게임 코드 대조표">
          <ResultBlock
            title="게임 코드 대조표"
            columns={columns}
            rows={rows}
            chart={{ type: 'bar', x: 'gameCode', y: 'posts' }}
            source="운영팀 집계 시트 · 2026-07-20 기준"
          />
        </Panel>
      </Section>

      <Section id="tableonly" title="차트 없이 표만">
        <Panel title="원본 기록">
          <ResultBlock title="원본 기록" columns={columns} rows={rows} />
        </Panel>
      </Section>
    </Report>
  );
}
