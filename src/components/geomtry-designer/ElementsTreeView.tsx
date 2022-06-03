import React from 'react';
import SvgIcon, {SvgIconProps} from '@mui/material/SvgIcon';
import {styled} from '@mui/material/styles';
import TreeView from '@mui/lab/TreeView';
import TreeItem, {TreeItemProps, treeItemClasses} from '@mui/lab/TreeItem';
import Collapse from '@mui/material/Collapse';
import {useSpring, animated} from 'react-spring';
import {TransitionProps} from '@mui/material/transitions';
import {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {IAssembly, IElement, isAssembly} from '@app/geometryDesigner/IElements';

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

function Checkbox() {
  return <input type="checkbox" readOnly className="" checked={false} />;
}

function TransitionComponent(props: TransitionProps) {
  const style = useSpring({
    from: {
      opacity: 0,
      transform: 'translate3d(20px,0,0)'
    },
    to: {
      // eslint-disable-next-line react/destructuring-assignment
      opacity: props.in ? 1 : 0,
      // eslint-disable-next-line react/destructuring-assignment
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`
    }
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
}

interface ElementTreeItemProps extends TreeItemProps {
  element: IElement;
}

const StyledTreeItem = (props: ElementTreeItemProps) => {
  const {element} = props;

  const tvState = useSelector(
    (state: RootState) => state.uigd.assemblyTreeViewState
  );
  const Inner = styled((props: TreeItemProps) => (
    <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))(() => ({
    [`& .${treeItemClasses.iconContainer}`]: {
      '& .close': {
        opacity: 0.3
      }
    },
    [`& .${treeItemClasses.group}`]: {
      marginLeft: 15,
      paddingLeft: 5,
      borderLeft: tvState.borderLeft
    }
  }));

  if (isAssembly(element)) {
    const assembly = element;
    return (
      <Inner {...props}>
        {assembly.children.map((child) => {
          return (
            <StyledTreeItem
              element={child}
              nodeId={child.nodeID}
              label={child.name}
            />
          );
        })}
      </Inner>
    );
  }
  return <Inner {...props} />;
};

interface Props {
  className?: string;
}

const ElementsTreeView: React.FC<Props> = (props: Props) => {
  const {className} = props;
  const tvState = useSelector(
    (state: RootState) => state.uigd.assemblyTreeViewState
  );
  const nAssembly: IAssembly | undefined = useSelector(
    (state: RootState) => state.dgd.topAssembly
  );
  if (!nAssembly) {
    return <div />;
  }
  // eslint-disable-next-line no-unused-vars
  const assembly: IAssembly = nAssembly!;
  return (
    <TreeView
      className={className}
      aria-label="customized"
      defaultExpanded={['1']}
      defaultCollapseIcon={<MinusSquare />}
      defaultExpandIcon={<PlusSquare />}
      defaultEndIcon={<Checkbox />}
      sx={{
        scrollbarWidth: 'none' /* Firefox対応のスクロールバー非表示コード */,
        position: 'absolute',
        height: '100%',
        left: 0 /* 左からの位置指定 */,
        top: 0 /* 上からの位置指定 */,
        flexGrow: 1,
        maxWidth: 400,
        overflowY: 'auto',
        color: tvState.fontColor,
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}
    >
      <StyledTreeItem
        element={assembly}
        nodeId={assembly.nodeID}
        label={assembly.name}
      />
    </TreeView>
  );
};

export default ElementsTreeView;
