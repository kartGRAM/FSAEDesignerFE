// eslint-disable-next-line no-unused-vars
import React, {useState, useEffect, useRef} from 'react';
import SvgIcon, {SvgIconProps} from '@mui/material/SvgIcon';
import {styled, alpha} from '@mui/material/styles';
import TreeView from '@app/components/tree-view-base';
import TreeItem, {TreeItemProps, treeItemClasses} from '@mui/lab/TreeItem';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import {useSpring, animated} from 'react-spring';
import {TransitionProps} from '@mui/material/transitions';
import {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {IAssembly, IElement, isAssembly} from '@app/geometryDesigner/IElements';
import {NumberToRGB} from '@app/utils/helpers';

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

const VisibilityControl = () => {
  return <Checkbox size="small" sx={{padding: 0.3}} color="secondary" />;
};

interface ElementTreeItemProps extends TreeItemProps {
  element: IElement;
}

interface Props {
  className?: string;
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

const ElementsTreeView: React.FC<Props> = (props: Props) => {
  const {className} = props;
  const tvState = useSelector(
    (state: RootState) => state.uigd.assemblyTreeViewState
  );
  const nAssembly: IAssembly | undefined = useSelector(
    (state: RootState) => state.dgd.topAssembly
  );
  const selectedColor = NumberToRGB(tvState.selectedColor);

  const refSelected = useRef<HTMLDivElement>(null);
  const refFocused = useRef<HTMLDivElement>(null);

  if (!nAssembly) {
    return <div />;
  }
  const assembly: IAssembly = nAssembly;

  const MyTreeItem = (props: ElementTreeItemProps) => {
    const {element, label} = props;

    const MyLabel = () => {
      return (
        <Box display="flex">
          <VisibilityControl />
          <Typography>{label}</Typography>
        </Box>
      );
    };

    const StyledTreeItem = styled((props: TreeItemProps) => (
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
      },
      [`& .Mui-focused`]: {
        backgroundColor: `${alpha(selectedColor, 0.2)}!important`,
        transition: 'all 0.3s 0s ease'
      },
      [`& .${treeItemClasses.selected}`]: {
        backgroundColor: `${selectedColor}!important`,
        transition: 'all 0.3s 0s ease',
        '&:hover': {
          backgroundColor: `${selectedColor}!important`
        },
        [`& .${treeItemClasses.focused}`]: {
          backgroundColor: `${selectedColor}!important`
        }
      }
    }));

    return (
      // eslint-disable-next-line react/destructuring-assignment
      <StyledTreeItem {...props} label={<MyLabel />}>
        {isAssembly(element)
          ? element.children.map((child) => {
              return (
                <MyTreeItem
                  element={child}
                  nodeId={child.nodeID}
                  label={child.name}
                  key={child.nodeID}
                />
              );
            })
          : null}
      </StyledTreeItem>
    );
  };

  return (
    <>
      <TreeView
        className={className}
        aria-label="customized"
        defaultExpanded={['1']}
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        // defaultEndIcon={<Checkbox />}
        sx={{
          scrollbarWidth: 'none' /* Firefox対応のスクロールバー非表示コード */,
          position: 'absolute',
          height: '100%',
          left: 0 /* 左からの位置指定 */,
          top: 0 /* 上からの位置指定 */,
          flexGrow: 1,
          maxWidth: 400,
          overflowY: 'auto',
          color: NumberToRGB(tvState.fontColor),
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }}
        onNodeSelect={(event: React.SyntheticEvent, nodeIds: string) => {
          if (refSelected.current) {
            refSelected.current.innerText = `selected:${nodeIds}`;
          }
        }}
        onNodeFocus={(event: React.SyntheticEvent, nodeIds: string) => {
          if (refFocused.current) {
            refFocused.current.innerText = `focused:${nodeIds}`;
          }
        }}
      >
        <div ref={refSelected}>selected: </div>
        <div ref={refFocused}>focused: </div>

        <MyTreeItem
          element={assembly}
          key={assembly.nodeID}
          nodeId={assembly.nodeID}
          label={assembly.name}
        />
      </TreeView>
    </>
  );
};

export default ElementsTreeView;
