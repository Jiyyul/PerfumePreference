export default function PerfumeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1>Perfume Detail</h1>
      <p>ID: {params.id}</p>
      {/* 향수 상세 정보 구현 예정 */}
    </div>
  );
}
