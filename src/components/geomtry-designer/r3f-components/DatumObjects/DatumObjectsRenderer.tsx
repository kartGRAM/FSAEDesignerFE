/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  isPoint,
  IDatumObject,
  isPlane,
  isLine
} from '@gd/measure/IDatumObjects';
import Point from './Point';
import Line from './Line';
import Plane from './Plane';

export default function DatumObjectRenderer() {
  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  useFrame(() => {
    datumManager?.update();
  });

  const datumObjects = datumManager?.getObjectsAll() ?? [];

  return <>{datumObjects.map((datum) => getDatum(datum))}</>;
}

function getDatum(datum: IDatumObject) {
  if (isPoint(datum)) return <Point point={datum} key={datum.nodeID} />;
  if (isPlane(datum)) return <Plane plane={datum} key={datum.nodeID} />;
  if (isLine(datum)) return <Line line={datum} key={datum.nodeID} />;
  return null;
}
