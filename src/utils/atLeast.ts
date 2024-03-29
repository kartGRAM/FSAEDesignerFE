type Append<Elm, T extends unknown[]> = ((
  arg: Elm,
  ...rest: T
) => void) extends (...args: infer T2) => void
  ? T2
  : never;

export type AtLeast<N extends number, T> = AtLeastRec<N, T, T[], []>;

type AtLeastRec<Num, Elm, T extends unknown[], C extends unknown[]> = {
  0: T;
  1: AtLeastRec<Num, Elm, Append<Elm, T>, Append<unknown, C>>;
}[C extends {length: Num} ? 0 : 1];

export type AtLeast1<T> = [T, ...T[]];
export type AtLeast2<T> = [T, T, ...T[]];
export type AtLeast3<T> = [T, T, T, ...T[]];

export type Triple<T> = [T, T, T];
export type Twin<T> = [T, T];
export type OneOrTwo<T> = [T] | Twin<T>;
