import type { LucideIcon, LucideProps } from "lucide-react";

interface Props extends LucideProps {
  /** O componente de ícone já resolvido (ex.: `iconeDaTech(id)`). */
  de: LucideIcon;
}

/**
 * Renderiza um ícone escolhido em tempo de execução.
 *
 * Existe por causa de `react-hooks/static-components`: escrever
 * `const Icone = iconeDaTech(id)` e logo abaixo `<Icone />` no mesmo
 * componente faz o lint entender que um componente está sendo criado durante
 * a renderização. Aqui o ícone chega pronto, por prop; o mesmo formato que
 * a paleta já usava e que o lint aceita.
 *
 * Os resolvedores (`iconeDaTech`, `iconeDoPadrao`, `CAMADA_VISUAL`) devolvem
 * constantes de módulo, então a referência é estável e não há remontagem.
 */
export function Icone({ de: Componente, ...props }: Props) {
  return <Componente {...props} />;
}
