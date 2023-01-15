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
import useUpdate from '@app/hooks/useUpdate';
import {ItemBox} from './ItemBox';
import CircleNode from './CircleNode';
import CardNode from './CardNode';
import OvalNode from './OvalNode';

const fitViewOptions: FitViewOptions = {
  padding: 0.2
};

export function FlowCanvas(props: {
  nodeID: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const nodeTypes = React.useMemo(
    () => ({
      card: CardNode,
      circle: CircleNode,
      oval: OvalNode
    }),
    []
  );
  const {nodeID, open, setOpen} = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) +
    10000000000;
  const test = useSelector((state: RootState) =>
    state.uitgd.tests.find((t) => t.nodeID === nodeID)
  );
  const dispatch = useDispatch();
  const update = useUpdate();

  const onNodesChange = (changes: NodeChange[]) => {
    const needToUpdate = {_: false};
    changes.forEach((change) => {
      if (change.type === 'add' || change.type === 'reset') return;
      const item = test?.nodes[change.id];
      if (!item) return;
      if (change.type === 'select') {
        item.selected = change.selected;
        test.addNode(item);
        needToUpdate._ = true;
      } else if (change.type === 'position' && change.position) {
        item.position = {...change.position};
        test.addNode(item);
        needToUpdate._ = true;
      }
    });

    if (needToUpdate._) update();
  };

  const onEdgesChange = (changes: EdgeChange[]) => {};

  const onConnect = (connection: Connection) => {};

  const [variant, setVariant] = useState<BackgroundVariant>(
    BackgroundVariant.Lines
  );

  const [tempNode, setTempNode] = React.useState<Node | null>(null);
  useSelector((state: RootState) => {
    if (!state.uitgd.draggingNewTestFlowNode && tempNode) setTempNode(null);
    return false;
  });
  const [viewX, viewY, zoom] = useStore((state) => state.transform);
  const ref = React.useRef<HTMLDivElement>(null);

  if (!test) return null;
  const {nodes, edges} = test.getRFNodesAndEdges();

  const handleCancel = () => {
    setOpen(false);
  };
  const handleApply = () => {
    test.dispatch();
  };
  const handleOK = () => {
    handleApply();
    handleCancel();
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
            nodeTypes={nodeTypes}
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
        <Button onClick={handleApply} disabled={!test.changed}>
          Apply
        </Button>
        <Button onClick={handleOK} disabled={!test.changed}>
          OK
        </Button>
        <Button onClick={handleCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
