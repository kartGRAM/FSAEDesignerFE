/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {DialogContent} from '@mui/material';
import {useState, useCallback} from 'react';
import ReactFlow, {
  FitViewOptions,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Background,
  BackgroundVariant,
  Panel,
  MiniMap,
  Position,
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import {ItemBox} from './ItemBox';

const initialNodes: Node[] = [
  {
    id: '1',
    data: {label: 'Node 1'},
    position: {x: 5, y: 5},
    targetPosition: Position.Left,
    sourcePosition: Position.Right
  },
  {
    id: '2',
    data: {label: 'Node 2'},
    position: {x: 5, y: 100},
    targetPosition: Position.Left,
    sourcePosition: Position.Right
  }
];

const initialEdges: Edge[] = [{id: 'e1-2', source: '1', target: '2'}];
const fitViewOptions: FitViewOptions = {
  padding: 0.2
};

export function FlowCanvas(props: {
  nodeID: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const {nodeID, open, setOpen} = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) +
    10000000000;
  const test = useSelector((state: RootState) =>
    state.uitgd.tests.find((t) => t.nodeID === nodeID)
  );

  const onNodesChange = (changes: NodeChange[]) => {};

  const onEdgesChange = (changes: EdgeChange[]) => {};

  const onConnect = (connection: Connection) => {};

  const [variant, setVariant] = useState<BackgroundVariant>(
    BackgroundVariant.Lines
  );

  if (!test) return null;

  const {nodes, edges} = test.getRFNodesAndEdges();

  const handleOK = () => {
    setOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');

  return (
    <Dialog
      TransitionProps={{unmountOnExit: true}}
      container={window}
      onClose={handleOK}
      open={open}
      maxWidth={false}
      aria-labelledby="draggable-dialog-title"
      sx={{
        position: 'absolute',
        zIndex: `${zindex}!important`,
        overflow: 'hidden'
      }}
      PaperProps={{
        sx: {width: 'calc(100% - 10rem)', height: 'calc(100% - 10rem)'}
      }}
    >
      <DialogTitle sx={{pb: 0}}>{test.name}</DialogTitle>
      <DialogTitle sx={{pt: 0, lineHeight: 0.2}}>
        <Typography variant="caption">{test.description}</Typography>
      </DialogTitle>
      <DialogContent sx={{display: 'flex', flexDirection: 'row'}}>
        <ItemBox />
        <Box component="div" sx={{flexGrow: 1, border: '2px solid #aaa'}}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={fitViewOptions}
          >
            <Background color="#99b3ec" variant={variant} />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
            <Panel position="top-left">
              <Box component="div" sx={{backgroundColor: '#FFFFFF'}}>
                <Typography>Grid:</Typography>
                <Button onClick={() => setVariant(BackgroundVariant.Dots)}>
                  dots
                </Button>
                <Button onClick={() => setVariant(BackgroundVariant.Lines)}>
                  lines
                </Button>
                <Button onClick={() => setVariant(BackgroundVariant.Cross)}>
                  cross
                </Button>
              </Box>
            </Panel>
            <Controls />
          </ReactFlow>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOK}>Apply</Button>
        <Button onClick={handleOK}>OK</Button>
        <Button onClick={handleOK}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
