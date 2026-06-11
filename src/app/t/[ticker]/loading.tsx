export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="종목 분석 중">
      <div className="skel title" />
      <div className="skel-cards">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel card-block" />
        ))}
      </div>
      <div className="skel chart-block" />
    </div>
  );
}
