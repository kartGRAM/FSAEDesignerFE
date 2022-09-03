export const sleep = (time: number) =>
  // eslint-disable-next-line no-promise-executor-return
  new Promise((res) => setTimeout(res, time));

export const calculateWindowSize = (windowWidth: number) => {
  if (windowWidth >= 1200) {
    return 'lg';
  }
  if (windowWidth >= 992) {
    return 'md';
  }
  if (windowWidth >= 768) {
    return 'sm';
  }
  return 'xs';
};

export const root = process.env.PUBLIC_URL;

export const setWindowClass = (classList: string) => {
  const window: HTMLElement | null =
    document && document.getElementById('root');
  if (window) {
    // @ts-ignore
    window.classList = classList;
  }
};
export const addWindowClass = (classList: string) => {
  const window: HTMLElement | null =
    document && document.getElementById('root');
  if (window) {
    // @ts-ignore
    window.classList.add(classList);
  }
};

export const removeWindowClass = (classList: string) => {
  const window: HTMLElement | null =
    document && document.getElementById('root');
  if (window) {
    // @ts-ignore
    window.classList.remove(classList);
  }
};

export const numberToRgb = (code: number) => {
  let rgb = code.toString(16);

  if (rgb.length === 5) rgb = `0${rgb}`;

  return `#${rgb}`;
};

export interface color {
  r: number;
  g: number;
  b: number;
}
export const hexToRgb = (hex: string): color | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const rc = parseInt(result[1], 16);
    const gc = parseInt(result[2], 16);
    const bc = parseInt(result[3], 16);
    return {r: rc, g: gc, b: bc}; // return 23,14,45 -> reformat if needed
  }
  return null;
};

export function getReversal(color: string): string | null {
  const col = hexToRgb(color);
  if (!col) return null;
  let {r, g, b} = col;
  r = 255 - r;
  g = 255 - g;
  b = 255 - b;
  return numberToRgb(r * 256 * 256 + g * 256 + b);
}

const reToFixedNoZero = /\.?0+$/;
export function toFixedNoZero(
  n: number | null | undefined,
  fractionDigits: number = 10
): string | null {
  if (n !== 0 && !n) return null;
  return n.toFixed(fractionDigits).replace(reToFixedNoZero, '');
}
export const capitalize = (
  [first, ...rest]: string,
  lowerRest: boolean = false
) =>
  first.toUpperCase() +
  (lowerRest ? rest.join('').toLowerCase() : rest.join(''));

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function isNumber(value: any): value is number {
  // eslint-disable-next-line radix, no-restricted-globals
  const ret = value !== null && isFinite(value);

  return ret;
}

export function minus(value: string | number): string | number {
  if (isNumber(value)) {
    return value * -1;
  }
  return `-(${value})`;
}
