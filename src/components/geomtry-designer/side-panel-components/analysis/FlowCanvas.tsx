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
  useReactFlow,
  Controls,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  setDraggingNewTestFlowNode,
  setConfirmDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {className as STARTNODE} from '@gd/analysis/StartNode';
import {className as ENDNODE} from '@gd/analysis/EndNode';
import useUpdate from '@app/hooks/useUpdate';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {setFlowCanvasBackgroundVariant} from '@store/reducers/uiGeometryDesigner';
import {alpha} from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import {ItemBox} from './ItemBox';
import CircleNode from './CircleNode';
import CardNode from './CardNode';
import OvalNode from './OvalNode';
import arrangeNodes from './ArrangeNodes';

const fitViewOptions: FitViewOptions = {
  padding: 0.2
};

const nodeTypes = {
  card: CardNode,
  circle: CircleNode,
  oval: OvalNode
} as const;

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
  const variant = useSelector(
    (state: RootState) =>
      state.uigd.present.analysisPanelState.flowCanvasBackgroundVariant
  );

  const [tempNode, setTempNode] = React.useState<Node | null>(null);
  const draggingNewNode = useSelector((state: RootState) => {
    if (!state.uitgd.draggingNewTestFlowNode && tempNode) setTempNode(null);
    return !!state.uitgd.draggingNewTestFlowNode;
  });
  const [viewX, viewY, zoom] = useStore((state) => state.transform);
  const {fitView} = useReactFlow();
  const [dragging, setDragging] = React.useState(false);
  const [overDelete, setOverDelete] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const edgeUpdateSuccessful = React.useRef(true);

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
      } else {
        // console.log(change.type);
      }
    });

    if (needToUpdate._) update();
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    const needToUpdate = {_: false};
    changes.forEach((change) => {
      if (change.type === 'select') {
        const item = test?.edges[change.id];
        if (!item) return;
        item.selected = change.selected;
        needToUpdate._ = true;
      } else {
        console.log(change.type);
      }
    });

    if (needToUpdate._) update();
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    test?.tryConnect(connection.source, connection.target);
    update();
  };

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = (oldEdge: Edge, connection: Connection) => {
    const edge = test?.edges[oldEdge.id];
    if (!test || !edge) return;
    if (!connection.source || !connection.target) return;
    edgeUpdateSuccessful.current = true;
    if (!test.tryConnect(connection.source, connection.target)) return;
    test.removeEdge(edge);
    update();
  };

  const onEdgeUpdateEnd = (_: MouseEvent, edge: Edge) => {
    if (!edgeUpdateSuccessful.current && test) {
      test.removeEdge(edge);
      update();
    }
    edgeUpdateSuccessful.current = true;
  };

  const [onArrange, setOnArrange] = React.useState(false);
  React.useLayoutEffect(() => {
    fitView();
  }, [onArrange]);

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

  const handleClose = (_: any, reason: string) => {
    if (reason === 'escapeKeyDown') return;
    handleCancel();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
    const tmpNode = item.onDrop({x, y}, true).getRFNode();
    setTempNode(tmpNode);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const item = store.getState().uitgd.draggingNewTestFlowNode;
    if (!item || !ref.current) return;
    const {top, left} = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - viewX) / zoom;
    const y = (e.clientY - top - viewY) / zoom;
    test.addNode(item.onDrop({x, y}, false));
  };

  const handleDrag = () => {
    if (!dragging) setDragging(true);
  };

  const handleDragEnd = async (_: any, node: Node) => {
    setDragging(false);
    if (overDelete) {
      const item = test.nodes[node.id];
      if (item) {
        if (item.className === STARTNODE || item.className === ENDNODE) return;
        if (!item.isInitialState) {
          const ret = await new Promise<string>((resolve) => {
            dispatch(
              setConfirmDialogProps({
                zindex: zindex + 10000 + 1,
                onClose: resolve,
                title: 'Warning',
                message: `Once you delete a node, it cannot be restored.`,
                buttons: [
                  {text: 'OK', res: 'ok'},
                  {text: 'Cancel', res: 'cancel', autoFocus: true}
                ]
              })
            );
          });
          dispatch(setConfirmDialogProps(undefined));
          if (ret === 'ok') {
            test.removeNode(item);
            update();
          }
        } else {
          test.removeNode(item);
          update();
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const arrange = () => {
    arrangeNodes(test.startNode, test.nodes, Object.values(test.edges), 50, 50);
    setOnArrange((prev) => !prev);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');

  if (tempNode) nodes.push(tempNode);

  return (
    <Dialog
      TransitionProps={{unmountOnExit: true}}
      container={window}
      onClose={handleClose}
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
        <Box
          component="div"
          sx={{
            flexGrow: 1,
            border: '2px solid #aaa',
            '& .react-flow *': draggingNewNode
              ? {pointerEvents: 'none!important'}
              : undefined
          }}
        >
          <ReactFlow
            ref={ref}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={fitViewOptions}
            onKeyDown={handleKeyDown}
            onNodeDrag={handleDrag}
            onNodeDragStop={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{strokeWidth: 5}}
          >
            <Background color="#99b3ec" variant={variant} />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
            <Panel position="top-left">
              <Box component="div" sx={{backgroundColor: '#FFFFFF'}}>
                <Typography>Grid:</Typography>
                <Button
                  onClick={() =>
                    dispatch(
                      setFlowCanvasBackgroundVariant(BackgroundVariant.Dots)
                    )
                  }
                >
                  dots
                </Button>
                <Button
                  onClick={() =>
                    dispatch(
                      setFlowCanvasBackgroundVariant(BackgroundVariant.Lines)
                    )
                  }
                >
                  lines
                </Button>
                <Button
                  onClick={() =>
                    dispatch(
                      setFlowCanvasBackgroundVariant(BackgroundVariant.Cross)
                    )
                  }
                >
                  cross
                </Button>
                <Button onClick={arrange}>arrange</Button>
              </Box>
            </Panel>
            <Panel position="top-center" style={{width: '50%', margin: '0px'}}>
              <Fade in={dragging} unmountOnExit>
                <Box
                  component="div"
                  onMouseOver={() => {
                    setOverDelete(true);
                  }}
                  onMouseLeave={() => {
                    setOverDelete(false);
                  }}
                  sx={{
                    height: '20%',
                    p: 3,
                    borderRadius: '0% 0% 30px 30px',
                    bgcolor: alpha('#000', 0.7),
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha('#A00', 0.9),
                      color: 'white'
                    }
                  }}
                >
                  <DeleteForeverIcon fontSize="large" />
                  <Typography>Remove</Typography>
                </Box>
              </Fade>
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
