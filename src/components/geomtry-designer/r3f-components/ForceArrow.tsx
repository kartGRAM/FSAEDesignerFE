/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {IElement, transQuaternion} from '@gd/IElements';
import {Cone, Cylinder, Html} from '@react-three/drei';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {Paper, Typography, Box, IconButton} from '@mui/material';
import {jetMap} from '@utils/helpers';
import {alpha} from '@mui/material/styles';
import PushPinIcon from '@mui/icons-material/PushPin';
import {Tooltip} from '@gdComponents/Tooltip';

const ForceArrow = (props: {
  element: IElement;
  index: number;
  stdLength?: number;
}) => {
  const {element, index} = props;
  // eslint-disable-next-line react/destructuring-assignment
  const stdLength = props.stdLength ?? 450;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const [show, setShow] = React.useState(false);
  const [pin, setPin] = React.useState(false);

  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );
  const force = element.getForceResults()[index];

  const showParentName = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.forceViewerState.showParentName
  );
  const showMagnitude = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.forceViewerState.showMagnitude
  );
  const showLocalXYZ = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.forceViewerState.showLocalXYZ
  );
  const showGlobalXYZ = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.forceViewerState.showGlobalXYZ
  );

  useFrame(() => {
    if (!isSkidpadSolver(solver)) return;
    const std = solver.state.stdForce;
    const force = element.getForceResults()[index];
    const magnitude = force.force.length();
    const size = (stdLength * magnitude) / std;
    if (size < Number.EPSILON ** 16) {
      coneMeshRef.current.visible = false;
      cylinderMeshRef.current.visible = false;
      return;
    }
    const rgb = jetMap(size, 0, stdLength);
    const color = rgb.r * 256 ** 2 + rgb.g * 256 + rgb.b;
    coneMaterialRef.current.color.set(color);
    cylinderMaterialRef.current.color.set(color);

    const cone = coneMeshRef.current;
    const cylinderGeometry = cylinderMeshRef.current.geometry;
    cylinderGeometry.attributes.position.needsUpdate = true;
    const cylinderVtx = cylinderGeometry.attributes.position.array;
    cylinderVtx.forEach((p, i) => {
      if (i % 3 !== 1) return;
      if (p > 0) cylinderVtx[i] = size;
      else cylinderVtx[i] = 0;
    });
    cone.position.copy(
      new THREE.Vector3(0, 0, size + 10).applyMatrix3(coMatrix)
    );

    // 位置の反映
    groupRef.current.position.copy(force.point.clone().applyMatrix3(coMatrix));
    const nf = force.force.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      nf
    );
    groupRef.current.quaternion.copy(transQuaternion(q, coMatrix));

    // 表示
    if (textRef.current) {
      textRef.current.innerText = '';
      if (showMagnitude)
        textRef.current.innerText += `${magnitude.toFixed(1)}N\n\n`;
      if (showLocalXYZ) {
        textRef.current.innerText += `${force.force.x.toFixed(1)}N\n`;
        textRef.current.innerText += `${force.force.y.toFixed(1)}N\n`;
        textRef.current.innerText += `${force.force.z.toFixed(1)}N\n\n`;
      }
      if (showGlobalXYZ) {
        const qi = element.rotation.value;
        const fg = force.force.clone().applyQuaternion(qi);
        textRef.current.innerText += `${fg.x.toFixed(1)}N\n`;
        textRef.current.innerText += `${fg.y.toFixed(1)}N\n`;
        textRef.current.innerText += `${fg.z.toFixed(1)}N`;
      }
    }
  });

  const groupRef = React.useRef<THREE.Group>(null!);
  const coneMeshRef = React.useRef<THREE.Mesh>(null!);
  const cylinderMeshRef = React.useRef<THREE.Mesh>(null!);
  const coneMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null!);
  const cylinderMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null!);
  const textRef = React.useRef<HTMLSpanElement>(null);
  if (!isSkidpadSolver(solver)) return null;

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => {
        if (coneMeshRef.current?.visible) setShow(true);
      }}
      onPointerLeave={() => setShow(false)} // see note 1
      onClick={(e) => {
        e.stopPropagation();
        setPin((prev) => !prev);
      }}
    >
      <Cone
        ref={coneMeshRef}
        args={[5, 20]}
        position={new THREE.Vector3(0, 0, stdLength + 10).applyMatrix3(
          coMatrix
        )}
      >
        <meshBasicMaterial ref={coneMaterialRef} />
        {show || pin ? (
          <Html>
            <Paper
              onClick={() => {
                if (!pin) setPin(true);
              }}
              elevation={3}
              sx={{
                userSelect: 'none',
                transform: 'translate3d(20px, -50%, 0)',
                paddingTop: 0.7,
                paddingBottom: 0.7,
                paddingLeft: 1,
                paddingRight: 1,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '-10px',
                  height: '1px',
                  width: '40px',
                  background: alpha('#FFF', 0.6)
                }
              }}
            >
              <Box
                component="div"
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  padding: 0
                }}
              >
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{
                    padding: 0,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                >
                  &nbsp;{force.name}
                </Typography>
                <Tooltip title={pin ? 'close' : 'pin'}>
                  <IconButton onClick={() => setPin((prev) => !prev)}>
                    <PushPinIcon
                      fontSize="small"
                      sx={{
                        transform: !pin ? 'rotate(90deg)' : 'unset'
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              {showParentName ? (
                <Typography
                  variant="caption"
                  gutterBottom
                  sx={{
                    position: 'relative',
                    top: -10,
                    textAlign: 'right',
                    padding: 0,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                >
                  @&nbsp;{element.name.value}
                </Typography>
              ) : null}
              <Box component="div" sx={{display: 'flex', flexDirection: 'row'}}>
                <Typography
                  variant="body2"
                  display="block"
                  gutterBottom
                  sx={{
                    textAlign: 'left',
                    padding: 0,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {showMagnitude ? (
                    <>
                      magnitude:
                      <br />
                      <br />
                    </>
                  ) : null}
                  {showLocalXYZ ? (
                    <>
                      local x:
                      <br />
                      local y:
                      <br />
                      local z:
                      <br />
                      <br />
                    </>
                  ) : null}
                  {showGlobalXYZ ? (
                    <>
                      global x:
                      <br />
                      global y:
                      <br />
                      global z:
                    </>
                  ) : null}
                </Typography>
                <Typography
                  variant="body2"
                  display="block"
                  gutterBottom
                  sx={{
                    padding: 0,
                    pl: 1,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                  ref={textRef}
                />
              </Box>
            </Paper>
          </Html>
        ) : null}
      </Cone>
      <Cylinder ref={cylinderMeshRef} args={[2, 2, stdLength]}>
        <meshBasicMaterial ref={cylinderMaterialRef} />
      </Cylinder>
    </group>
  );
};
export default ForceArrow;
