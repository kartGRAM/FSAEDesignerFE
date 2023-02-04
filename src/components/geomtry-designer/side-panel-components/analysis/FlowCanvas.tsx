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
import {useCallback} from 'react';
import ReactFlow, {
  XYPosition,
  FitViewOptions,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Background,
  BackgroundVariant,
  Panel,
  MiniMap,
  useStore,
  useReactFlow,
  Controls,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  setConfirmDialogProps,
  setAllUIDisabled
} from '@store/reducers/uiTempGeometryDesigner';
import {className as STARTNODE} from '@gd/analysis/StartNode';
import {className as ENDNODE} from '@gd/analysis/EndNode';
import useUpdate from '@app/hooks/useUpdate';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {setFlowCanvasBackgroundVariant} from '@store/reducers/uiGeometryDesigner';
import {alpha} from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import {IFlowNode, IDataEdge} from '@gd/analysis/FlowNode';
import {
  convertJsonToClipboardFlowNodes,
  getFlowNodesFromClipboard,
  getJsonFromClipboardFlowNodes,
  getRFFlowNodesFromClipboard
} from '@gd/analysis/ClipboardFlowNode';
import {ItemBox} from './ItemBox';
import CircleNode from './CircleNode';
import CardNode from './CardNode';
import OvalNode from './OvalNode';
import CustomSmoothStepEdge from './CustomSmoothStepEdge';

const fitViewOptions: FitViewOptions = {
  padding: 0.2
};

const nodeTypes = {
  card: CardNode,
  circle: CircleNode,
  oval: OvalNode
} as const;

