/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function ReadonlyVariablesUpdate() {
  const ROVariablesManager = useSelector(
    (state: RootState) => state.uitgd.roVariablesManager
  );

  useFrame(() => {
    ROVariablesManager?.update();
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}
