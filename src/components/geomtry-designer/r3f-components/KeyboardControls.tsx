/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {useKeyboardControls} from '@react-three/drei';
import {getControl, Control} from '@gd/Controls';
import store, {RootState} from '@store/store';

export const KeyboardControls = () => {
  const [sub, get] = useKeyboardControls<string>();

  const controls = useSelector((state: RootState) => state.dgd.present.controls)
    .filter((c) => c.type === 'keyboard')
    .reduce((prev, current) => {
      prev[current.nodeID] = getControl(current);
      return prev;
    }, {} as {[index: string]: Control});

  const solver = useSelector((state: RootState) => state.uitgd.kinematicSolver);

  useFrame((threeState, delta) => {
    if (!solver) return;
    const state = get() as {[index: string]: boolean};
    const needToUpdate = {value: false};
    Object.keys(state).forEach((key) => {
      if (!state[key]) return;
      needToUpdate.value = true;
      const control = controls[key];
      control.preprocess(delta, solver);
    });
    if (needToUpdate.value) {
      solver.solve();
    }
  });

  return null;
};
