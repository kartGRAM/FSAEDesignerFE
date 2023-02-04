import {isObject} from '@utils/helpers';

export default interface IClipboardItem {
  isClipboardItem: true;
}

export function isClipboardItem(item: any): item is IClipboardItem {
  return isObject(item) && item.isClipboardItem;
}
