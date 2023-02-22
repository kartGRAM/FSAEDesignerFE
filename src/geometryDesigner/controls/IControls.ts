export interface IControl {
  readonly nodeID: string;
  readonly className: string;
  readonly type: ControllerTypes;
  readonly targetElement: string;
  readonly inputButton: string;
}

export interface ILinearBushingControl extends IControl {
  readonly className: 'LinearBushing';
  readonly reverse: boolean;
  readonly speed: number; // mm/s
}

export function isILinearBushingControl(
  control: IControl | undefined | null
): control is ILinearBushingControl {
  if (!control) return false;
  return control.className === 'LinearBushing';
}

export type ControllerTypes = 'keyboard' | 'joystick' | 'notAssigned';
