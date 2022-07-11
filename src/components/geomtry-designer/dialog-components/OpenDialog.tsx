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
  setSaveAsDialogOpen
} from '@store/reducers/uiTempGeometryDesigner';
import {
  getListSetTopAssemblyParams,
  SetTopAssemblyParams,
  setTopAssembly
} from '@store/reducers/dataGeometryDesigner';
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
import ConfirmDialog, {
  ConfirmDialogProps
} from '@gdComponents/dialog-components/ConfirmDialog';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import {instance} from '@app/utils/axios';

const Item = styled(Paper)(({theme}) => ({
  backgroundColor: '#111111',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ImageButton = styled(ButtonBase)(({theme}) => ({
  '& .MuiImageListItem-root': {
    opacity: 0.7
  },
  '&:hover, &.Mui-focusVisible': {
    // zIndex: 1,
    '& .MuiImageListItem-root': {
      opacity: 1.0
    }
  }
}));

interface OpenDialogProps extends DialogProps {
  zindex: number;
}
export function OpenDialog(props: OpenDialogProps) {
  const {zindex} = props;
  const [confirmConfig, setConfirmConfig] = React.useState<
    ConfirmDialogProps | undefined
  >();
  const baseURL = useSelector((state: RootState) => state.auth.apiURLBase);
  const open = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.openDialogOpen
  );
  const changed = useSelector((state: RootState) => state.dgd.changed);
  const filename = useSelector((state: RootState) => state.dgd.filename);
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{data, loading, error}, updateData] = useAxios({
    url: '/api/gd/get_all_user_files/',
    method: 'GET'
  });
  const {onClose} = props;
  const listFiles = data ? getListSetTopAssemblyParams(data) : null;

  const handleClose = (e: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (onClose) onClose(e, reason);
    dispatch(setOpenDialogOpen({open: false}));
  };
  const handleFileClick = async (params: SetTopAssemblyParams) => {
    if (changed) {
      const ret = await new Promise<string>((resolve) => {
        setConfirmConfig({
          zindex: zindex + 1,
          onClose: resolve,
          title: 'Warning!',
          message: `${filename} is changed. Do you seve the file?`,
          buttons: [
            {text: 'Yes', res: 'yes'},
            {text: 'No', res: 'no'},
            {text: 'Cancel', res: 'cancel', autoFocus: true}
          ]
        });
      });
      setConfirmConfig(undefined);
      if (ret === 'yes') {
        dispatch(setSaveAsDialogOpen({open: true}));
        dispatch(setOpenDialogOpen({open: false}));
      }
      if (ret === 'no') {
        dispatch(setTopAssembly(params));
        dispatch(setOpenDialogOpen({open: false}));
      }
    } else {
      dispatch(setTopAssembly(params));
      dispatch(setOpenDialogOpen({open: false}));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInfoClick = async (params: SetTopAssemblyParams) => {
    await new Promise<string>((resolve) => {
      setConfirmConfig({
        zindex: zindex + 1,
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
      });
    });
    setConfirmConfig(undefined);
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteClick = async (params: SetTopAssemblyParams) => {
    const ret = await new Promise<string>((resolve) => {
      setConfirmConfig({
        zindex: zindex + 1,
        onClose: resolve,
        buttons: [
          {text: 'Confirm', res: 'ok'},
          {text: 'Cancel', res: 'cancel', autoFocus: true}
        ],
        title: 'Warning!',
        message: 'Once deleted, it cannot be restored. Are you Sure?'
      });
    });
    setConfirmConfig(undefined);
    // eslint-disable-next-line no-empty
    if (ret === 'ok') {
      await instance.delete(`/api/gd/delete/${params.id}/`);
      await updateData();
    }
  };

  if (error) {
    alert(error);
  }

  return (
    <>
      <Dialog {...props} onClose={handleClose} open={open}>
        <DialogTitle>Choose your file..</DialogTitle>
        <DialogContent>
          {loading || !listFiles ? (
            <CircularProgress />
          ) : (
            <Grid
              container
              rowSpacing={1}
              columnSpacing={{xs: 1, sm: 2, md: 3}}
            >
              {listFiles.map((item) => (
                <Grid item xs={6}>
                  <Item>
                    <ImageButton
                      focusRipple
                      key={item.filename}
                      onClick={() => {
                        handleFileClick(item);
                      }}
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
                              <Box>{item.note}</Box>
                              <Box sx={{pt: 1, fontSize: 0.3}}>
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
                    </ImageButton>
                  </Item>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
      {confirmConfig && <ConfirmDialog {...confirmConfig} />}
    </>
  );
}
