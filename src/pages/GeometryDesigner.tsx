/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import {ContentHeader} from '@app/components/AdminLTE';
import {useDispatch, useSelector} from 'react-redux';
import {toggleFullScreen} from '@app/store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
// import {render} from '@app/geometryDesigner/ElementsRenderer';
import ElementsTreeView from '@app/components/geomtry-designer/ElementsTreeView';
import GDAppBar from '@app/components/geomtry-designer/GDAppBar';
import MiniDrawer from '@app/components/geomtry-designer/SideBar';
import GDScene from '@app/components/geomtry-designer/GDScene';
import AssemblyCreactor from '@gdComponents/AssemblyCreator';
import SidePanel from '@gdComponents/SidePanel';
import DialogRoot from '@gdComponents/dialog-components/DialogRoot';
import {numberToRgb} from '@app/utils/helpers';
import Box from '@mui/material/Box';
import shortCutKeys from '@gd/ShortCutKeys';
import CssBaseLine from '@mui/material/CssBaseline';
import {SceneConfigUI} from '@gdComponents/r3f-components/SceneConfigUI';

const GeometryDesigner = () => {
  const isFullScreen = useSelector(
    (state: RootState) => state.uitgd.isFullScreen
  );

  const fullScreenZ = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex
  );
  const dispatch = useDispatch();

  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.present.backgroundColor
  );

  React.useEffect(() => {
    window.addEventListener('keydown', shortCutKeys, false);
    return () => {
      window.removeEventListener('keydown', shortCutKeys, false);
    };
  });

  return (
    <CssBaseLine>
      <div>
        <ContentHeader title="Geomtry Designer" />
        <section className="content">
          <div
            className={`container-fluid p-0
          ${isFullScreen ? 'fullscreen' : 'content-full-height'}
          d-flex flex-column
          `}
            style={{zIndex: fullScreenZ}}
            id="gdAppArea"
          >
            <DialogRoot />
            <GDAppBar />

            <Box
              component="div"
              className="position-relative w-100 d-flex"
              sx={{
                height: 'calc(100% - 36px)'
              }}
            >
              <MiniDrawer />
              <div
                className="h-100 w-100 position-relative d-flex"
                id="gdMainWindow"
              >
                <SidePanel />
                <Box
                  component="div"
                  className="h-100 w-100 position-relative"
                  sx={{
                    paddingLeft: '2px',
                    backgroundColor: numberToRgb(bgColor)
                  }}
                >
                  <GDScene />
                  <button
                    type="button"
                    className="btn btn-tool fullscreen-btn"
                    onClick={() => dispatch(toggleFullScreen())}
                  >
                    <i
                      className={`fas fa-${
                        isFullScreen ? 'compress' : 'expand'
                      }`}
                    />
                  </button>
                  <ElementsTreeView />
                  <AssemblyCreactor />
                </Box>
              </div>
            </Box>
            <Box
              component="div"
              sx={{position: 'fixed', bottom: 300, left: 60}}
            >
              <SceneConfigUI />
            </Box>
          </div>
        </section>
      </div>
    </CssBaseLine>
  );
};

export default GeometryDesigner;
