import React from 'react';
import SvgIcon, {SvgIconProps} from '@mui/material/SvgIcon';
import {alpha} from '@mui/material/styles';
import TreeView from '@app/components/tree-view-base';
import TreeItem, {treeItemClasses} from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {
  IElement,
  getElementByPath,
  isAssembly as isAssemblyCheck,
  isMirror as isMirrorCheck
} from '@gd/IElements';
import {getNewElement} from '@gd/Elements';

import {numberToRgb, getReversal, unique} from '@app/utils/helpers';
import {updateAssembly} from '@app/store/reducers/dataGeometryDesigner';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import usePrevious from '@app/hooks/usePrevious';
import {
  treeViewDragExpanded,
  setDraggingElementAbsPath,
  setConfirmDialogProps,
  resetDragState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVisibility
} from '@store/reducers/uiTempGeometryDesigner';
import {v4 as uuidv4} from 'uuid';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {
  RenameDialog,
  RenameDialogProps
} from '@gdComponents/dialog-components/RenameDialog';

// 【重要】
// 再描写がきわめて多く、パフォーマンスに懸念。
// そのうち直すべき（動作に問題はない）

const ElementsTreeView = () => {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [renameDialogProps, setRenameDialogProps] =
    React.useState<RenameDialogProps | null>(null);

  const dragExpanded = useSelector(
    (state: RootState) => state.uitgd.treeViewDragExpanded
  );
  // const [nodeID, setNodeID] = React.useState<string>('');
  const dispatch = useDispatch();

  const nodeID = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );

  const dragTo = dragExpanded.length
    ? dragExpanded[dragExpanded.length - 1]
    : '';

  // 苦肉の策（nodeIDStateをそのまま使用するとアニメーションがカクつく）
  /*
  React.useEffect(() => {
    setNodeID(nodeIDState);
  }, [nodeIDState]);
  */

  const fontColor = useSelector(
    (state: RootState) => state.uigd.present.assemblyTreeViewState.fontColor
  );

  const assembly = useSelector((state: RootState) => state.uitgd.assembly);

  const disableSelection = useSelector(
    (state: RootState) => state.uitgd.uiDisabled
  );

  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.present.backgroundColor
  );

  const movingElement = useSelector(
    (state: RootState) => state.uitgd.draggingElementAbsPath
  );

  // console.log('rerendered');
  const handleOnSelect = React.useCallback(
    async (e: React.SyntheticEvent, path: string) => {
      await dispatch(selectElement({absPath: path}));
    },
    []
  );

  const handleToggle = React.useCallback(
    (event: React.SyntheticEvent, nodeIds: string[]) => {
      setExpanded(nodeIds);
    },
    []
  );

  const propsTree = React.useMemo(() => getPropsTree(assembly), [assembly]);

  if (!assembly) {
    return <div />;
  }

  const splitedPath = nodeID.split('@');
  splitedPath.shift();
  const parent = splitedPath.join('@');
  const toExpanded = parent
    .split('@')
    .reverse()
    .reduce((prev: string[], current: string) => {
      if (prev.length > 0) {
        return [...prev, [current, prev[prev.length - 1]].join('@')];
      }
      return [current];
    }, [] as string[]);

  if (parent && toExpanded.filter((x) => !expanded.includes(x)).length) {
    setExpanded((prev) => unique([...prev, ...toExpanded]));
  }

  const expandedWithDrag = unique([
    ...expanded, // ...expanded2,
    ...dragExpanded
  ]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'F2') {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ret = await new Promise<string>((resolve) => {
        setRenameDialogProps({
          onClose: resolve,
          absPath: nodeID
        });
      });
      setRenameDialogProps(null);
    }
  };

  return (
    <>
      <TreeView
        aria-label="controlled"
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        disableSelection={disableSelection}
        onNodeSelect={handleOnSelect}
        onNodeToggle={handleToggle}
        selected={nodeID}
        expanded={expandedWithDrag}
        onKeyDown={handleKeyDown}
        sx={{
          scrollbarWidth: 'none' /* Firefox対応のスクロールバー非表示コード */,
          position: 'absolute',
          // height: '100%',
          left: 0 /* 左からの位置指定 */,
          top: 0 /* 上からの位置指定 */,
          flexGrow: 1,
          maxWidth: 400,
          overflowY: 'auto',
          color: numberToRgb(fontColor),
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          backgroundColor: alpha(numberToRgb(bgColor), 0.7),
          backdropFilter: 'blur(3px)'
        }}
      >
        <MyTreeItem {...propsTree} key={assembly.nodeID} dragTo={dragTo} />
        {movingElement !== '' ? <TrashNode /> : null}
      </TreeView>
      {renameDialogProps ? <RenameDialog {...renameDialogProps} /> : null}
    </>
  );
};

