import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
// eslint-disable-next-line import/no-extraneous-dependencies
import {SxProps} from '@mui/system';
import {Theme} from '@mui/material/styles';
import store from '@store/store';

export default function FixedFrame(props: {
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const {onClick, title, disabled, sx} = props;
  const {uitgd} = store.getState();
  const tooltipZIndex =
    uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.tooltipZIndex;

  return (
    <Tooltip
      title={title}
      componentsProps={{
        popper: {
          sx: {
            zIndex: tooltipZIndex,
            '&:hover': {
              display: 'none'
            }
          }
        }
      }}
    >
      <span>
        <IconButton
          disabled={disabled}
          onClick={() => {
            if (onClick) onClick();
          }}
          sx={sx}
        >
          <SvgIcon sx={{color: disabled ? '#555555' : '#cccccc'}}>
            <svg
              id="exportSVG"
              visibility="visible"
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              data-info="draw.ninja"
              data-name="draw"
              viewBox="0 0 190 138"
              style={{position: 'fixed', top: '0px', left: '0px'}}
            >
              <defs id="defsExport">
                <filter id="filter0">
                  <feGaussianBlur stdDeviation="0" />
                </filter>
                <pattern
                  id="patternImage"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="1"
                  height="1"
                  data-x="0"
                  data-y="0"
                  data-width="1"
                  data-height="1"
                  data-multx="1"
                  data-multy="1"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="patternImage"
                  data-draw="1"
                  fillOpacity="1"
                />
                <pattern
                  id="pattern0"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 0"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 0 L5 0 L5 5 L0 5 L0 0 Z"
                  />
                </pattern>
                <pattern
                  id="pattern1"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 1"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 5 L5 0 L10 5 L5 10 L0 5 Z"
                  />
                </pattern>
                <pattern
                  id="pattern2"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 2"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 9 L5 1 L10 9 L0 9 Z"
                  />
                </pattern>
                <pattern
                  id="pattern3"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 3"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 5 C0 2.25 2.25 0 5 0 C7.75 0 10 2.25 10 5 C10 7.75 7.75 10 5 10 C2.25 10 0 7.75 0 5 Z"
                  />
                </pattern>
                <pattern
                  id="pattern4"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 4"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 5 L4 4 L5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 Z"
                  />
                </pattern>
                <pattern
                  id="pattern5"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 5"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M5 10 C-5 2.75 3 -1.75 5 1 C7 -1.75 15 2.75 5 10 Z"
                  />
                </pattern>
                <pattern
                  id="pattern6"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 6"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M3 0 L7 0 L7 10 L3 10 L3 0 Z"
                  />
                </pattern>
                <pattern
                  id="pattern7"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 7"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M10 3 L10 7 L0 7 L0 3 L10 3 Z"
                  />
                </pattern>
                <pattern
                  id="pattern8"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 8"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 10 L3 3 L10 0 L7 7 L0 10 Z"
                  />
                </pattern>
                <pattern
                  id="pattern9"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  data-x="0"
                  data-y="0"
                  data-width="10"
                  data-height="10"
                  data-multx="1"
                  data-multy="1"
                  stroke="none"
                  patternTransform="matrix(1,0,0,1,0,0)"
                  data-transs="0"
                  data-transf="0"
                  data-source="Pattern 9"
                  data-draw="1"
                  fillOpacity="1"
                >
                  <path
                    transform="matrix(1,0,0,1,0,0)"
                    d="M0 4 L10 4 L10 6 L0 6 L0 4 Z M4 10 L4 0 L6 0 L6 10 L4 10 Z"
                  />
                </pattern>
                <linearGradient
                  id="linearSystem"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  spreadMethod="pad"
                >
                  <stop offset="50%" stopColor="#D0D0D0" stopOpacity="1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id="linearSystem1"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  spreadMethod="pad"
                >
                  <stop offset="30%" stopColor="#D0D0D0" stopOpacity="1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id="linearSystem2"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="50%"
                  y2="50%"
                  spreadMethod="repeat"
                >
                  <stop offset="30%" stopColor="#D0D0D0" stopOpacity="1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id="linearSystem3"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="50%"
                  y2="50%"
                  spreadMethod="reflect"
                >
                  <stop offset="30%" stopColor="#D0D0D0" stopOpacity="1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
                <radialGradient
                  id="radialSystem"
                  gradientUnits="objectBoundingBox"
                  r="0.5"
                  cx="0.5"
                  fx="0.5"
                  cy="0.5"
                  fy="0.5"
                  spreadMethod="pad"
                >
                  <stop offset="50%" stopColor="#D0D0D0" stopOpacity="1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="1" />
                </radialGradient>
                <pattern
                  id="patternSystem"
                  patternUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="6"
                  height="8"
                >
                  <path strokeWidth="5" fill="none" d="M0 0 L0 10" />
                </pattern>
                <linearGradient
                  id="linear0"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  spreadMethod="pad"
                >
                  <stop offset="0%" stopColor="#FF8000" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFFF00" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id="linear1"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  spreadMethod="pad"
                >
                  <stop offset="0%" stopColor="#FFFF00" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FF8000" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id="linearImport"
                  gradientUnits="objectBoundingBox"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  spreadMethod="pad"
                >
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
                </linearGradient>
                <radialGradient
                  id="radial0"
                  gradientUnits="objectBoundingBox"
                  r="0.5"
                  cx="0.5"
                  fx="0.5"
                  cy="0.5"
                  fy="0.5"
                  spreadMethod="pad"
                >
                  <stop offset="0%" stopColor="#FF8000" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFFF00" stopOpacity="1" />
                </radialGradient>
                <radialGradient
                  id="radial1"
                  gradientUnits="objectBoundingBox"
                  r="0.5"
                  cx="0.5"
                  fx="0.5"
                  cy="0.5"
                  fy="0.5"
                  spreadMethod="pad"
                >
                  <stop offset="0%" stopColor="#FFFF00" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FF8000" stopOpacity="1" />
                </radialGradient>
                <radialGradient
                  id="radialImport"
                  gradientUnits="objectBoundingBox"
                  r="0.5"
                  cx="0.5"
                  fx="0.5"
                  cy="0.5"
                  fy="0.5"
                  spreadMethod="pad"
                >
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
                </radialGradient>
              </defs>
              <rect
                id="pageExport"
                x="0"
                y="0"
                width="190"
                height="138"
                fill="none"
                fillOpacity="0"
                stroke="none"
                strokeWidth="0"
              />
              <g id="objectsExport" visibility="visible">
                <path
                  id="path4"
                  d="M59.6 0.619 C53.6 1.719 49 3.719 31.8 12.419 C31.8 12.419 14.6 21.119 14.6 21.119 C14.6 21.119 10.4 21.119 10.4 21.119 C6.8 21.119 6.2 21.219 6 21.919 C5.9 22.419 5.4 25.719 4.8 29.419 C3.9 35.819 3.7 36.219 1.9 38.819 C1.9 38.819 0 41.619 0 41.619 C0 41.619 1.1 51.119 1.1 51.119 C1.7 56.319 2.4 61.019 2.7 61.619 C3.1 62.219 5.1 64.019 7.3 65.819 C10.5 68.419 11.4 69.319 11.8 70.819 C12.7 74.019 14.6 77.219 17.4 80.119 C22.3 85.119 27.2 87.019 34.5 86.719 C38.4 86.519 39.4 86.319 42.4 84.919 C44.2 84.019 46.8 82.319 48.1 81.219 C48.1 81.219 50.5 79.019 50.5 79.019 C50.5 79.019 58.9 79.019 58.9 79.019 C58.9 79.019 67.3 79.019 67.3 79.019 C67.3 79.019 67.3 83.919 67.3 83.919 C67.3 83.919 67.3 88.819 67.3 88.819 C67.3 88.819 77.7 88.819 77.7 88.819 C77.7 88.819 88 88.819 88 88.819 C88 88.819 88 108.419 88 108.419 C88 126.619 88 128.119 87.2 128.419 C86.7 128.619 84.1 129.419 81.4 130.119 C81.4 130.119 76.4 131.419 76.4 131.419 C76.4 131.419 76.4 134.119 76.4 134.119 C76.4 134.119 76.4 136.819 76.4 136.819 C76.4 136.819 95.7 136.719 95.7 136.719 C95.7 136.719 115 136.619 115 136.619 C115 136.619 115 134.119 115 134.119 C115 134.119 115 131.619 115 131.619 C115 131.619 109.4 130.019 109.4 130.019 C109.4 130.019 103.7 128.419 103.7 128.419 C103.7 128.419 103.7 108.619 103.7 108.619 C103.7 108.619 103.7 88.819 103.7 88.819 C103.7 88.819 114.1 88.819 114.1 88.819 C114.1 88.819 124.5 88.819 124.5 88.819 C124.5 88.819 124.5 83.919 124.5 83.919 C124.5 83.919 124.5 79.019 124.5 79.019 C124.5 79.019 134.9 79.019 134.9 79.019 C134.9 79.019 145.3 79.019 145.3 79.019 C145.3 79.019 145.5 72.219 145.5 72.219 C145.6 66.019 145.7 65.219 146.9 62.819 C148.5 59.319 151.3 56.419 154.8 54.519 C157.6 53.019 157.9 52.919 162.6 52.919 C166.9 52.919 167.8 53.019 170.1 54.219 C173.6 55.819 176.7 59.019 178.4 62.719 C179.6 65.319 179.8 66.419 180.1 70.819 C180.1 70.819 180.3 75.819 180.3 75.819 C180.3 75.819 184.4 75.819 184.4 75.819 C188.3 75.819 188.5 75.819 188.7 74.719 C188.8 74.119 189.6 69.019 190.3 63.219 C190.3 63.219 191.7 52.719 191.7 52.719 C191.7 52.719 188.7 46.119 188.7 46.119 C183.8 35.419 183.4 35.119 165.5 32.119 C165.5 32.119 153 30.019 153 30.019 C153 30.019 147.1 25.619 147.1 25.619 C136.4 17.619 118.7 6.319 111.5 2.919 C105.7 0.119 104 -0.081 82.4 0.019 C68.5 0.019 61.8 0.219 59.6 0.619 Z M83.3 15.819 C83.6 19.719 83.9 23.219 83.9 23.619 C83.9 24.219 82.5 24.219 71.8 23.519 C65 23.019 56.2 22.519 52 22.319 C52 22.319 44.5 22.019 44.5 22.019 C44.5 22.019 43.8 20.419 43.8 20.419 C42.3 16.719 42.2 16.819 46.3 14.819 C56.6 9.619 60.1 8.819 73 8.819 C73 8.819 82.8 8.819 82.8 8.819 C82.8 8.819 83.3 15.819 83.3 15.819 Z M106 10.119 C107.4 10.719 111.5 12.919 115 15.019 C122 19.219 135.1 27.719 134.6 27.719 C133.4 27.719 93.7 24.919 93.3 24.719 C93 24.619 92.7 22.619 92.5 19.919 C92.4 17.419 92.1 13.819 91.9 11.919 C91.9 11.919 91.6 8.519 91.6 8.519 C91.6 8.519 97.6 8.719 97.6 8.719 C102.3 9.019 104 9.219 106 10.119 Z M38.1 53.619 C46.4 57.319 48.1 68.019 41.3 74.019 C38.7 76.419 36.7 77.119 33.2 77.219 C28.3 77.219 24.2 74.819 22 70.419 C19.5 65.619 20.7 58.919 24.8 55.619 C28.4 52.619 33.9 51.719 38.1 53.619 Z "
                  data-centerx="95.85"
                  data-centery="68.41"
                  stroke="none"
                  strokeWidth="0"
                  data-sw="0"
                  strokeOpacity="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fillOpacity="1"
                  fillRule="evenodd"
                  filter="none"
                  visibility="visible"
                  strokeDasharray="none"
                  markerStart="none"
                  markerEnd="none"
                  data-name="curve"
                  data-title="curve"
                  data-grad="0"
                  data-group="0"
                  data-edit="1"
                />
                <path
                  id="path6"
                  d="M181.932 53.786 C180.323 49.444 176.432 47.486 176.032 47.786 C175.332 48.386 174.732 48.286 172.332 47.386 C168.332 45.986 161.832 45.986 158.032 47.386 C142.432 52.986 137.932 72.386 149.532 83.786 C152.732 86.886 155.832 88.686 159.732 89.786 C170.532 92.586 182.032 86.386 186.032 75.786 C186.832 73.686 187.032 72.086 187.032 68.286 C187.032 62.886 186.232 59.986 183.432 55.986 C183.432 55.986 181.932 53.786 181.932 53.786 Z M171.032 57.486 C180.432 62.586 179.332 76.686 169.232 80.086 C161.732 82.586 153.632 77.586 152.632 69.686 C151.532 59.986 162.332 52.686 171.032 57.486 Z "
                  data-centerx="165.02"
                  data-centery="68.4"
                  stroke="none"
                  strokeWidth="0"
                  data-sw="0"
                  strokeOpacity="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fillOpacity="1"
                  fillRule="evenodd"
                  filter="none"
                  visibility="visible"
                  strokeDasharray="none"
                  markerStart="none"
                  markerEnd="none"
                  data-name="curve"
                  data-title="curve"
                  data-grad="0"
                  data-group="0"
                  data-edit="1"
                />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
