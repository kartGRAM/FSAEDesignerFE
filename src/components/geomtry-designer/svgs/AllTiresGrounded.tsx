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
          <SvgIcon sx={{color: '#ccc'}}>
            <svg
              id="exportSVG"
              visibility="visible"
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              data-info="draw.ninja"
              data-name="draw"
              viewBox="0 0 190 190"
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
                height="190"
                fill="none"
                fillOpacity="0"
                stroke="none"
                strokeWidth="0"
              />
              <g id="objectsExport" visibility="visible">
                <path
                  id="path4"
                  d="M59 73.469 C53 74.569 48.4 76.569 31.2 85.269 C31.2 85.269 14 93.969 14 93.969 C14 93.969 9.8 93.969 9.8 93.969 C6.2 93.969 5.6 94.069 5.4 94.769 C5.3 95.269 4.8 98.569 4.2 102.269 C3.3 108.669 3.1 109.069 1.3 111.669 C1.3 111.669 -0.6 114.469 -0.6 114.469 C-0.6 114.469 0.5 123.969 0.5 123.969 C1.1 129.169 1.8 133.869 2.1 134.469 C2.5 135.069 4.5 136.869 6.7 138.669 C9.9 141.269 10.8 142.169 11.2 143.669 C12.1 146.869 14 150.069 16.8 152.969 C21.7 157.969 26.6 159.869 33.9 159.569 C37.8 159.369 38.8 159.169 41.8 157.769 C43.6 156.869 46.2 155.169 47.5 154.069 C47.5 154.069 49.9 151.869 49.9 151.869 C49.9 151.869 58.3 151.869 58.3 151.869 C123.9 151.869 134.3 151.869 134.3 151.869 C134.3 151.869 144.7 151.869 144.7 151.869 C144.7 151.869 144.9 145.069 144.9 145.069 C145 138.869 145.1 138.069 146.3 135.669 C147.9 132.169 150.7 129.269 154.2 127.369 C157 125.869 157.3 125.769 162 125.769 C166.3 125.769 167.2 125.869 169.5 127.069 C173 128.669 176.1 131.869 177.8 135.569 C179 138.169 179.2 139.269 179.5 143.669 C179.5 143.669 179.7 148.669 179.7 148.669 C179.7 148.669 183.8 148.669 183.8 148.669 C187.7 148.669 187.9 148.669 188.1 147.569 C188.2 146.969 189 141.869 189.7 136.069 C189.7 136.069 191.1 125.569 191.1 125.569 C191.1 125.569 188.1 118.969 188.1 118.969 C183.2 108.269 182.8 107.969 164.9 104.969 C164.9 104.969 152.4 102.869 152.4 102.869 C152.4 102.869 146.5 98.469 146.5 98.469 C135.8 90.469 118.1 79.169 110.9 75.769 C105.1 72.969 103.4 72.769 81.8 72.869 C67.9 72.869 61.2 73.069 59 73.469 Z M82.7 88.669 C83 92.569 83.3 96.069 83.3 96.469 C83.3 97.069 81.9 97.069 71.2 96.369 C64.4 95.869 55.6 95.369 51.4 95.169 C51.4 95.169 43.9 94.869 43.9 94.869 C43.9 94.869 43.2 93.269 43.2 93.269 C41.7 89.569 41.6 89.669 45.7 87.669 C56 82.469 59.5 81.669 72.4 81.669 C72.4 81.669 82.2 81.669 82.2 81.669 C82.2 81.669 82.7 88.669 82.7 88.669 Z M105.4 82.969 C106.8 83.569 110.9 85.769 114.4 87.869 C121.4 92.069 134.5 100.569 134 100.569 C132.8 100.569 93.1 97.769 92.7 97.569 C92.4 97.469 92.1 95.469 91.9 92.769 C91.8 90.269 91.5 86.669 91.3 84.769 C91.3 84.769 91 81.369 91 81.369 C91 81.369 97 81.569 97 81.569 C101.7 81.869 103.4 82.069 105.4 82.969 Z M37.5 126.469 C45.8 130.169 47.5 140.869 40.7 146.869 C38.1 149.269 36.1 149.969 32.6 150.069 C27.7 150.069 23.6 147.669 21.4 143.269 C18.9 138.469 20.1 131.769 24.2 128.469 C27.8 125.469 33.3 124.569 37.5 126.469 Z "
                  data-centerx="95.25"
                  data-centery="116.22"
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
                  d="M176.932 123.536 C175.323 119.194 171.432 117.236 171.032 117.536 C170.332 118.136 169.732 118.036 167.332 117.136 C163.332 115.736 156.832 115.736 153.032 117.136 C137.432 122.736 132.932 142.136 144.532 153.536 C147.732 156.636 150.832 158.436 154.732 159.536 C165.532 162.336 177.032 156.136 181.032 145.536 C181.832 143.436 182.032 141.836 182.032 138.036 C182.032 132.636 181.232 129.736 178.432 125.736 C178.432 125.736 176.932 123.536 176.932 123.536 Z M166.032 127.236 C175.432 132.336 174.332 146.436 164.232 149.836 C156.732 152.336 148.632 147.336 147.632 139.436 C146.532 129.736 157.332 122.436 166.032 127.236 Z "
                  data-centerx="160.02"
                  data-centery="138.15"
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
                  id="path9"
                  stroke="#ccc"
                  visibility="visible"
                  strokeWidth="20"
                  strokeOpacity="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="none"
                  markerStart="none"
                  markerEnd="none"
                  fill="none"
                  fillRule="evenodd"
                  fillOpacity="1"
                  data-name="curve"
                  data-title="curve"
                  data-sw="20"
                  data-grad="0"
                  data-group="0"
                  data-edit="1"
                  filter="none"
                  d="M180.25 168.75 L9 169.25 "
                  data-centerx="94.625"
                  data-centery="169"
                />
                <path
                  id="path12"
                  d="M77.405 6.6 L114.576 6.6 L114.576 38.291 L145.1 38.622 L95.991 66.45 L46.55 38.622 L77.405 38.952 L77.405 6.6 Z "
                />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
