/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import SvgIcon, {SvgIconProps} from '@mui/material/SvgIcon';
import {alpha} from '@mui/material/styles';
import TreeView from '@app/components/tree-view-base';
import TreeItem, {TreeItemProps, treeItemClasses} from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {
  IDataAssembly,
  IDataElement,
  isDataAssembly,
  getDataElementByPath,
  getElementByPath,
  isDataElement
} from '@gd/IElements';
import {getAssembly} from '@gd/Elements';
import {NumberToRGB, getReversal, unique} from '@app/utils/helpers';
import {updateAssembly} from '@app/store/reducers/dataGeometryDesigner';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import usePrevious from '@app/hooks/usePrevious';
import Collapse from '@mui/material/Collapse';
// web.cjs is required for IE11 support
import {useSpring, animated} from 'react-spring';
import {TransitionProps} from '@mui/material/transitions';

const ElementsTreeView = () => {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [nodeID, setNodeID] = React.useState<string>('');
  const dispatch = useDispatch();

  const nodeIDState = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );

  // 苦肉の策（nodeIDStateをそのまま使用するとアニメーションがカクつく）
  React.useEffect(() => {
    setNodeID(nodeIDState);
  }, [nodeIDState]);

  const fontColor = useSelector(
    (state: RootState) => state.uigd.present.assemblyTreeViewState.fontColor
  );

  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );

  const disableSelection = useSelector(
    (state: RootState) => state.uitgd.uiDisabled
  );

  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.present.backgroundColor
  );

  // console.log('rerendered');
  const handleOnSelect = React.useCallback(
    (e: React.SyntheticEvent, path: string) => {
      dispatch(selectElement({absPath: path}));
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

  const expanded2 = nodeID
    .split('@')
    .reverse()
    .reduce((prev: string[], current: string) => {
      if (prev.length > 0) {
        return [...prev, [current, prev[prev.length - 1]].join('@')];
      }
      return [current];
    }, [] as string[]);
  expanded2.pop();
  const expandedWithSelected = unique([...expanded, ...expanded2]);

  return (
    <TreeView
      aria-label="controlled"
      defaultCollapseIcon={<MinusSquare />}
      defaultExpandIcon={<PlusSquare />}
      disableSelection={disableSelection}
      onNodeSelect={handleOnSelect}
      onNodeToggle={handleToggle}
      selected={nodeID}
      expanded={expandedWithSelected}
      sx={{
        scrollbarWidth: 'none' /* Firefox対応のスクロールバー非表示コード */,
        position: 'absolute',
        // height: '100%',
        left: 0 /* 左からの位置指定 */,
        top: 0 /* 上からの位置指定 */,
        flexGrow: 1,
        maxWidth: 400,
        overflowY: 'auto',
        color: NumberToRGB(fontColor),
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        backgroundColor: alpha(NumberToRGB(bgColor), 0.9),
        backdropFilter: 'blur(3px)'
      }}
    >
      <MyTreeItem {...propsTree} key={assembly.nodeID} />
    </TreeView>
  );
};

interface MyTreeItemProps {
  nodeId: string;
  label: string;
  children: MyTreeItemProps[];
}

function getPropsTree(element: IDataElement | undefined): MyTreeItemProps {
  if (!element) {
    return {
      nodeId: 'none',
      label: '',
      children: []
    };
  }
  let children: MyTreeItemProps[] = [];
  if (isDataAssembly(element)) {
    children = element.children.map((child) => getPropsTree(child));
  }
  return {
    nodeId: element.absPath,
    label: element.name.value,
    children
  };
}

const MyTreeItem = React.memo((props: MyTreeItemProps) => {
  const {nodeId, label, children} = props;
  const selectedColor = NumberToRGB(
    useSelector(
      (state: RootState) =>
        state.uigd.present.assemblyTreeViewState.selectedColor
    )
  );
  const borderLeft = useSelector(
    (state: RootState) => state.uigd.present.assemblyTreeViewState.borderLeft
  );

  return (
    <TreeItem
      {...props}
      label={<MyLabel label={label} absPath={nodeId} />}
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
      {children.map((child) => {
        return <MyTreeItem {...child} key={child.nodeId} />;
      })}
    </TreeItem>
  );
});

const MyLabel = React.memo((props: {label: string; absPath: string}) => {
  const {label, absPath} = props;

  return (
    <Box display="flex">
      <VisibilityControl absPath={absPath} />
      <Typography>{label}</Typography>
    </Box>
  );
});

const VisibilityControl = React.memo((props: {absPath: string}) => {
  const {absPath} = props;
  const nColor = getReversal(
    NumberToRGB(
      useSelector(
        (state: RootState) =>
          state.uigd.present.assemblyTreeViewState.selectedColor
      )
    )
  );
  const color: string = nColor ?? '#fe6049';
  const dispatch = useDispatch();

  const visible: boolean | undefined = useSelector((state: RootState) => {
    const top = state.dgd.present.topAssembly;
    if (top) {
      const e = getDataElementByPath(top, absPath);
      if (e && isDataElement(e)) {
        return e.visible.value;
      }
    }
    return undefined;
  });

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const {topAssembly} = store.getState().dgd.present;
      if (topAssembly) {
        const assembly = getAssembly(topAssembly);
        const instance = getElementByPath(assembly, absPath);
        if (instance) {
          instance.visible.value = event.target.checked;
          dispatch(updateAssembly(instance));
        }
      }
    },
    [absPath]
  );

  return (
    <Checkbox
      size="small"
      checked={visible}
      indeterminate={visible === undefined}
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

function MinusSquare(props: SvgIconProps) {
  return (
    <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
    </SvgIcon>
  );
}

function PlusSquare(props: SvgIconProps) {
  return (
    <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
    </SvgIcon>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TransitionComponent(props: TransitionProps) {
  const style = useSpring({
    from: {
      opacity: 0,
      transform: 'translate3d(0px,0,0)'
    },
    to: {
      // eslint-disable-next-line react/destructuring-assignment
      opacity: props.in ? 1 : 0,
      // eslint-disable-next-line react/destructuring-assignment
      transform: `translate3d(0px,0,0)`
    }
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
}
