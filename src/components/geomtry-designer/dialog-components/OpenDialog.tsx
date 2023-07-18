import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DialogContentText from '@mui/material/DialogContentText';
import Dialog, {DialogProps} from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {
  setOpenDialogOpen,
  setConfirmDialogProps,
  clearAll
} from '@store/reducers/uiTempGeometryDesigner';
import {setTopAssembly} from '@store/reducers/dataGeometryDesigner';
import {getListSetTopAssemblyParams, SavedData} from '@gd/ISaveData';
import confirmIfChanged from '@app/utils/confirmIfChanged';
import {styled} from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import useAxios from 'axios-hooks';
import CircularProgress from '@mui/material/CircularProgress';
import {DateTime} from 'luxon';
import Box from '@mui/material/Box';

// import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import {instance} from '@app/utils/axios';
// import usePrevious from '@app/hooks/usePrevious';

const Item = styled(Paper)(({theme}) => ({
  backgroundColor: '#111111',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ImageSelectable = styled(Box)(({theme}) => ({
  '& .MuiImageListItem-root': {
    opacity: 0.7
  },
  '&:hover, &.Mui-focusVisible': {
    '& .MuiImageListItem-root': {
      opacity: 1.0
    }
  }
}));

interface OpenDialogProps extends DialogProps {
  zindex: number;
}

export function OpenDialog(props: OpenDialogProps) {
  const {zindex, onClose} = props;

  const baseURL = useSelector((state: RootState) => state.auth.apiURLBase);
  const open = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.openDialogOpen
  );
  // const openPrev = usePrevious(open, false);
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{data, loading, error}, updateData] = useAxios(
    {
      url: '/api/gd/get_all_user_files/',
      method: 'GET'
    },
    {
      manual: true
    }
  );
  React.useEffect(() => {
    if (open) updateData();
  }, [open]);

  const listFiles = data ? getListSetTopAssemblyParams(data) : null;

  const handleClose = (e: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (onClose) onClose(e, reason);
    dispatch(setOpenDialogOpen({open: false}));
  };
  const handleFileClick = async (params: SavedData) => {
    const next = () => {
      dispatch(clearAll());
      dispatch(setTopAssembly(params));
      dispatch(setOpenDialogOpen({open: false}));
    };
    confirmIfChanged(dispatch, next, zindex);
  };

  const dialogZIndex =
    useSelector((state: RootState) => state.uitgd.dialogZIndex) + zindex;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInfoClick = async (params: SavedData) => {
    await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex: dialogZIndex,
          onClose: resolve,
          buttons: [{text: 'OK', res: 'cancel', autoFocus: true}],
          title: params.filename,
          message: (
            <Typography
              variant="body1"
              sx={{
                p: 0,
                m: 0,
                '& pre': {
                  p: 0,
                  m: 0
                }
              }}
            >
              <pre style={{fontFamily: 'inherit'}}>
                {`filename: ${params.filename}
id: ${params.id}
created: ${DateTime.fromISO(params.created ?? '').toLocaleString({
                  ...DateTime.DATE_SHORT
                })}
last updated: ${DateTime.fromISO(params.lastUpdated ?? '').toLocaleString({
                  ...DateTime.DATE_SHORT
                })}
note: ${params.note}`}
              </pre>
            </Typography>
          )
        })
      );
    });
    dispatch(setConfirmDialogProps(undefined));
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteClick = async (params: SavedData) => {
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex: dialogZIndex,
          onClose: resolve,
          buttons: [
            {text: 'Confirm', res: 'ok'},
            {text: 'Cancel', res: 'cancel', autoFocus: true}
          ],
          title: 'Warning!',
          message: 'Once deleted, it cannot be restored. Are you Sure?'
        })
      );
    });
    dispatch(setConfirmDialogProps(undefined));
    // eslint-disable-next-line no-empty
    if (ret === 'ok') {
      await instance.delete(`/api/gd/delete/${params.id}/`);
      await updateData();
    }
  };

  if (error) {
    // eslint-disable-next-line no-alert
    alert(error);
  }

  return (
    <Dialog {...props} onClose={handleClose} open={open}>
      <DialogTitle>Choose your file..</DialogTitle>
      <DialogContent>
        {loading || !listFiles ? (
          <CircularProgress />
        ) : (
          <Grid container rowSpacing={1} columnSpacing={{xs: 1, sm: 2, md: 3}}>
            {listFiles.map((item) => (
              <Grid item xs={6} key={item.filename}>
                <Item>
                  <ImageSelectable
                    // focusRipple
                    key={item.filename}
                    onClick={() => {
                      handleFileClick(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.keyCode === 13) {
                        handleFileClick(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <ImageListItem key={item.filename}>
                      <img
                        src={`${baseURL}${item.thumbnail}`}
                        // srcSet={`${item.img}?w=248&fit=crop&auto=format&dpr=2 2x`}
                        alt={item.filename}
                        loading="lazy"
                      />
                      <ImageListItemBar
                        title={item.filename}
                        subtitle={
                          <>
                            <Box component="div">{item.note}</Box>
                            <Box component="div" sx={{pt: 1, fontSize: 0.3}}>
                              last updated:&nbsp;
                              {DateTime.fromISO(
                                item.lastUpdated
                              ).toLocaleString({
                                ...DateTime.DATE_SHORT
                              })}
                            </Box>
                          </>
                        }
                        actionIcon={
                          <>
                            <IconButton
                              sx={{color: 'rgba(255, 255, 255, 0.54)'}}
                              aria-label={`info about ${item.filename}`}
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleInfoClick(item);
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              sx={{color: 'rgba(255, 255, 255, 0.54)'}}
                              aria-label={`info about ${item.filename}`}
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(item);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        }
                      />
                    </ImageListItem>
                  </ImageSelectable>
                </Item>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}
