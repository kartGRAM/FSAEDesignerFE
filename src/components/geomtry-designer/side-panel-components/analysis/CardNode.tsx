import * as React from 'react';
import {Handle, Position} from 'reactflow';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

export default function CardNode(props: {
  data: {
    label: JSX.Element;
    content?: JSX.Element;
    source?: boolean;
    target?: boolean;
  };
  selected: boolean;
}) {
  const {data, selected} = props;
  const {label, source, target, content} = data;
  return (
    <>
      <Card raised={selected}>
        <CardHeader title={label} />
        <CardContent>{content}</CardContent>
      </Card>
      {target ? (
        <Handle
          position={Position.Left}
          type="target"
          style={{width: '12px', height: '12px', left: '-6px'}}
        />
      ) : null}
      {source ? (
        <Handle
          position={Position.Right}
          type="source"
          style={{width: '12px', height: '12px', right: '-6px'}}
        />
      ) : null}
    </>
  );
}
