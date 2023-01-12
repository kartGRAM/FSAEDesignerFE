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
  addEdge,
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
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {id: '1', data: {label: 'Node 1'}, position: {x: 5, y: 5}},
  {id: '2', data: {label: 'Node 2'}, position: {x: 5, y: 100}}
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

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [variant, setVariant] = useState<BackgroundVariant>(
    BackgroundVariant.Lines
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  if (!test) return null;

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
      <DialogTitle sx={{marginRight: 0}}>{test.name}</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOK}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