interface MyTreeItemProps {
  nodeId: string;
  label: string;
  children: PropsTreeNode[];
  dragTo: string;
  isAssembly: boolean;
  isMirror: boolean;
  isBodyOfFrame: boolean;
}

type PropsTreeNode = {
  nodeId: string;
  label: string;
  children: PropsTreeNode[];
  isAssembly: boolean;
  isMirror: boolean;
  isBodyOfFrame: boolean;
};

function getPropsTree(element: IElement | undefined): PropsTreeNode {
  if (!element) {
    return {
      nodeId: 'none',
      label: '',
      children: [] as PropsTreeNode[],
      isAssembly: false,
      isMirror: true,
      isBodyOfFrame: true
    };
  }
  let children: PropsTreeNode[] = [];
  let isAssembly = false;
  if (isAssemblyCheck(element)) {
    children = element.children.map((child) => getPropsTree(child));
    isAssembly = !isMirrorCheck(element);
  }
  return {
    nodeId: element.absPath,
    label: element.name.value,
    children,
    isAssembly,
    isMirror: isMirrorCheck(element),
    isBodyOfFrame: Boolean(element.meta?.isBodyOfFrame)
  };
}

const MyTreeItem = React.memo((props: MyTreeItemProps) => {
  const {nodeId, label, children, isAssembly, dragTo, isMirror, isBodyOfFrame} =
    props;
  const selectedColor = numberToRgb(
    useSelector(
      (state: RootState) =>
        state.uigd.present.assemblyTreeViewState.selectedColor
    )
  );
  const borderLeft = useSelector(
    (state: RootState) => state.uigd.present.assemblyTreeViewState.borderLeft
  );
  // if (nodeId === dragTo) console.log(dragTo);

  const childNodes = children.map((child) => {
    return <MyTreeItem {...child} key={child.nodeId} dragTo={dragTo} />;
  });

  if (nodeId === dragTo) childNodes.push(<TemporaryNode key="temporary" />);

  return (
    <TreeItem
      // キーボード操作が不可能になる。将来的には調整
      onFocusCapture={(e) => e.stopPropagation()}
      nodeId={nodeId}
      label={
        <MyLabel
          label={label}
          absPath={nodeId}
          isAssembly={isAssembly}
          isMirror={isMirror}
          isBodyOfFrame={isBodyOfFrame}
        />
      }
      sx={{
        [`& .${treeItemClasses.iconContainer}`]: {
          '& .close': {
            opacity: 0.3
          }
        },
        [`& .${treeItemClasses.group}`]: {
          marginLeft: 2,
          paddingLeft: 1,
          borderLeft
        },
        [`& .Mui-focused`]: {
          backgroundColor: `${alpha(selectedColor, 0.2)}!important`,
          transition: 'all 0.3s 0s ease'
        },
        [`& .${treeItemClasses.selected}`]: {
          backgroundColor: `${alpha(selectedColor, 0.8)}!important`,
          transition: 'all 0.3s 0s ease',
          '&:hover': {
            backgroundColor: `${alpha(selectedColor, 0.8)}!important`
          },
          [`& .${treeItemClasses.focused}`]: {
            backgroundColor: `${alpha(selectedColor, 0.8)}!important`
          }
        }
      }}
    >
      {childNodes}
    </TreeItem>
  );
});

