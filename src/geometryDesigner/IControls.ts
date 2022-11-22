export interface IControl {
  className: string;
  type: ControllerTypes;
  targetElement: string;
  inputButton: string;
}

export interface ILinearBushingControl extends IControl {
  className: 'LinearBushing';
  reverse: boolean;
  speed: number; // mm/s
}

export function isLinearBushingControl(
  control: IControl
): control is ILinearBushingControl {
  return control.className === 'LinearBushing';
}

export type ControllerTypes = 'keyboard' | 'joystick';
