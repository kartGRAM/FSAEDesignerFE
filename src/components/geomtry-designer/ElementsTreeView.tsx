import React from 'react';
import SvgIcon, {SvgIconProps} from '@mui/material/SvgIcon';
import {styled, alpha} from '@mui/material/styles';
import TreeView from '@app/components/tree-view-base';
import TreeItem, {TreeItemProps, treeItemClasses} from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {
  IDataAssembly,
  IDataElement,
  isDataAssembly,
  getDataElementByPath,
  isDataElement
} from '@app/geometryDesigner/IElements';
import {NumberToRGB, getReversal} from '@app/utils/helpers';
import {setVisibility} from '@app/store/reducers/dataGeometryDesigner';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';

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

interface VisibilityControlProps {
  element: IDataElement;
}

const VisibilityControl = (props: VisibilityControlProps) => {
  const {element} = props;
  const nColor = getReversal(
    NumberToRGB(
      useSelector(
        (state: RootState) => state.uigd.assemblyTreeViewState.selectedColor
      )
    )
  );
  const color: string = nColor ?? '#fe6049';
  const dispatch = useDispatch();

  const visible: boolean | undefined = useSelector((state: RootState) => {
    const top = state.dgd.topAssembly;
    if (top) {
      const e = getDataElementByPath(top, element.absPath);
      if (e && isDataElement(e)) {
        return e.visible.value;
      }
    }
    return undefined;
  });

  /* const visible: boolean | undefined = useSelector(
    // eslint-disable-next-line no-unused-vars
    (state: RootState) => element.visible
  ); */
  return (
    <Checkbox
      size="small"
      checked={visible}
      indeterminate={visible === undefined}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(
          setVisibility({
            absPath: element.absPath,
            visibility: event.target.checked
          })
        );
      }}
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
};

interface ElementTreeItemProps extends TreeItemProps {
  element: IDataElement;
}

interface MyLabelProps {
  label: React.ReactNode;
  element: IDataElement;
}

function MyLabel(props: MyLabelProps) {
  const {label, element} = props;

  return (
    <Box display="flex">
      <VisibilityControl element={element} />
      <Typography>{label}</Typography>
    </Box>
  );
}

interface Props {
  className?: string;
}

const ElementsTreeView: React.FC<Props> = (props: Props) => {
  const {className} = props;
  const tvState = useSelector(
    (state: RootState) => state.uigd.assemblyTreeViewState
  );
  const nAssembly: IDataAssembly | undefined = useSelector(
    (state: RootState) => state.dgd.topAssembly
  );
  const dispatch = useDispatch();
  const selectedColor = NumberToRGB(tvState.selectedColor);

  if (!nAssembly) {
    return <div />;
  }
  const assembly: IDataAssembly = nAssembly;

  const MyTreeItem = (props: ElementTreeItemProps) => {
    const {element, label} = props;

    const StyledTreeItem = styled((props: TreeItemProps) => (
      <TreeItem {...props} />
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
        backgroundColor: `${alpha(selectedColor, 0.8)}!important`,
        transition: 'all 0.3s 0s ease',
        '&:hover': {
          backgroundColor: `${alpha(selectedColor, 0.8)}!important`
        },
        [`& .${treeItemClasses.focused}`]: {
          backgroundColor: `${alpha(selectedColor, 0.8)}!important`
        }
      }
    }));

    return (
      // eslint-disable-next-line react/destructuring-assignment
      <StyledTreeItem
        {...props}
        label={<MyLabel label={label} element={element} />}
      >
        {isDataAssembly(element)
          ? element.children.map((child) => {
              return (
                <MyTreeItem
                  element={child}
                  nodeId={child.absPath}
                  label={child.name.value}
                  key={child.nodeID}
                />
              );
            })
          : null}
      </StyledTreeItem>
    );
  };

  const handleOnSelect = (e: React.SyntheticEvent, path: string) => {
    dispatch(selectElement({absPath: path}));
  };

  return (
    <>
      <TreeView
        className={className}
        aria-label="customized"
        defaultExpanded={['1']}
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        onNodeSelect={handleOnSelect}
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
      >
        <MyTreeItem
          element={assembly}
          key={assembly.nodeID}
          nodeId={assembly.absPath}
          label={assembly.name.value}
        />
      </TreeView>
    </>
  );
};

export default ElementsTreeView;
