/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';

export default function Controllers() {
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="h6">Analysis</Typography>
      <Box
        component="div"
        display="flex"
        alignItems="center"
        justifyContent="center"
        padding={3}
      >
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
        sx={{backgroundColor: '#FFF'}}
      >
        <List>
          {generate(
            <ListItem>
              <Button sx={{color: '#222'}}>
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
                  minHeight: '24px!important',
                  justifyContent: 'center',
                  zIndex: 1,
                  background: alpha('#FFFFFF', 0.0)
                }}
              >
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
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
