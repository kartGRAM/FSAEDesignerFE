import {Vector3} from 'three';

export interface ITireData {
  readonly nodeID: string;
  name: string;
  description: string;
  friction(params: {sa: number; sl: number; ia: number; fz: number}): Vector3;
  dF_dSa(params: {sa: number; sl: number; ia: number; fz: number}): Vector3;
  dF_dSl(params: {sa: number; sl: number; ia: number; fz: number}): Vector3;
  dF_dIa(params: {sa: number; sl: number; ia: number; fz: number}): Vector3;
  dF_dFz(params: {sa: number; sl: number; ia: number; fz: number}): Vector3;

  mz(params: {sa: number; sl: number; ia: number; fz: number}): number;
  dMz_dSa(params: {sa: number; sl: number; ia: number; fz: number}): number;
  dMz_dSl(params: {sa: number; sl: number; ia: number; fz: number}): number;
  dMz_dIa(params: {sa: number; sl: number; ia: number; fz: number}): number;
  dMz_dFz(params: {sa: number; sl: number; ia: number; fz: number}): number;
}
