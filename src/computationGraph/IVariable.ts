export interface IVariable {
  readonly col: () => number;
  setValue(value: unknown): void;
}
