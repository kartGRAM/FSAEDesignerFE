import React from 'react';
import Keyboard, {KeyboardReactInterface} from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './keyboad.css';
import {inverseKeyValue} from '@app/utils/helpers';

export default function FullLayoutKeyboad(
  props: KeyboardReactInterface['options']
) {
  const {onKeyPress: onKeyPressOrg} = props;
  const [layoutName, setLayoutName] = React.useState('default');

  const onKeyPress = (button: string) => {
    if (
      button === '{shift}' ||
      button === '{shiftleft}' ||
      button === '{shiftright}' ||
      button === '{capslock}'
    ) {
      setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
      return;
    }
    if (onKeyPressOrg) onKeyPressOrg(keys(button));
  };

  const commonKeyboardOptions = {
    ...props,
    theme: 'simple-keyboard hg-theme-default hg-layout-default',
    physicalKeyboardHighlight: true,
    syncInstanceInputs: true,
    mergeDisplay: true,
    debug: false,
    onKeyPress
  };

  const keyboardOptions = {
    ...commonKeyboardOptions,
    layout: {
      default: [
        '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
        '` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
        '{tab} q w e r t y u i o p [ ] \\',
        "{capslock} a s d f g h j k l ; ' {enter}",
        '{shiftleft} z x c v b n m , . / {shiftright}',
        '{controlleft} {altleft} {metaleft} {space} {controlright} {altright}'
      ],
      shift: [
        '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
        '~ ! @ # $ % ^ & * ( ) _ + {backspace}',
        '{tab} Q W E R T Y U I O P { } |',
        '{capslock} A S D F G H J K L : " {enter}',
        '{shiftleft} Z X C V B N M < > ? {shiftright}',
        '{controlleft} {altleft} {metaleft} {space} {controlright} {altright}'
      ]
    },
    display: {
      '{escape}': 'esc',
      '{tab}': 'tab ⇥',
      '{backspace}': 'backspace ⌫',
      '{enter}': 'enter ↵',
      '{capslock}': 'caps lock ⇪',
      '{shiftleft}': 'shift ⇧',
      '{shiftright}': 'shift ⇧',
      '{controlleft}': 'ctrl',
      '{controlright}': 'ctrl',
      '{altleft}': 'alt ⌥',
      '{altright}': 'alt ⌥',
      '{metaleft}': 'cmd ⌘'
    }
  };

  const keyboardControlPadOptions = {
    ...commonKeyboardOptions,
    layout: {
      default: [
        '{prtscr} {scrolllock} {pause}',
        '{insert} {home} {pageup}',
        '{delete} {end} {pagedown}'
      ]
    }
  };

  const keyboardArrowsOptions = {
    ...commonKeyboardOptions,
    layout: {
      default: ['{arrowup}', '{arrowleft} {arrowdown} {arrowright}']
    }
  };

  return (
    <div className="keyboardContainer">
      <Keyboard
        baseClass="simple-keyboard-main"
        layoutName={layoutName}
        {...keyboardOptions}
      />

      <div className="controlArrows">
        <Keyboard
          baseClass="simple-keyboard-control"
          {...keyboardControlPadOptions}
        />
        <Keyboard
          baseClass="simple-keyboard-arrows"
          {...keyboardArrowsOptions}
        />
      </div>
    </div>
  );
}

const keyConverts: {[index: string]: string} = {
  '{enter}': 'Enter',
  '{arrowup}': 'ArrowUp',
  '{arrowleft}': 'ArrowLeft',
  '{arrowdown}': 'ArrowDown',
  '{arrowright}': 'ArrowRight'
};

const keyConvertsInversed = inverseKeyValue(keyConverts);

export const keys = (key: string) => {
  return keyConverts[key] ?? key;
};

export const keysInv = (key: string) => {
  return keyConvertsInversed[key] ?? key;
};