const TemporaryNode = React.memo(() => {
  const selectedColor = numberToRgb(
    useSelector(
      (state: RootState) =>
        state.uigd.present.assemblyTreeViewState.selectedColor
    )
  );
  const borderLeft = useSelector(
    (state: RootState) => state.uigd.present.assemblyTreeViewState.borderLeft
  );

  let label = 'temporaryNode';
  const newElement = store.getState().uitgd.draggingNewElement;
  if (newElement) label = `new${newElement}`;
  const movingElement = store.getState().uitgd.draggingElementAbsPath;
  if (movingElement) {
    const {assembly} = store.getState().uitgd;
    const element = getElementByPath(assembly, movingElement);
    if (element) {
      label = element.name.value;
    }
  }

  return (
    <TreeItem
      nodeId={uuidv4()}
      label={label}
      sx={{
        backgroundColor: `${alpha(selectedColor, 0.2)}!important`,
        [`& .${treeItemClasses.iconContainer}`]: {
          '& .close': {
            opacity: 0.3
          }
        },
        [`& .${treeItemClasses.group}`]: {
          marginLeft: 2,
          paddingLeft: 1,
          borderLeft
        },
        [`& .Mui-focused`]: {
          backgroundColor: `${alpha(selectedColor, 0.2)}!important`,
          transition: 'all 0.3s 0s ease'
        },
        [`& .${treeItemClasses.selected}`]: {
          backgroundColor: `${alpha(selectedColor, 0.8)}!important`,
          transition: 'all 0.3s 0s ease',
          '&:hover': {
            backgroundColor: `${alpha(selectedColor, 0.8)}!important`
          },
          [`& .${treeItemClasses.focused}`]: {
            backgroundColor: `${alpha(selectedColor, 0.8)}!important`
          }
        }
      }}
    />
  );
});

const TrashNode = React.memo(() => {
  const borderLeft = useSelector(
    (state: RootState) => state.uigd.present.assemblyTreeViewState.borderLeft
  );

  const label = 'Trash';
  const [opacity, setOpacity] = React.useState<number>(0.2);
  const dispatch = useDispatch();

  const handleDragLeave = React.useCallback(() => {
    setOpacity(0.2);
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      setOpacity(0.2);
      const movingElement = store.getState().uitgd.draggingElementAbsPath;
      dispatch(resetDragState());
      if (!movingElement) return;
      const {assembly} = store.getState().uitgd;
      const element = getElementByPath(assembly, movingElement);
      if (!element || !element.parent) return;
      const {fullScreenZIndex} = store.getState().uitgd;
      const ret = await new Promise<string>((resolve) => {
        dispatch(
          setConfirmDialogProps({
            zindex: fullScreenZIndex + 10000 + 1,
            onClose: resolve,
            title: 'Warning',
            message: `Once deleted and saved, it cannot be restored.`,
            buttons: [
              {text: 'OK', res: 'ok'},
              {text: 'Cancel', res: 'cancel', autoFocus: true}
            ]
          })
        );
      });
      dispatch(setConfirmDialogProps(undefined));
      if (ret === 'ok') {
        element.parent.children = element.parent.children.filter(
          (child) => child.nodeID !== element.nodeID
        );
        dispatch(updateAssembly(element.parent));
      }
    },
    []
  );

  return (
    <TreeItem
      nodeId={uuidv4()}
      label={
        <Box display="flex" component="div">
          <DeleteForeverIcon /* fontSize="large" */ />
          <Typography>{label}</Typography>
        </Box>
      }
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        if (opacity !== 1) setOpacity(1);
      }}
      sx={{
        backgroundColor: `${alpha('#ff6347', opacity)}`,
        [`& .${treeItemClasses.group}`]: {
          marginLeft: 2,
          paddingLeft: 1,
          borderLeft
        }
      }}
    />
  );
});

