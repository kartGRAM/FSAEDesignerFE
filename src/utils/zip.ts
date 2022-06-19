export function* zip2<T, U>(
  arg0: T[],
  arg1: U[]
): Generator<[T, U], void, unknown> {
  const {length} = arg0;
  for (let index = 0; index < length; index++) {
    const elms: [T, U] = [arg0[index], arg1[index]];
    yield elms;
  }
}
