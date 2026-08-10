// Garante os tipos da View Transitions API independentemente da versão do TS.
interface ViewTransition {
  readonly ready: Promise<void>;
  readonly finished: Promise<void>;
  readonly updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

interface Document {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition;
}
