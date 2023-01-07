/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
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

export default function Controllers() {
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);

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
          <Button variant="contained" size="large" onClick={() => {}}>
            Create a New Test
          </Button>
        </Box>
        <Box
          component="div"
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding={3}
          sx={{backgroundColor: '#FFF', minWidth: 'fit-content', width: '100%'}}
        >
          <List sx={{whiteSpace: 'nowrap', width: '100%'}}>
            {generate(
              <ListItem>
                <Button sx={{color: '#222'}} onClick={() => setOpen(true)}>
                  <ListItemAvatar>
                    <Avatar>
                      <AccountTreeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Single-line item"
                    secondary="Secondary text"
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
                  <IconButton
                    sx={{ml: 1}}
                    edge="end"
                    aria-label="folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <FolderIcon />
                  </IconButton>
                  <IconButton
                    sx={{ml: 2}}
                    edge="end"
                    aria-label="reload"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <AvTimer />
                  </IconButton>
                  <IconButton
                    sx={{ml: 2}}
                    edge="end"
                    aria-label="graph"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <TimeLine />
                  </IconButton>
                  <IconButton
                    sx={{ml: 2}}
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Toolbar>
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    </>
  );
}

function generate(element: React.ReactElement) {
  return [0, 1, 2].map((value) =>
    React.cloneElement(element, {
      key: value
    })
  );
}
