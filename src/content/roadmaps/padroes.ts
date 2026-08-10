import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Roadmap no estilo roadmap.sh: espinha de seções (tópicos) com itens
 * (subtópicos) que abrem conceitos. Marque o progresso pelo checkbox.
 */
export const roadmapPadroes: Roadmap = {
  slug: "padroes-de-projeto",
  titulo: "Padrões de Projeto & Arquitetura",
  descricao:
    "Do básico de OOP aos padrões GoF e à arquitetura de sistemas. Clique num item para entender onde ele se encaixa e marque seu progresso.",
  sections: [
    {
      id: "oop",
      titulo: "Fundamentos de OOP",
      descricao: "A base: objetos, interfaces e polimorfismo — o que os padrões exploram.",
      items: [
        { id: "oop-encaps", titulo: "Encapsulamento & Abstração" },
        { id: "oop-poli", titulo: "Herança & Polimorfismo" },
        { id: "oop-composicao", titulo: "Composição sobre Herança" },
      ],
    },
    {
      id: "principios",
      titulo: "Princípios de Design",
      descricao: "Regras que guiam bom código antes de aplicar padrões.",
      items: [
        { id: "srp", titulo: "SRP — Responsabilidade Única", conceito: "srp" },
        { id: "ocp", titulo: "OCP — Aberto/Fechado", conceito: "ocp" },
        { id: "lsp", titulo: "LSP — Substituição de Liskov", conceito: "lsp" },
        { id: "isp", titulo: "ISP — Segregação de Interfaces", conceito: "isp" },
        { id: "dip", titulo: "DIP — Inversão de Dependência", conceito: "dip" },
        { id: "sub-cqs", titulo: "CQS", conceito: "cqs" },
        { id: "dry-kiss", titulo: "DRY · KISS · YAGNI", opcional: true },
      ],
    },
    {
      id: "criacionais",
      titulo: "Padrões Criacionais",
      descricao: "Como criar objetos sem acoplar o cliente às classes concretas.",
      items: [
        { id: "sub-factory", titulo: "Factory Method", conceito: "factory-method" },
        { id: "abstract-factory", titulo: "Abstract Factory", conceito: "abstract-factory", opcional: true },
        { id: "builder", titulo: "Builder", conceito: "builder", opcional: true },
        { id: "prototype", titulo: "Prototype", conceito: "prototype", opcional: true },
        { id: "singleton", titulo: "Singleton", conceito: "singleton", opcional: true },
      ],
    },
    {
      id: "estruturais",
      titulo: "Padrões Estruturais",
      descricao: "Como compor objetos e classes em estruturas maiores.",
      items: [
        { id: "sub-adapter", titulo: "Adapter", conceito: "adapter" },
        { id: "decorator", titulo: "Decorator", conceito: "decorator", opcional: true },
        { id: "facade", titulo: "Facade", conceito: "facade", opcional: true },
        { id: "proxy", titulo: "Proxy", conceito: "proxy", opcional: true },
        { id: "composite", titulo: "Composite", conceito: "composite", opcional: true },
        { id: "bridge", titulo: "Bridge", conceito: "bridge", opcional: true },
        { id: "flyweight", titulo: "Flyweight", conceito: "flyweight", opcional: true },
      ],
    },
    {
      id: "comportamentais",
      titulo: "Padrões Comportamentais",
      descricao: "Como objetos colaboram e distribuem responsabilidades.",
      items: [
        { id: "sub-observer", titulo: "Observer", conceito: "observer" },
        { id: "sub-strategy", titulo: "Strategy", conceito: "strategy" },
        { id: "state", titulo: "State", conceito: "state", opcional: true },
        { id: "command", titulo: "Command", conceito: "command", opcional: true },
        { id: "template-method", titulo: "Template Method", conceito: "template-method", opcional: true },
        { id: "chain", titulo: "Chain of Responsibility", conceito: "chain-of-responsibility", opcional: true },
        { id: "iterator", titulo: "Iterator", conceito: "iterator", opcional: true },
        { id: "mediator", titulo: "Mediator", conceito: "mediator", opcional: true },
        { id: "memento", titulo: "Memento", conceito: "memento", opcional: true },
        { id: "visitor", titulo: "Visitor", conceito: "visitor", opcional: true },
        { id: "interpreter", titulo: "Interpreter", conceito: "interpreter", opcional: true },
      ],
    },
    {
      id: "arquitetura",
      titulo: "Arquitetura de Software",
      descricao: "Padrões no nível de sistema — módulos, dados e transações.",
      items: [
        { id: "sub-hexagonal", titulo: "Arquitetura Hexagonal", conceito: "hexagonal" },
        { id: "sub-cqrs", titulo: "CQRS", conceito: "cqrs" },
        { id: "sub-saga", titulo: "Saga", conceito: "saga" },
        { id: "event-sourcing", titulo: "Event Sourcing", conceito: "event-sourcing", opcional: true },
      ],
    },
  ],
};
