import * as React from 'react';
import {Box, Typography} from '@mui/material';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {alpha} from '@mui/material/styles';
import {useAnimationFrame} from '@hooks/useAnimationFrame';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import * as d3 from 'd3';
import useUpdate from '@hooks/useUpdate';
import {range, jetMap, numberToRgb} from '@utils/helpers';
import {ColorLegend} from './ColorLegend';

export function SkidpadLogOutputs() {
  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );
  const showLapTime = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState.showLapTime
  );
  const lapTimeRef = React.useRef<HTMLHeadingElement>(null);

  const showInnerRadius = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState.showInnerRadius
  );
  const innerRadiusRef = React.useRef<HTMLHeadingElement>(null);

  const showCenterRadius = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState.showCenterRadius
  );
  const centerRadiusRef = React.useRef<HTMLHeadingElement>(null);

  const showVelocity = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState.showVelocity
  );
  const velocityRef = React.useRef<HTMLHeadingElement>(null);

  const showOmega = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState.showOmega
  );
  const omegaRef = React.useRef<HTMLHeadingElement>(null);

  const showColorBar = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.forceViewerState.showColorBar
  );

  const stdRef = React.useRef(0);
  const update = useUpdate();

  useAnimationFrame(() => {
    if (!solver || !isSkidpadSolver(solver)) return;
    if (lapTimeRef.current)
      lapTimeRef.current.innerText = `${solver.state.lapTime?.toFixed(3)} s`;
    if (innerRadiusRef.current)
      innerRadiusRef.current.innerText = `${solver.state.rMin?.toFixed(3)} m`;
    if (centerRadiusRef.current)
      centerRadiusRef.current.innerText = `${solver.state.r?.toFixed(3)} m`;
    if (velocityRef.current)
      velocityRef.current.innerText = `${solver.state.v?.toFixed(3)} m/s`;
    if (omegaRef.current)
      omegaRef.current.innerText = `${solver.state.omega?.toFixed(3)} rad/s`;
    if (solver.state.stdForce !== stdRef.current) update();
  });

  if (!solver || !isSkidpadSolver(solver)) return null;
  stdRef.current = solver.state.stdForce;
  const division = 30;
  const colorScale = d3
    .scaleLinear<string>()
    .domain(range(0, division + 1).map((i) => (i / division) * stdRef.current))
    .range(
      range(0, division + 1).map((i) => {
        const c = jetMap((i / division) * stdRef.current, 0, stdRef.current);
        return numberToRgb(c.r * 256 * 256 + c.g * 256 + c.b);
      })
    );

  return (
    <Box
      component="div"
      sx={{
        position: 'absolute',
        right: 0,
        top: 32,
        zIndex: 1
      }}
    >
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'end',
          background: alpha('#FFFFFF', 0)
        }}
      >
        <Box
          component="div"
          sx={{
            color: '#CCC',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '24px!important',
            justifyContent: 'start',
            background: alpha('#FFFFFF', 0)
          }}
        >
          {showLapTime ? (
            <Typography variant="h6" gutterBottom>
              Lap Time
            </Typography>
          ) : null}
          {showInnerRadius ? (
            <Typography variant="h6" gutterBottom>
              Inner Radius
            </Typography>
          ) : null}
          {showCenterRadius ? (
            <Typography variant="h6" gutterBottom>
              Center Radius
            </Typography>
          ) : null}
          {showVelocity ? (
            <Typography variant="h6" gutterBottom>
              Velocity
            </Typography>
          ) : null}
          {showOmega ? (
            <Typography variant="h6" gutterBottom>
              Angular Vel.
            </Typography>
          ) : null}
        </Box>
        <Box
          component="div"
          sx={{
            pl: 1,
            pr: 0.5,
            color: '#CCC',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '24px!important',
            justifyContent: 'start',
            background: alpha('#FFFFFF', 0)
          }}
        >
          {showLapTime ? (
            <Typography variant="h6" gutterBottom ref={lapTimeRef} />
          ) : null}
          {showInnerRadius ? (
            <Typography variant="h6" gutterBottom ref={innerRadiusRef} />
          ) : null}
          {showCenterRadius ? (
            <Typography variant="h6" gutterBottom ref={centerRadiusRef} />
          ) : null}
          {showVelocity ? (
            <Typography variant="h6" gutterBottom ref={velocityRef} />
          ) : null}
          {showOmega ? (
            <Typography variant="h6" gutterBottom ref={omegaRef} />
          ) : null}
        </Box>
      </Box>
      {showColorBar ? (
        <Box
          component="div"
          sx={{display: 'flex', justifyContent: 'end', flexDirection: 'row'}}
        >
          <ColorLegend
            width={60}
            height={300}
            colorScale={colorScale}
            legendSurfix=" N"
          />
        </Box>
      ) : null}
    </Box>
  );
}

export default SkidpadLogOutputs;
