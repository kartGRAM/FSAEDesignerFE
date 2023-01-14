/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
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
  useStore,
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import {setDraggingNewTestFlowNode} from '@store/reducers/uiTempGeometryDesigner';
import {ItemBox} from './ItemBox';

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
  const dispatch = useDispatch();

  const onNodesChange = (changes: NodeChange[]) => {};

  const onEdgesChange = (changes: EdgeChange[]) => {};

  const onConnect = (connection: Connection) => {};

  const [variant, setVariant] = useState<BackgroundVariant>(
    BackgroundVariant.Lines
  );

  const [tempNode, setTempNode] = React.useState<Node | null>(null);
  const [viewX, viewY, zoom] = useStore((state) => state.transform);
  const ref = React.useRef<HTMLDivElement>(null);

  if (!test) return null;
  const {nodes, edges} = test.getRFNodesAndEdges();

  const handleOK = () => {
    setOpen(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const item = store.getState().uitgd.draggingNewTestFlowNode;
    if (!item || !ref.current) {
      setTempNode(null);
      return;
    }
    const {top, left} = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - viewX) / zoom;
    const y = (e.clientY - top - viewY) / zoom;
    if (tempNode) {
      setTempNode((prev) => (prev ? {...prev, position: {x, y}} : null));
      return;
    }
    const tmpNode = item.onDrop({x, y}).getRFNode();
    setTempNode(tmpNode);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const item = store.getState().uitgd.draggingNewTestFlowNode;
    if (!item || !ref.current) return;
    const {top, left} = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - viewX) / zoom;
    const y = (e.clientY - top - viewY) / zoom;
    test.addNode(item.onDrop({x, y}));
    dispatch(setDraggingNewTestFlowNode(null));
    setTempNode(null);
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');

  if (tempNode) nodes.push(tempNode);

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
            ref={ref}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={fitViewOptions}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