const MyLabel = React.memo(
  (props: {
    isAssembly: boolean;
    label: string;
    absPath: string;
    isMirror: boolean;
    isBodyOfFrame: boolean;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {label, absPath, isAssembly, isMirror, isBodyOfFrame} = props;
    const dispatch = useDispatch();

    const handleDragStart = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        dispatch(setDraggingElementAbsPath(absPath));
      },
      [absPath]
    );

    const handleDragEnd = React.useCallback(() => {
      dispatch(setDraggingElementAbsPath(''));
    }, []);

    const paths = React.useMemo(() => {
      return absPath
        .split('@')
        .reverse()
        .reduce((prev, nodeID) => {
          if (prev.length) {
            prev.push([nodeID, prev[prev.length - 1]].join('@'));
            return prev;
          }
          return [nodeID];
        }, [] as string[]);
    }, [absPath]);

    const handleDragEnter = React.useCallback(() => {
      const elementType = store.getState().uitgd.draggingNewElement;
      if (elementType) {
        dispatch(treeViewDragExpanded(paths));
      }
      const movingElement = store.getState().uitgd.draggingElementAbsPath;
      if (movingElement !== '') {
        const parent = movingElement.split('@').slice(1).join('@');
        if (movingElement === absPath) {
          dispatch(treeViewDragExpanded([]));
          return;
        }
        if (parent === absPath) {
          dispatch(treeViewDragExpanded([]));
          return;
        }
        if (absPath.indexOf(movingElement) !== -1) {
          dispatch(treeViewDragExpanded([]));
          return;
        }
        const {assembly} = store.getState().uitgd;
        if (assembly && movingElement) {
          const element = getElementByPath(assembly, movingElement);
          if (isMirrorCheck(element)) return;
        }

        dispatch(treeViewDragExpanded(paths));
      }
    }, [absPath, paths]);

    const handleDrop = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const elementType = store.getState().uitgd.draggingNewElement;
        const movingElement = store.getState().uitgd.draggingElementAbsPath;
        dispatch(resetDragState());
        const {assembly} = store.getState().uitgd;
        if (assembly && elementType) {
          const newElement = getNewElement(elementType);
          const to = getElementByPath(assembly, absPath);
          if (to && isAssemblyCheck(to)) {
            to.appendChild(newElement);
            dispatch(updateAssembly(assembly));
            dispatch(selectElement({absPath: newElement.absPath}));
            return;
          }
        }
        if (assembly && movingElement) {
          const parentPath = movingElement.split('@').slice(1).join('@');
          if (movingElement === absPath) {
            dispatch(treeViewDragExpanded([]));
            return;
          }
          if (parentPath === absPath) {
            dispatch(treeViewDragExpanded([]));
            return;
          }
          if (absPath.indexOf(movingElement) !== -1) {
            dispatch(treeViewDragExpanded([]));
            return;
          }
          const element = getElementByPath(assembly, movingElement);
          if (isMirrorCheck(element)) return;
          const parent = element?.parent;
          const to = getElementByPath(assembly, absPath);
          if (element && parent && to && isAssemblyCheck(to)) {
            parent.children = parent.children.filter(
              (child) => child.nodeID !== element.nodeID
            );
            to.appendChild(element);
            dispatch(updateAssembly(assembly));
            dispatch(selectElement({absPath: to.absPath}));
            return;
          }
        }
        dispatch(selectElement({absPath}));
      },
      [absPath]
    );

    const isRoot = absPath.indexOf('@') === -1;

    return (
      <Box
        component="div"
        display="flex"
        draggable={!isRoot && !isBodyOfFrame}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={isAssembly ? handleDragEnter : undefined}
        onDrop={isAssembly ? handleDrop : undefined}
        onDragOver={
          isAssembly
            ? (e) => {
                e.preventDefault();
              }
            : undefined
        }
      >
        <VisibilityControl absPath={absPath} />
        <Typography
          sx={{
            userSelect: 'none'
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  }
);

const VisibilityControl = React.memo((props: {absPath: string}) => {
  const {absPath} = props;
  const nColor = getReversal(
    numberToRgb(
      useSelector(
        (state: RootState) =>
          state.uigd.present.assemblyTreeViewState.selectedColor
      )
    )
  );
  const visibility = useSelector((state: RootState) => {
    const {assembly} = state.uitgd;
    const element = getElementByPath(assembly, absPath);
    return element?.visible.value ?? null;
  });
  const color: string = nColor ?? '#fe6049';
  const dispatch = useDispatch();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {assembly} = store.getState().uitgd;
    if (assembly) {
      const instance = getElementByPath(assembly, absPath);
      if (instance) {
        instance.visible.value = event.target.checked;
        dispatch(setVisibility());
        // dispatch(updateAssembly(instance));
      }
    }
  };

  return (
    <Checkbox
      size="small"
      checked={!!visibility}
      indeterminate={visibility === null}
      onChange={handleChange}
      sx={{
        padding: 0.3,
        color: alpha(color, 0.7),
        '&.Mui-checked': {
          color: alpha(color, 0.8)
        },
        '&.MuiCheckbox-indeterminate': {
          color: alpha(color, 0.8)
        }
      }}
    />
  );
});

export default ElementsTreeView;

const MinusSquare = React.memo((props: SvgIconProps) => {
  return (
    <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
    </SvgIcon>
  );
});

const PlusSquare = React.memo((props: SvgIconProps) => {
  return (
    <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
    </SvgIcon>
  );
});