const edgeTypes = {
  default: CustomSmoothStepEdge
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

  const [tempNodes, setTempNodes] = React.useState<{
    nodes: Node[];
    edges: Edge[];
  }>({nodes: [], edges: []});
  const [pasting, setPasting] = React.useState(false);
  const draggingNewNode = useSelector(
    (state: RootState) => !!state.uitgd.draggingNewTestFlowNode
  );
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
        // console.log(change.type);
      }
    });

    if (needToUpdate._) update();
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    test?.tryConnect(connection.source, connection.target);
    test?.saveLocalState();
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
      test.saveLocalState();
      update();
    }
    edgeUpdateSuccessful.current = true;
  };

  const [onArrange, setOnArrange] = React.useState(false);

  React.useEffect(() => {
    dispatch(setAllUIDisabled(true));
    return () => {
      dispatch(setAllUIDisabled(false));
    };
  }, []);

  React.useEffect(() => {
    fitView();
  }, [onArrange]);

  React.useEffect(() => {
    if (dragging === false && overDelete) setOverDelete(false);
  }, [dragging, overDelete]);

  if (tempNodes.nodes.length && !pasting && !draggingNewNode)
    setTempNodes({nodes: [], edges: []});
  if (!test) return null;
  const {nodes, edges} = test.getRFNodesAndEdges();

  const handleCancel = async () => {
    if (test.changed) {
      const ret = await new Promise<string>((resolve) => {
        dispatch(
          setConfirmDialogProps({
            zindex: zindex + 10000 + 1,
            onClose: resolve,
            title: 'Warning',
            message: `All changes will not be reflected. Is that okay?`,
            buttons: [
              {text: 'OK', res: 'ok'},
              {text: 'Cancel', res: 'cancel', autoFocus: true}
            ]
          })
        );
      });
      dispatch(setConfirmDialogProps(undefined));
      if (ret === 'ok') {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  const handleApply = () => {
    test.dispatch();
  };

  const handleOK = () => {
    handleApply();
    handleCancel();
  };

  const handleClose = async (_: any, reason: string) => {
    if (reason === 'escapeKeyDown') return;
    await handleCancel();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current && tempNodes.nodes.length) {
      const {top, left} = ref.current.getBoundingClientRect();
      const x = (e.clientX - left - viewX) / zoom;
      const y = (e.clientY - top - viewY) / zoom;
      setTempNodes((prev) => ({
        nodes: prev.nodes.map((node) => ({...node, position: {x, y}})),
        edges: prev.edges
      }));
    }
  };

  const handleClick = async () => {
    if (!pasting) return;
    const data = await navigator.clipboard.readText();
    const item = convertJsonToClipboardFlowNodes(data);
    if (item) {
      const {nodes, edges} = getFlowNodesFromClipboard(item);
      const tempPositions = tempNodes.nodes.reduce((prev, node) => {
        prev[node.id] = node.position;
        return prev;
      }, {} as {[index: string]: XYPosition});
      nodes.forEach((node) => {
        node.position = tempPositions[node.nodeID];
        test.addNode(node);
      });
      edges.forEach((edge) => test.tryConnect(edge.source, edge.target));
    }
    setTempNodes({nodes: [], edges: []});
    setPasting(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = store.getState().uitgd.draggingNewTestFlowNode;
    if (!item || !ref.current) {
      return;
    }
    const {top, left} = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - viewX) / zoom;
    const y = (e.clientY - top - viewY) / zoom;
    if (tempNodes.nodes.length) {
      setTempNodes((prev) => ({
        nodes: prev.nodes.map((node) => ({...node, position: {x, y}})),
        edges: prev.edges
      }));
      return;
    }
    const tmpNode = item.onDrop({x, y}, true).getRFNode();
    setTempNodes({nodes: [tmpNode], edges: []});
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const item = store.getState().uitgd.draggingNewTestFlowNode;
    if (!item || !ref.current) return;
    const {top, left} = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - viewX) / zoom;
    const y = (e.clientY - top - viewY) / zoom;
    test.addNode(item.onDrop({x, y}, false));
    test.saveLocalState();
  };

  const handleDrag = () => {
    if (!dragging) setDragging(true);
  };

  const deleteNode = async (nodeID: string): Promise<boolean> => {
    const item = test.nodes[nodeID];
    if (item) {
      if (item.className === STARTNODE || item.className === ENDNODE)
        return false;
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
          return true;
        }
        return false;
      }
      test.removeNode(item);
      update();

      return true;
    }
    return false;
  };

  const handleDragEnd = async (_: any, node: Node) => {
    setDragging(false);
    if (overDelete) {
      await deleteNode(node.id);
    }
    test.saveLocalState();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    // e.preventDefault();
    if (e.ctrlKey) {
      if (e.key === 'z') undo();
      else if (e.key === 'y') redo();
      else if (e.key === 'c') copy();
      else if (e.key === 'v') paste();
      return;
    }
    if (e.key === 'Delete') {
      const changed = {_: false};
      await Object.values(test.nodes).forEach(async (node) => {
        if (node.selected) {
          const result = await deleteNode(node.nodeID);
          if (result) changed._ = true;
        }
      });
      await Object.values(test.edges).forEach(async (edge) => {
        if (edge.selected) {
          test.removeEdge(edge);
          changed._ = true;
        }
      });
      if (changed._) {
        test.saveLocalState();
        update();
      }
    }
  };

  const arrange = () => {
    const {widthSpaceAligningNodes, heightSpaceAligningNodes} =
      store.getState().uigd.present.analysisPanelState;
    test.arrange(widthSpaceAligningNodes, heightSpaceAligningNodes);
    test.saveLocalState();
    setOnArrange((prev) => !prev);
  };

  const redo = () => {
    test.localRedo();
    update();
  };

  const undo = () => {
    test.localUndo();
    update();
  };

  const copy = async () => {
    const item = test.copySelectedNodes();
    if (item.nodes.length) {
      const data = getJsonFromClipboardFlowNodes(item);
      await navigator.clipboard.writeText(data);
    }
  };

  const paste = async () => {
    const data = await navigator.clipboard.readText();
    const item = convertJsonToClipboardFlowNodes(data);
    if (item) {
      const nodesAndEdges = getRFFlowNodesFromClipboard(item);
      setPasting(true);
      setTempNodes(nodesAndEdges);
    } else {
      setTempNodes({nodes: [], edges: []});
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');

  if (tempNodes.nodes) nodes.push(...tempNodes.nodes);

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
      onKeyDown={handleKeyDown}
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
            onNodeDrag={handleDrag}
            onNodeDragStop={handleDragEnd}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
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
                <Tooltip
                  title="Undo"
                  componentsProps={{
                    popper: {
                      sx: {
                        zIndex: 12500000000
                      }
                    }
                  }}
                >
                  <span>
                    <IconButton
                      disabled={!test.undoable}
                      onClick={undo}
                      color="primary"
                    >
                      <UndoIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title="Redo"
                  componentsProps={{
                    popper: {
                      sx: {
                        zIndex: 12500000000
                      }
                    }
                  }}
                >
                  <span>
                    <IconButton
                      disabled={!test.redoable}
                      onClick={redo}
                      color="primary"
                    >
                      <RedoIcon />
                    </IconButton>
                  </span>
                </Tooltip>
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
