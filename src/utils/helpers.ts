export function deepCopy<T>(data: T) {
  return JSON.parse(JSON.stringify(data)) as T;
}
function listFontFamilies(): void {
  if (inWorker()) return;
  document.fonts.ready.then(() => {
    for (const font of fontFamiliesMaybeInstalled.values()) {
      if (document.fonts.check(`12px "${font}"`)) {
        fontFamilies.push(font);
      }
    }
  });
}
const fontFamiliesMaybeInstalled = new Set(
  [
    // Windows 10
    'Arial',
    'Arial Black',
    'Bahnschrift',
    'Calibri',
    'Cambria',
    'Cambria Math',
    'Candara',
    'Comic Sans MS',
    'Consolas',
    'Constantia',
    'Corbel',
    'Courier New',
    'Ebrima',
    'Franklin Gothic Medium',
    'Gabriola',
    'Gadugi',
    'Georgia',
    'HoloLens MDL2 Assets',
    'Impact',
    'Ink Free',
    'Javanese Text',
    'Leelawadee UI',
    'Lucida Console',
    'Lucida Sans Unicode',
    'Malgun Gothic',
    'Marlett',
    'Microsoft Himalaya',
    'Microsoft JhengHei',
    'Microsoft New Tai Lue',
    'Microsoft PhagsPa',
    'Microsoft Sans Serif',
    'Microsoft Tai Le',
    'Microsoft YaHei',
    'Microsoft Yi Baiti',
    'MingLiU-ExtB',
    'Mongolian Baiti',
    'MS Gothic',
    'MV Boli',
    'Myanmar Text',
    'Nirmala UI',
    'Palatino Linotype',
    'Segoe MDL2 Assets',
    'Segoe Print',
    'Segoe Script',
    'Segoe UI',
    'Segoe UI Historic',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'SimSun',
    'Sitka',
    'Sylfaen',
    'Symbol',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Webdings',
    'Wingdings',
    'Yu Gothic',
    // macOS
    'American Typewriter',
    'Andale Mono',
    'Arial',
    'Arial Black',
    'Arial Narrow',
    'Arial Rounded MT Bold',
    'Arial Unicode MS',
    'Avenir',
    'Avenir Next',
    'Avenir Next Condensed',
    'Baskerville',
    'Big Caslon',
    'Bodoni 72',
    'Bodoni 72 Oldstyle',
    'Bodoni 72 Smallcaps',
    'Bradley Hand',
    'Brush Script MT',
    'Chalkboard',
    'Chalkboard SE',
    'Chalkduster',
    'Charter',
    'Cochin',
    'Comic Sans MS',
    'Copperplate',
    'Courier',
    'Courier New',
    'Didot',
    'DIN Alternate',
    'DIN Condensed',
    'Futura',
    'Geneva',
    'Georgia',
    'Gill Sans',
    'Helvetica',
    'Helvetica Neue',
    'Herculanum',
    'Hoefler Text',
    'Impact',
    'Lucida Grande',
    'Luminari',
    'Marker Felt',
    'Menlo',
    'Microsoft Sans Serif',
    'Monaco',
    'Noteworthy',
    'Optima',
    'Palatino',
    'Papyrus',
    'Phosphate',
    'Rockwell',
    'Savoye LET',
    'SignPainter',
    'Skia',
    'Snell Roundhand',
    'Tahoma',
    'Times',
    'Times New Roman',
    'Trattatello',
    'Trebuchet MS',
    'Verdana',
    'Zapfino'
  ].sort()
);

export const fontFamilies: string[] = [];

listFontFamilies();

export const sleep = (millisec: number) =>
  // eslint-disable-next-line no-promise-executor-return
  new Promise((res) => setTimeout(res, millisec));

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
  const d = Number(n);
  return d.toFixed(fractionDigits).replace(reToFixedNoZero, '');
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

export const isArray = <T>(
  maybeArray: T | readonly T[] | unknown
): maybeArray is T[] => {
  return Array.isArray(maybeArray);
};

export function inverseKeyValue(obj: {[index: string]: string}) {
  return Object.keys(obj).reduceRight((ret, k) => {
    ret[obj[k]] = k;
    return ret;
  }, {} as {[index: string]: string});
}

export function isObject(value: any): boolean {
  return value !== null && typeof value === 'object';
}

export function inWorker() {
  // eslint-disable-next-line no-restricted-globals
  if (self.document) return false;
  return true;
}
