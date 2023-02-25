import React from 'react';
import Menu from '@mui/material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import Front from './Front';
import Rear from './Rear';
import Left from './Left';
import Right from './Right';
import Top from './Top';
import Bottom from './Bottom';
import Isometric from './Isometric';

export default function ViewDirections() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [current, setCurrent] = React.useState<JSX.Element>(<Front />);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const zIndexM = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex + state.uitgd.menuZIndex
  );
  const zIndexT =
    useSelector((state: RootState) => state.uitgd.tooltipZIndex) + zIndexM;
  return (
    <>
      {current}
      <Tooltip
        title="View Directions"
        componentsProps={{
          popper: {
            sx: {
              zIndex: zIndexM
            }
          }
        }}
      >
        <IconButton sx={{padding: 0, width: '20px'}} onClick={handleClick}>
          <ArrowDropDownIcon sx={{color: '#cccccc'}} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
        sx={{
          zIndex: zIndexT,
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
            <Grid item xs={4} />
            <Grid item xs={4}>
              <Top
                onClick={() => {
                  setCurrent(<Top />);
                  handleClose();
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <Isometric
                onClick={() => {
                  setCurrent(<Isometric />);
                  handleClose();
                }}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid container item spacing={1}>
          <Grid item xs={4}>
            <Left
              onClick={() => {
                setCurrent(<Left />);
                handleClose();
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <Front
              onClick={() => {
                setCurrent(<Front />);
                handleClose();
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <Right
              onClick={() => {
                setCurrent(<Right />);
                handleClose();
              }}
            />
          </Grid>
        </Grid>
        <Grid container item spacing={1}>
          <Grid item xs={4}>
            <Rear
              onClick={() => {
                setCurrent(<Rear />);
                handleClose();
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <Bottom
              onClick={() => {
                setCurrent(<Bottom />);
                handleClose();
              }}
            />
          </Grid>
        </Grid>
      </Menu>
    </>
  );
}
