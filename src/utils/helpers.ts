export const sleep = (time: number) =>
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

export const NumberToRGB = (code: number) => {
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
