// 첫 분석(최대 수십 초) 동안 빈 화면 대신 스켈레톤 (003 R1)
export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="데이터 수집·분석 중">
      <div className="skel title" />
      <div className="skel line" />
      <div className="skel-cards">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel card-block" />
        ))}
      </div>
      <div className="skel line" />
      <div className="skel table-block" />
      <p className="empty">시세 수집·통계 계산 중 — 첫 로드는 수집 때문에 오래 걸릴 수 있다(이후 SQLite 캐시).</p>
    </div>
  );
}
