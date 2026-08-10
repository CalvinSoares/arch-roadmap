export function Analogia({
  emoji,
  titulo,
  texto,
}: {
  emoji: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-primary/30 bg-primary/8 p-5">
      <span className="text-3xl leading-none" aria-hidden>
        {emoji}
      </span>
      <div>
        <p className="font-medium text-foreground">{titulo}</p>
        <p className="mt-1 text-sm text-muted">{texto}</p>
      </div>
    </div>
  );
}
