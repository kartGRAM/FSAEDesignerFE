/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import Button from '@mui/material/Button';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuList from '@mui/material/MenuList';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {useSelector} from 'react-redux';
import store, {RootState} from '@store/store';
import {numberToRgb} from '@app/utils/helpers';

interface Props {
  name: string;
  children?: React.ReactNode;
}

export const GDAppBarMenu = (props: Props) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );
  const enabledColorDark: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorDark
  );

  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.menuZIndex;

  return (
    <>
      <Button
        disabled={disabled}
        ref={anchorRef}
        onClick={handleToggle}
        sx={{
          color: '#cccccc',
          textTransform: 'none',
          height: '30px',
          '&::after': {
            content: '""',
            width: '100%',
            height: '0.2rem',
            borderBottom: `0.2rem solid ${numberToRgb(enabledColorLight)}`,
            display: 'block',
            bottom: '0px',
            position: 'absolute',
            left: '0px',
            transition: 'border-color 0.2s ease 0s, transform 0.2s ease 0s',
            transform: 'scale(0, 1)'
          },
          '&:hover:after': {
            transform: 'scale(1, 1)'
          },
          '&:hover': {
            color: '#ffffff'
          }
        }}
      >
        <span style={{marginRight: '10px'}}>{props.name}</span>
        <ArrowDropDownIcon
          sx={{
            width: 10,
            height: 10
          }}
        />
      </Button>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        disablePortal
        sx={{zIndex}}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 2]
            }
          }
        ]}
      >
        {({TransitionProps, placement}) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom-start' ? 'left top' : 'left bottom'
            }}
          >
            <Paper sx={{backgroundColor: '#111111'}}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  onKeyDown={handleListKeyDown}
                  onClick={handleClose}
                  sx={{
                    color: '#cccccc',
                    '&& .Mui-focusVisible': {
                      backgroundColor: numberToRgb(enabledColorDark),
                      color: '#ffffff'
                    },
                    '&& :hover': {
                      backgroundColor: numberToRgb(enabledColorDark),
                      color: '#ffffff'
                    },
                    '&& .MuiMenuItem-root': {
                      fontSize: '0.8rem'
                    },
                    '& .MuiDivider-root': {
                      backgroundColor: '#cccccc!important'
                    }
                  }}
                >
                  {props.children}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
