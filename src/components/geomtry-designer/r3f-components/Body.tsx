import * as React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {Line} from '@react-three/drei';
import {IBody, trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';

const Body = (props: {element: IBody}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  if (element.visible.value === false) {
    return null;
  }

  const nodes = element
    .getPoints()
    .map((p) => trans(p, coMatrix).divideScalar(100.0));
  const lines = nodes
    .map((node, i) => {
      return nodes.slice(i + 1).map((otherNode) => {
        return (
          <Line points={[node, otherNode]} color={0x00ffff} lineWidth={2} />
        );
      });
    })
    .flat();
  return <group>{lines}</group>;
};
export default Body;
