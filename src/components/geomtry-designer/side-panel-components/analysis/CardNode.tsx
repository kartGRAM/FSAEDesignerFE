import * as React from 'react';
import {Handle, Position} from 'reactflow';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

export type CardNodeProps = {
  data: {
    label: JSX.Element | string;
    content?: JSX.Element;
    useDialog: () => [
      JSX.Element | null,
      React.Dispatch<React.SetStateAction<boolean>>
    ];
    source?: boolean;
    target?: boolean;
  };
  selected?: boolean;
};

export default function CardNode(props: CardNodeProps) {
  const {data, selected} = props;
  const {label, source, target, content, useDialog} = data;
  const [dialog, setOpen] = useDialog();
  const handleDoubleClick = () => {
    setOpen(true);
  };
  return (
    <>
      <Card raised={selected} onDoubleClick={handleDoubleClick}>
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
      {dialog}
    </>
  );
}
