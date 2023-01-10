/* eslint-disable @typescript-eslint/no-unused-vars */
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
import AvTimer from '@mui/icons-material/AvTimer';
import TimeLine from '@mui/icons-material/Timeline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import {FlowCanvas} from '@gdComponents/side-panel-components/analysis/FlowCanvas';
import {ITest, IDataTest} from '@gd/analysis/ITest';
import {Test} from '@gd/analysis/Test';
import MuiTooltip from '@mui/material/Tooltip';
import {setTests} from '@store/reducers/dataGeometryDesigner';
import {
  setConfirmDialogProps,
  setTest,
  removeTest
} from '@store/reducers/uiTempGeometryDesigner';

export default function Controllers() {
  const dispatch = useDispatch();
  const dataTests = useSelector(
    (state: RootState) => state.dgd.present.analysis
  );

  const handleCreateTest = () => {
    const test = new Test({name: 'new test', description: 'empty test'});
    dispatch(setTests([...dataTests, test.getData()]));
  };

  return (
    <>
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
            justifyContent="center"
            padding={3}
            sx={{
              backgroundColor: '#FFF',
              minWidth: 'fit-content',
              width: '100%'
            }}
          >
            <List sx={{whiteSpace: 'nowrap', width: '100%'}}>
              {dataTests.map((test) => (
                <TestRow test={test} />
              ))}
            </List>
          </Box>
        ) : null}
      </Box>
    </>
  );
}

const TestRow = (props: {test: IDataTest}) => {
  const {test} = props;
  const loadedTest = new Test(test);
  const dispatch = useDispatch();
  dispatch(setTest(loadedTest));

  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleDelete = async () => {
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex: 125000000000,
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
      const dataTests = store.getState().dgd.present.analysis;
      dispatch(setTests(dataTests.filter((t) => t.nodeID !== test.nodeID)));
      dispatch(removeTest(loadedTest));
    }
  };

  return (
    <>
      <ListItem>
        <Button sx={{color: '#222'}} onClick={handleOpen}>
          <ListItemAvatar>
            <Avatar>
              <AccountTreeIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={test.name} secondary={test.description} />
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
              disabled={!loadedTest || !loadedTest.ready}
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
              disabled={!loadedTest || !loadedTest.ready}
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
              disabled={!loadedTest || !loadedTest.done}
            >
              <TimeLine />
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
      <FlowCanvas open={open} setOpen={setOpen} nodeID={test.nodeID} />
    </>
  );
};

// eslint-disable-next-line no-undef
const Tooltip = (props: {children: JSX.Element; title: string}) => {
  const {children, title} = props;
  return (
    <MuiTooltip
      title={title}
      componentsProps={{
        popper: {
          sx: {
            zIndex: 12500000000,
            '&:hover': {
              display: 'none'
            }
          }
        }
      }}
    >
      <span>{children}</span>
    </MuiTooltip>
  );
};
