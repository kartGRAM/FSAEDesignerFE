import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {useDispatch, useSelector} from 'react-redux';
import store, {RootState} from '@store/store';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AvTimer from '@mui/icons-material/AvTimer';
import TimeLine from '@mui/icons-material/Timeline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import {FlowCanvas} from '@gdComponents/side-panel-components/analysis/FlowCanvas';
import {ITest, IDataTest} from '@gd/analysis/ITest';
import {Test} from '@gd/analysis/Test';
import {setTests} from '@store/reducers/dataGeometryDesigner';
import {
  setConfirmDialogProps,
  setTest,
  removeTest
} from '@store/reducers/uiTempGeometryDesigner';
import {ReactFlowProvider} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import Tooltip from '@gdComponents/Tooltip';
import {getDgd} from '@store/getDgd';

export default function AnalysisRoot() {
  const dispatch = useDispatch();
  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);
  const dataTests = useSelector(
    (state: RootState) => state.dgd.present.analysis
  );

  const handleCreateTest = () => {
    const test = new Test({name: 'new test', description: 'empty test'});
    dispatch(setTests([...dataTests, test.getData()]));
  };

  return (
    <Box component="div" sx={{position: 'relative'}}>
      <Typography variant="h6">Analysis</Typography>
      <Box
        component="div"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Box component="div" padding={3}>
          <Button variant="contained" size="large" onClick={handleCreateTest}>
            Create a New Test
          </Button>
        </Box>
        {dataTests.length > 0 ? (
          <Box
            component="div"
            display="flex"
            alignItems="center"
            justifyContent="start"
            padding={3}
            sx={{
              backgroundColor: '#FFF',
              // minWidth: 'fit-content',
              width: '100%'
            }}
          >
            <List sx={{whiteSpace: 'nowrap', width: '100%'}}>
              {dataTests.map((test) => (
                <TestRow test={test} key={test.nodeID} />
              ))}
            </List>
          </Box>
        ) : null}
      </Box>
      <Box
        component="div"
        sx={{
          backgroundColor: alpha('#000', 0.3),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: disabled ? 'unset' : 'none'
        }}
      />
    </Box>
  );
}

const TestRow = React.memo((props: {test: IDataTest}) => {
  const {test} = props;

  const loadedTest: ITest =
    useSelector((state: RootState) =>
      state.uitgd.tests.find((t) => t.nodeID === test.nodeID)
    ) ?? new Test(test);

  const dispatch = useDispatch();

  const [open, setOpen] = React.useState(false);
  const openId = React.useRef<number>(1);

  const handleOpen = React.useCallback(() => {
    setOpen(true);
  }, []);

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;

  const handleDelete = React.useCallback(async () => {
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex,
          onClose: resolve,
          buttons: [
            {text: 'OK', res: 'ok'},
            {text: 'Cancel', res: 'cancel', autoFocus: true}
          ],
          title: 'Confirm',
          message:
            'All components in this test set will be removed. Are you OK?'
        })
      );
    });
    dispatch(setConfirmDialogProps(undefined));
    if (ret === 'ok') {
      const dataTests = getDgd().analysis;
      dispatch(setTests(dataTests.filter((t) => t.nodeID !== test.nodeID)));
      dispatch(removeTest(loadedTest));
    }
  }, [loadedTest]);

  const handleCopy = React.useCallback(() => {
    const dataTests = getDgd().analysis;
    dispatch(
      setTests([
        ...dataTests,
        {...test, nodeID: uuidv4(), name: `copy_${test.name}`}
      ])
    );
  }, [test]);

  React.useEffect(() => {
    if (!open) {
      openId.current += 1;
    }
  }, [open]);

  React.useEffect(() => {
    dispatch(setTest(loadedTest));
  }, [loadedTest]);

  return (
    <>
      <ListItem sx={{width: '100%', pl: 0}}>
        <Button sx={{color: '#222'}} onClick={handleOpen}>
          <ListItemAvatar>
            <Avatar>
              <AccountTreeIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={test.name}
            secondary={test.description}
            sx={{
              overflow: 'hidden',
              '& p,span': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
          />
        </Button>
        <Toolbar
          sx={{
            paddingLeft: '0px!important',
            paddingRight: '0px!important',
            minHeight: '24px!important',
            justifyContent: 'right',
            flexGrow: 1,
            zIndex: 1,
            background: alpha('#FFFFFF', 0.0)
          }}
        >
          <Tooltip title="Load from local data">
            <IconButton
              sx={{ml: 1}}
              edge="end"
              aria-label="folder"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              disabled={!loadedTest || true}
            >
              <FolderIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rerun this test">
            <IconButton
              sx={{ml: 2}}
              edge="end"
              aria-label="reload"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              disabled={!loadedTest || !loadedTest.isValid}
            >
              <AvTimer />
            </IconButton>
          </Tooltip>
          <Tooltip title="Show results">
            <IconButton
              sx={{ml: 2}}
              edge="end"
              aria-label="graph"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              disabled={!loadedTest || !loadedTest.solver.done}
            >
              <TimeLine />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy this test">
            <IconButton
              sx={{ml: 2}}
              edge="end"
              aria-label="delete"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleCopy();
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete this test">
            <IconButton
              sx={{ml: 2}}
              edge="end"
              aria-label="delete"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDelete();
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </ListItem>
      <ReactFlowProvider>
        <FlowCanvas
          key={openId.current}
          open={open}
          setOpen={setOpen}
          nodeID={test.nodeID}
        />
      </ReactFlowProvider>
    </>
  );
});
