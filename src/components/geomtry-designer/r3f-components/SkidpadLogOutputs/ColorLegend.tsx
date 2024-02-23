import * as d3 from 'd3';
import {useEffect, useRef} from 'react';

type ColorLegendProps = {
  height: number;
  width: number;
  colorScale: d3.ScaleLinear<string, string, never>;
  legendSurfix?: string;
};

const COLOR_LEGEND_MARGIN = {top: 20, right: 30, bottom: 10, left: 8};

export const ColorLegend = ({
  height,
  colorScale,
  width,
  legendSurfix
}: ColorLegendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const boundsWidth =
    width - COLOR_LEGEND_MARGIN.right - COLOR_LEGEND_MARGIN.left;
  const boundsHeight =
    height - COLOR_LEGEND_MARGIN.top - COLOR_LEGEND_MARGIN.bottom;

  const domain = colorScale.domain();
  const max = domain[domain.length - 1];
  const yScale = d3.scaleLinear().range([0, boundsHeight]).domain([0, max]);

  const allTicks = yScale.ticks(6).map((tick) => {
    return (
      <>
        <line
          x1={-10}
          x2={boundsWidth}
          y1={yScale(tick)}
          y2={yScale(tick)}
          stroke="#ccc"
        />
        <text
          x={-15}
          y={yScale(tick)}
          fontSize={12}
          textAnchor="end"
          fontFamily='"Roboto","Helvetica","Arial",sans-serif'
          stroke="#ccc"
        >
          {max - tick}
          {legendSurfix || null}
        </text>
      </>
    );
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!context) {
      return;
    }

    for (let i = 0; i < boundsHeight; ++i) {
      context.fillStyle = colorScale((max * i) / boundsHeight);
      context.fillRect(0, boundsHeight - i - 1, boundsWidth, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, colorScale]);

  return (
    <div style={{width, height, color: '#ccc'}}>
      <div
        style={{
          position: 'relative',
          transform: `translate(${COLOR_LEGEND_MARGIN.left}px,
            ${COLOR_LEGEND_MARGIN.top}px`
        }}
      >
        <canvas ref={canvasRef} width={boundsWidth} height={boundsHeight} />
        <svg
          width={boundsWidth}
          height={boundsHeight}
          style={{position: 'absolute', top: 0, left: 0, overflow: 'visible'}}
        >
          {allTicks}
        </svg>
      </div>
    </div>
  );
};
