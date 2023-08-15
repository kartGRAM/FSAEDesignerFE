import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';

import store, {RootState} from '@store/store';
import {isAArm, isBar, isTire, isSpringDumper} from '@gd/IElements';
import {
  canSimplifyAArm,
  isFixedElement,
  getJointDictionary
} from '@gd/kinematics/KinematicFunctions';

export default function Move() {
  const disabled = useSelector((state: RootState) => {
    const assembly = state.uitgd.collectedAssembly;
    const nonCollectedAssembly = state.uitgd.assembly;
    const dAssembly = state.dgd.present.topAssembly;
    if (!nonCollectedAssembly || !assembly || !dAssembly) return true;
    if (nonCollectedAssembly.nodeID !== dAssembly.nodeID) return true;
    const {children} = assembly;
    const element = children.find(
      (child) => child.absPath === state.uitgd.selectedElementAbsPath
    );
    const joints = assembly.getJointsAsVector3();
    const jointDict = getJointDictionary(children, joints);
    if (!element) return true;
    if (isAArm(element) && canSimplifyAArm(element, jointDict)) return true;
    // BarはComponent扱いしない
    if (isBar(element) || isSpringDumper(element)) return true;
    // Tireはコンポーネント扱いしない
    if (isTire(element)) return true;
    // FixedElementはコンポーネント扱いしない
    if (isFixedElement(element)) return true;

    return !state.uitgd.gdSceneState.assembled;
  });
  const moving = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.movingMode
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setMovingMode(!moving));
  };

  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;

  return (
    <Tooltip
      title="Move Selected Components"
      componentsProps={{
        popper: {
          sx: {
            zIndex
          }
        }
      }}
    >
      <span>
        <IconButton
          sx={{padding: 0.5}}
          onClick={handleOnClick}
          disabled={disabled}
        >
          <SvgIcon sx={{color: moving || disabled ? '#555555' : '#cccccc'}}>
            <svg
              version="1.1"
              x="0px"
              y="0px"
              viewBox="0 0 1000 1000"
              enableBackground="new 0 0 1000 1000"
              xmlSpace="preserve"
            >
              <metadata>
                Svg Vector Icons : http://www.onlinewebfonts.com/icon
              </metadata>
              <g>
                <path d="M988.2,810.7l-36.8-88.7c-5-12-18.8-17.8-30.9-12.8c-12,5-17.8,18.8-12.8,30.9l15,36.1l-79.8-33V391.2c0-9.9-6.2-18.8-15.5-22.2L523.6,258.3V181l27.6,27.6c4.6,4.6,10.7,6.9,16.7,6.9c6,0,12.1-2.3,16.7-6.9c9.2-9.2,9.2-24.2,0-33.4l-67.9-67.9c-9.2-9.2-24.2-9.2-33.4,0l-67.9,67.9c-9.2,9.2-9.2,24.2,0,33.4c9.2,9.2,24.2,9.2,33.4,0l27.6-27.6v77.3L172.6,369c-9.3,3.4-15.5,12.3-15.5,22.2v351.9l-79.8,33l15-36.1c5-12-0.7-25.9-12.8-30.9c-12.1-5-25.9,0.7-30.9,12.8l-36.8,88.7c-2.4,5.8-2.4,12.3,0,18.1s7,10.4,12.8,12.8l88.8,36.8c3,1.2,6,1.8,9,1.8c9.3,0,18.1-5.5,21.8-14.6c5-12-0.7-25.9-12.8-30.8l-36.1-15l84.9-35.1l311.7,113.6c0,0,4.4,1.4,8.1,1.4c3.7,0,8-1.4,8-1.4l311.7-113.6l84.9,35.1l-36.1,15c-12,5-17.8,18.8-12.8,30.8c3.8,9.1,12.6,14.6,21.8,14.6c3,0,6.1-0.6,9-1.8l88.8-36.8c5.8-2.4,10.4-7,12.8-12.8C990.6,823,990.6,816.4,988.2,810.7z M476.4,842.2l-231.6-84.4L476.4,664V842.2z M476.4,613L204.2,722.9V427.6l272.1,109.8V613z M476.4,486.5L244.7,393l231.7-84.4V486.5z M523.6,308.6L755.3,393l-231.7,93.5V308.6z M523.6,842.2V664l231.6,93.9L523.6,842.2z M795.8,722.9L523.6,613v-75.6l272.1-109.8L795.8,722.9L795.8,722.9L795.8,722.9z" />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
