import * as React from 'react';
import {Handle, Position} from 'reactflow';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import {WarningBadge, ErrorBadge, CompletedBadge} from './Badge';

export type CardNodeProps = {
  data: {
    label: JSX.Element | string;
    content?: JSX.Element;
    useDialog: () => [
      JSX.Element | null,
      React.Dispatch<React.SetStateAction<boolean>>
    ];
    warning: boolean;
    completed: boolean;
    error: boolean;
    source?: boolean;
    target?: boolean;
    backgroundColor?: string;
    dialogDisabled?: boolean;
  };
  selected?: boolean;
};

export const CardNode = React.memo((props: CardNodeProps) => {
  const {data, selected} = props;
  const {
    label,
    source,
    target,
    content,
    useDialog,
    error,
    completed,
    warning,
    backgroundColor,
    dialogDisabled
  } = data;
  const [dialog, setOpen] = useDialog();
  const handleDoubleClick = () => {
    if (!dialogDisabled) setOpen(true);
  };
  return (
    <>
      <CompletedBadge invisible={!completed}>
        <WarningBadge invisible={!warning}>
          <ErrorBadge invisible={!error}>
            <Card
              raised={selected}
              onDoubleClick={handleDoubleClick}
              sx={{backgroundColor}}
            >
              <CardHeader title={label} />
              <CardContent>{content}</CardContent>
            </Card>
          </ErrorBadge>
        </WarningBadge>
      </CompletedBadge>
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
});
export default CardNode;
