type longitudinalForce = number; // Fx
type lateralForce = number; // Fy
type torque = number;

export type TireRes = {
  fx: longitudinalForce;
  fy: lateralForce;
  mz: torque;
};

export interface ITireData {
  readonly nodeID: string;
  name: string;
  description: string;
  get(params: {sa: number; sl: number; ia: number; fz: number}): TireRes;
  saDiff(params: {sa: number; sl: number; ia: number; fz: number}): TireRes;
  fzDiff(params: {sa: number; sl: number; ia: number; fz: number}): TireRes;
  iaDiff(params: {sa: number; sl: number; ia: number; fz: number}): TireRes;
}
