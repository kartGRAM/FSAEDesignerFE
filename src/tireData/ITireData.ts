type longitudinalForce = number; // Fx
type lateralForce = number; // Fy
type torque = number;

export interface ITireData {
  readonly nodeID: string;
  name: string;
  description: string;
  get(params: {sa: number; sl: number; ia: number; fz: number}): {
    fx: longitudinalForce;
    fy: lateralForce;
    mz: torque;
  };
}
