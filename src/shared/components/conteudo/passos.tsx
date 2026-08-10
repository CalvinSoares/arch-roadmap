export function Passos({
  passos,
}: {
  passos: { titulo: string; texto: string }[];
}) {
  return (
    <ol className="relative space-y-4 border-l-2 border-dashed border-card-border pl-6">
      {passos.map((p, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {i + 1}
          </span>
          <p className="font-medium text-foreground">{p.titulo}</p>
          <p className="mt-0.5 text-sm text-muted">{p.texto}</p>
        </li>
      ))}
    </ol>
  );
}
