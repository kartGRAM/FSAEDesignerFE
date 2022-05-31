/* eslint-disable no-unused-vars */
import * as React from 'react';
import {styled, alpha} from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Divider from '@mui/material/Divider';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {NumberToRGB} from '@app/utils/helpers';
import {GDAppBarMenu} from '@app/components/geomtry-designer/GDAppBarMenu';
import GDMIOpenFromTemplates from '@app/components/geomtry-designer/GDMIOpenFromTemplates';
import GDMIClose from '@app/components/geomtry-designer/GDMIClose';

import MenuItem from '@mui/material/MenuItem';

const Search = styled('div')(({theme}) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25)
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto'
  }
}));

const SearchIconWrapper = styled('div')(({theme}) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const StyledInputBase = styled(InputBase)(({theme}) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingTop: '4px',
    paddingBottom: '4px',
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch'
      }
    }
  }
}));

export default function GDAppBar() {
  const bgColor: number = useSelector(
    (state: RootState) => state.gd.appBarState.backgroundColor
  );
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: NumberToRGB(bgColor)
      }}
    >
      <Toolbar
        sx={{
          minHeight: '30px!important',
          height: '36px!important',
          paddingLeft: '0.5rem!important',
          paddingRight: '0.5rem!important'
        }}
      >
        <GDAppBarMenu name="File">
          <MenuItem>New Empty Assembly</MenuItem>
          <GDMIOpenFromTemplates />
          <Divider />
          <MenuItem>Open</MenuItem>
          <MenuItem>Open Recent</MenuItem>
          <Divider />
          <MenuItem>Save</MenuItem>
          <MenuItem>Save As...</MenuItem>
          <Divider />
          <GDMIClose />
        </GDAppBarMenu>
        <GDAppBarMenu name="Edit">
          <MenuItem>Undo</MenuItem>
          <MenuItem>Redo</MenuItem>
          <Divider />
          <MenuItem>Cut</MenuItem>
          <MenuItem>Copy</MenuItem>
          <MenuItem>Paste</MenuItem>
        </GDAppBarMenu>
        <GDAppBarMenu name="View">
          <MenuItem>Parspective</MenuItem>
        </GDAppBarMenu>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{flexGrow: 1, display: {xs: 'none', sm: 'block'}}}
        />
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{'aria-label': 'search'}}
          />
        </Search>
      </Toolbar>
    </AppBar>
  );
}
