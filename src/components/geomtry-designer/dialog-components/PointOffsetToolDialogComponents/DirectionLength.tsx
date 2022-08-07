import * as React from 'react';
import Box from '@mui/material/Box';
import {DirectionLength as Tool, getDummyVector3} from '@gd/NamedValues';

interface Props {
  name: string;
  tool?: Tool;
}
export const DirectionLength = (props: Props) => {
  const {name, tool: toolProps} = props;
  const tool =
    toolProps ??
    new Tool({
      value: {
        name,
        nx: 1,
        ny: 0,
        nz: 0,
        l: 0
      },
      parent: getDummyVector3()
    });
  return <Box>DirectionLength{tool.name}</Box>;
};
