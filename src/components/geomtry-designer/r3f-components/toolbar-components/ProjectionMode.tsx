import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {setProjectionMode} from '@store/reducers/uiGeometryDesigner';
import store, {RootState} from '@store/store';

export default function ProjectionMode() {
  const projectionMode = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.projectionMode
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(
      setProjectionMode(
        projectionMode === 'Perspective' ? 'Orthographic' : 'Perspective'
      )
    );
  };

  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;

  return (
    <Tooltip
      title={
        projectionMode === 'Perspective'
          ? 'Switch to Orthographic View Mode'
          : 'Switch to Perspective View Mode'
      }
      componentsProps={{
        popper: {
          sx: {
            zIndex
          }
        }
      }}
    >
      <IconButton sx={{padding: 0.5}} onClick={handleOnClick}>
        <SvgIcon sx={{color: '#cccccc'}}>
          {projectionMode === 'Perspective' ? (
            // 並行投影アイコン
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
                <path d="M811.4,936.1l-20.4-20.5l34.1-34.1l20.4,20.4L811.4,936.1z" />
                <path d="M861.6,885.9l-20.4-20.4l34.1-34.1l20.4,20.5L861.6,885.9z" />
                <path d="M911.8,835.7l-20.5-20.4l34.1-34.1l20.5,20.4L911.8,835.7z" />
                <path d="M109.1,910.8l-20.5-20.5l34.1-34.1l20.4,20.5L109.1,910.8z" />
                <path d="M159.3,860.6l-20.4-20.4l34.1-34.1l20.4,20.5L159.3,860.6z" />
                <path d="M209.5,810.4L189,790l34.1-34.1l20.5,20.4L209.5,810.4z" />
                <path d="M801.4,223.5L781,203.1L815,169l20.5,20.4L801.4,223.5z" />
                <path d="M851.6,173.3l-20.5-20.4l34.1-34.1l20.5,20.5L851.6,173.3z" />
                <path d="M89,164.2l20.5,20.5l-34.1,34.1l-20.5-20.5L89,164.2z" />
                <path d="M139.2,114l20.5,20.5l-34.1,34.1L105.1,148L139.2,114z" />
                <path d="M189.4,63.8l20.5,20.5l-34.1,34.1l-20.5-20.5L189.4,63.8L189.4,63.8z" />
                <path d="M288.9,693.1l-28.9,0l0,25.9l-20.7,20.7l20.5,20.4l18.4-18.4l36.1,0v-28.9h-25.3L288.9,693.1z" />
                <path d="M260,622.1h28.9v48.2H260V622.1z" />
                <path d="M260,551.1h28.9v48.2H260V551.1z" />
                <path d="M260,480.1h28.9v48.2H260V480.1L260,480.1z" />
                <path d="M260,408h28.9v48.2H260V408z" />
                <path d="M260,337h28.9v48.2H260V337z" />
                <path d="M990,10.1H236v7l-30.5,30.5L226,68.1L236,58v177.9H58.2l1.1-1.1l-20.5-20.5l-21.5,21.5H10v754h754v-6.4l31.3-31.3l-20.5-20.4L764,942.6V764.1h178.5l-0.9,0.9l20.5,20.5l21.4-21.4h6.7L990,10.1L990,10.1z M688.4,914.6H85.6V311.2H260v3h28.9v-3h399.5V914.6z M764,688.8v-28.9h0.2v-26.5H764V260.9l21.3-21.3l-20.5-20.5l-16.7,16.7H311.6V85.4h587l-17.2,17.2l20.5,20.5l12.6-12.6v578.3H764z" />
                <path d="M622.1,712.8h48.2v28.9h-48.2V712.8z" />
                <path d="M551.1,712.8h48.2v28.9h-48.2V712.8z" />
                <path d="M479,712.8h48.2v28.9H479V712.8z" />
                <path d="M408,712.8h48.2v28.9H408V712.8z" />
                <path d="M337,712.8h48.2v28.9H337V712.8z" />
              </g>
            </svg>
          ) : (
            // 射影投影アイコン
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
                <path d="M952.5,10H389.6h-30.6h-10.2v224.3H82.9l4.7-3.4l-10.7-14.6l-24.7,18h-4.7v755.6h750.9l0.3,0.1l0-0.1h3.2v-8l10.1-25.5l-10.1-4V612.5h127.4l-8.1,20.4l16.8,6.7l10.8-27.1h3.7L952.5,10L952.5,10z M726.4,914.5l-590.6-1.2l18.9-23.9l-14.4-11l-17.2,21.7V309.6h603.2L726.4,914.5L726.4,914.5z M802,537.1V246.9l13.6-25.5l-16.1-8.3l-11.3,21.1H424.4V85.4h440.8l-13.3,25.8l16.1,8.3l8.9-17.2v434.9H802z" />
                <path d="M444.5,571.8h36.2v18.1h-36.2V571.8z" />
                <path d="M595.3,571.8h36.2v18.1h-36.2V571.8z" />
                <path d="M670.7,571.8h36.2v18.1h-36.2V571.8z" />
                <path d="M519.9,571.8H556v18.1h-36.2V571.8z" />
                <path d="M368.5,327.2h18.1v36.2h-18.1V327.2z" />
                <path d="M368.5,402.7h18.1v36.2h-18.1V402.7z" />
                <path d="M368.5,478.1h18.1v36.2h-18.1V478.1z" />
                <path d="M186.1,818.5l14.4,11l-22,28.7l-14.4-11L186.1,818.5L186.1,818.5z" />
                <path d="M277.7,698.7l14.4,11l-22,28.7l-14.4-11L277.7,698.7z" />
                <path d="M323.4,638.8l14.4,11l-22,28.7l-14.4-11L323.4,638.8z" />
                <path d="M361.6,618.6l21.9-28.7h21.7v-18.1h-18.7v-18.3h-18.1v26.3l-21.2,27.8L361.6,618.6z" />
                <path d="M231.8,758.6l14.4,11l-22,28.7l-14.4-11L231.8,758.6z" />
                <path d="M137.8,171.7l10.7,14.6l-29.2,21.4l-10.7-14.6L137.8,171.7z" />
                <path d="M259.5,82.7l10.7,14.6L241,118.6L230.3,104L259.5,82.7z" />
                <path d="M320.4,38.2l10.7,14.6l-29.2,21.4l-10.7-14.6L320.4,38.2z" />
                <path d="M198.7,127.2l10.7,14.6l-29.2,21.4l-10.7-14.6L198.7,127.2L198.7,127.2z" />
                <path d="M826.5,920l-16.8-6.7l13.4-33.6l16.8,6.7L826.5,920z" />
                <path d="M882.4,779.8l-16.8-6.7l13.4-33.6l16.8,6.7L882.4,779.8z" />
                <path d="M910.1,709.7l-16.8-6.7l13.4-33.6l16.8,6.7L910.1,709.7z" />
                <path d="M854.4,849.8l-16.8-6.7l13.4-33.6l16.8,6.7L854.4,849.8z" />
                <path d="M833.5,186.5l-16.1-8.3l16.5-32.2l16.1,8.3L833.5,186.5z" />
              </g>
            </svg>
          )}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
