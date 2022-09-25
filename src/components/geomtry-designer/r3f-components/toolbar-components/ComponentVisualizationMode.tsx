import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';

import {RootState} from '@store/store';

export default function Assemble() {
  const visualizationMode = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.componentVisualizationMode
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    if (visualizationMode === 'ShowAllNodes')
      dispatch(setComponentVisualizationMode('WireFrameOnly'));
    if (visualizationMode === 'WireFrameOnly')
      dispatch(setComponentVisualizationMode('ShowAllNodes'));
  };

  return (
    <Tooltip
      title={
        visualizationMode === 'ShowAllNodes'
          ? 'Wire Frame Only'
          : 'Show All Nodes'
      }
      componentsProps={{
        popper: {
          sx: {
            zIndex: 12500000000
          }
        }
      }}
    >
      <IconButton sx={{padding: 0.5}} onClick={handleOnClick}>
        <SvgIcon sx={{color: '#cccccc'}}>
          {visualizationMode === 'ShowAllNodes' ? (
            // ノードを表示しないアイコン
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
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
                <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)">
                  <path d="M1292.5,3827.5L100,2637v-3661.6v-3661.6l47.9-45.9l45.9-47.9h3661.6H7517l1190.5,1192.5L9900-2397v3661.6v3661.6l-47.9,45.9l-45.9,47.9H6144.6H2483L1292.5,3827.5z M8359.2,3718.4L7383,2742.3H5053.6H2722.3v976.2v976.2h3305.6h3307.5L8359.2,3718.4z M2377.7,3594v-851.8h-855.6H664.6l851.8,851.8c468.9,468.9,853.7,851.8,855.6,851.8C2375.8,4445.8,2377.7,4063,2377.7,3594z M9574.6,1144v-3301.8h-976.2h-976.2V171.7V2503l970.4,970.4c535.9,535.9,974.2,972.3,976.2,972.3C9572.7,4445.8,9574.6,2960.5,9574.6,1144z M2377.7,66.4V-2263l-976.2-976.2l-976.2-976.2v3307.5v3305.6h976.2h976.2V66.4z M7277.7,120v-2277.7H5000H2722.3V120v2277.7H5000h2277.7V120z M7277.7-3478.4v-976.2H3972.1H664.6l976.2,976.2l976.2,976.2h2329.4h2331.3V-3478.4z M9325.8-2508c0-1.9-382.8-386.6-851.8-855.6l-851.8-851.8v857.5v855.6H8474C8943-2502.3,9325.8-2504.2,9325.8-2508z" />
                </g>
              </g>
            </svg>
          ) : (
            // ノードを表示するアイコン
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
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
                <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)">
                  <path d="M2345.2,4995.9c-157.1-44.1-253-99.7-369.9-218.5c-245.3-245.3-308.6-599.9-162.9-916.1l47.9-107.3L1659.1,3549c-182.1-185.9-201.2-210.8-201.2-276c0-92,69-164.8,155.2-164.8c51.7,0,92,30.7,274.1,210.8l212.7,208.9l55.6-34.5c30.7-21.1,92-47.9,138-59.4l84.3-24.9v-504v-505.9h-107.3c-130.3,0-170.6-19.2-197.4-97.7c-46-130.3,53.7-228.1,230-228.1h72.8l5.8-1401l5.7-1400.9l53.7-46c69-59.4,149.5-59.4,218.5,0l53.7,46l5.7,1400.9l5.8,1401l1801.5-3.8l1803.4-5.7l34.5-99.7c69-195.5,214.6-356.5,408.2-452.3c492.5-239.6,1077.1,69,1165.2,617.1c67.1,425.5-251.1,852.8-688,921.8c-333.5,53.7-691.9-130.3-843.3-433.1c-30.7-63.2-61.3-136.1-69-164.8l-11.5-53.7H4524.2H2722.7v504v506l82.4,24.9c122.7,36.4,228.1,105.4,335.4,216.6c101.6,109.2,149.5,189.7,185.9,310.5l23,76.7l2253.8,9.6l2253.8,9.6l44.1,42.2c26.8,28.8,42.2,67.1,42.2,111.2c0,44.1-15.3,82.4-42.2,111.2l-44.1,42.2l-2251.9,9.6l-2253.8,9.6l-34.5,101.6c-74.7,208.9-266.4,404.4-473.4,483C2699.7,5020.8,2479.3,5034.3,2345.2,4995.9z M2705.5,4670.1c197.4-67.1,329.6-251.1,327.7-460c0-136.1-32.6-224.2-120.7-325.8c-189.7-216.6-532.8-214.7-728.3,3.8C1854.6,4252.3,2239.8,4829.2,2705.5,4670.1z M7331.9,2686.6c333.5-141.8,381.4-634.4,80.5-837.5c-103.5-69-251.1-107.3-360.3-90.1c-258.7,42.2-460,329.6-404.4,578.8C6718.6,2652.1,7036.8,2813.1,7331.9,2686.6z" />
                  <path d="M8874.7,4995.9c-224.2-63.2-412-222.3-519.4-440.8c-61.3-126.5-65.2-143.7-65.2-345c0-191.7,5.8-220.4,55.6-331.6l55.6-120.7l-184-185.9c-101.6-101.6-193.6-210.8-203.2-239.6c-46-122.7,80.5-251.1,203.2-203.1c28.8,9.6,136.1,101.6,239.6,203.1l185.9,184l111.2-47.9c61.3-26.8,126.5-53.7,145.6-59.4c30.7-11.5,32.6-128.4,32.6-2092.8V-765l47.9-46c78.6-80.5,201.2-59.4,254.9,42.2c17.3,30.7,23,573,23,2108.1v2067.9l82.4,21.1c132.2,36.4,310.5,164.8,404.4,293.2c118.8,162.9,155.2,276,155.2,498.3c0,164.8-5.7,193.6-61.3,312.4c-84.3,176.3-228.1,323.9-400.5,408.2c-116.9,59.4-162.9,70.9-299,76.7C9033.7,5022.8,8945.6,5015.1,8874.7,4995.9z M9307.8,4645.2c172.5-88.2,264.5-241.5,266.4-435c0-113.1-9.6-149.5-55.6-235.7c-193.6-348.8-699.5-335.4-866.2,24.9c-126.5,268.3,9.6,580.7,295.1,674.6C9043.3,4706.5,9215.8,4693.1,9307.8,4645.2z" />
                  <path d="M771.8,3048.8c-421.6-70.9-734-506-661.2-925.7c51.7-306.6,276-573,548.1-653.5l80.5-23l9.6-2090.9l9.6-2090.9l42.2-44.1c63.2-63.2,170.6-57.5,228.1,11.5l46,51.7v2077.5V1437l88.2,30.7c218.5,74.7,431.2,270.2,506,465.7c53.7,136.1,70.9,371.8,40.2,498.3c-59.4,231.9-241.5,458-446.5,551.9c-88.2,40.2-310.5,90.1-369.9,84.3C882.9,3066,827.3,3058.4,771.8,3048.8z M1105.2,2696.1c161-65.2,295.1-264.5,295.1-438.9c0-139.9-36.4-235.7-128.4-337.3c-249.1-276-699.5-184-818.3,168.6C317.5,2483.4,714.3,2853.3,1105.2,2696.1z" />
                  <path d="M7021.4,1049.9l-53.7-46L6962-416.2l-3.8-1420.1H5154.8c-1698,0-1801.5,1.9-1811.1,34.5c-111.2,331.5-346.9,542.4-665,597.9c-433.1,76.7-856.7-230-935.3-678.4c-26.8-153.3-3.8-308.6,69-467.6l47.9-105.4l-201.2-205.1c-182.1-185.9-201.2-210.8-201.2-276c0-92,69-164.8,157.2-164.8c53.7,0,90.1,28.8,268.3,205.1l205.1,203.1l115-51.7c463.8-207,973.6,23,1130.7,511.7l24.9,70.9h1799.6h1799.6v-504v-504l-103.5-32.6c-214.6-69-421.6-281.7-502.1-515.5c-51.8-147.6-46-392.9,11.5-538.5c78.6-207,264.5-392.9,473.4-475.3c157.2-63.3,427.4-61.3,586.4,0c348.8,136.1,569.2,515.5,509.8,881.6c-47.9,304.7-256.8,555.8-542.4,653.5l-97.7,32.6v496.4v496.4l283.6,9.6c270.2,9.6,287.5,11.5,322,55.6c49.8,61.3,46,141.8-9.6,207c-46,53.7-46,53.7-325.8,59.4l-279.8,5.8v1425.9v1425.9l-49.8,38.3C7167.1,1109.3,7086.6,1105.5,7021.4,1049.9z M2789.8-1585.3c279.8-155.2,331.5-540.4,101.6-770.4c-231.9-230-632.4-162.9-776.2,130.3c-139.9,285.5,17.3,619,325.8,697.6C2538.8-1502.9,2686.3-1527.8,2789.8-1585.3z M7287.8-3507.5c99.7-28.7,231.9-147.6,283.6-253c55.6-116.9,55.6-281.7-1.9-412.1c-95.8-224.2-364.1-341.1-594.1-260.6c-253,90.1-387.1,343-314.3,596c24.9,90.1,51.7,132.2,130.3,208.9c55.6,53.7,130.3,107.3,166.7,118.8C7048.3-3480.7,7195.8-3478.8,7287.8-3507.5z" />
                  <path d="M8932.2-1203.9c-239.6-49.8-471.4-233.8-578.8-458c-105.4-218.5-93.9-548.1,23-741.7l36.4-57.5L8134.9-2739c-153.3-151.4-287.5-295.2-297.1-320.1c-42.2-107.3,76.7-233.8,193.6-205.1c26.8,7.7,172.5,136.1,327.7,289.4l277.9,277.9l105.4-47.9c345-159.1,747.4-63.2,987,231.9c122.7,149.5,168.7,285.5,168.7,504c1.9,279.8-86.3,463.8-308.6,643.9C9419-1225,9148.7-1159.8,8932.2-1203.9z M9309.7-1570c46-23,111.2-74.7,147.6-116.9c279.8-325.8,53.7-804.9-375.6-803c-143.7,0-258.7,53.7-356.5,164.8c-166.7,189.7-161,456.1,15.3,645.9C8891.9-1514.4,9106.6-1472.2,9309.7-1570z" />
                  <path d="M658.7-3193.2C503.5-3248.8,354-3358,262-3484.5c-118.8-162.9-155.2-276-155.2-498.3c0-164.8,5.7-193.6,61.3-312.4c84.3-178.2,226.1-323.9,406.3-412.1c136.1-67.1,153.3-70.9,325.8-70.9c222.3,0,337.3,36.4,496.4,153.3c126.5,92,262.6,277.9,297.1,406.3l21.1,82.4h2067.9c1535.1,0,2077.5,5.7,2108.1,23c101.6,53.7,122.7,176.3,42.2,254.9l-46,47.9H3796c-2025.7,0-2089,1.9-2089,36.4c0,19.2-30.7,95.8-67.1,168.6c-82.4,166.7-214.7,293.2-389,375.6c-111.2,51.8-153.3,61.3-310.5,65.2C800.5-3158.7,735.3-3166.4,658.7-3193.2z M1122.5-3530.5c168.6-78.6,277.9-247.2,276-433.1c0-197.4-84.3-339.2-251.1-433.1c-132.2-70.9-325.8-78.6-446.5-13.4c-279.8,149.5-358.4,483-172.5,735.9C658.7-3494.1,913.6-3432.8,1122.5-3530.5z" />
                </g>
              </g>
            </svg>
          )}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
