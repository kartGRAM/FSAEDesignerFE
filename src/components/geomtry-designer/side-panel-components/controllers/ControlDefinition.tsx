import React from 'react';
import {IControl} from '@gd/IControls';

export interface ControlDefinitionProps {
  control: IControl;
}

export function ControlDefinition(props: ControlDefinitionProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {control} = props;
  return <span />;
}
