/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Front from './Front';
import Rear from './Rear';
import Left from './Left';
import Right from './Right';
import Top from './Top';
import Bottom from './Bottom';
import Isometric from './Isometric';

export default function ViewDirections() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Front />
      <Tooltip
        title="View Directions"
        componentsProps={{
          popper: {
            sx: {
              zIndex: 12500000000
            }
          }
        }}
      >
        <IconButton sx={{padding: 0, width: '20px'}} onClick={handleClick}>
          <ArrowDropDownIcon sx={{color: '#cccccc'}} />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
        sx={{
          zIndex: 1250000000,
          '.MuiPaper-root': {
            background: '#333'
          },
          display: 'flex',
          flexGrow: 1
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Grid container spacing={100}>
          <Grid container item spacing={1}>
            <Grid item xs={4}>
              <Isometric />
            </Grid>
            <Grid item xs={4}>
              <Top />
            </Grid>
          </Grid>
        </Grid>
        <Grid container item spacing={1}>
          <Grid item xs={4}>
            <Left />
          </Grid>
          <Grid item xs={4}>
            <Front />
          </Grid>
          <Grid item xs={4}>
            <Right />
          </Grid>
        </Grid>
        <Grid container item spacing={1}>
          <Grid item xs={4}>
            <Rear />
          </Grid>
          <Grid item xs={4}>
            <Bottom />
          </Grid>
        </Grid>
      </Menu>
    </>
  );
}
