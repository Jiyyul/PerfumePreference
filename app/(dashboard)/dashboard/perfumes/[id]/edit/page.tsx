export default function EditPerfumePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1>Edit Perfume</h1>
      <p>ID: {params.id}</p>
      {/* 향수 수정 폼 구현 예정 */}
    </div>
  );
}
