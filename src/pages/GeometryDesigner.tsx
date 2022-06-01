/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import {ContentHeader} from '@components';
import {useDispatch, useSelector} from 'react-redux';
import {toggleFullScreen} from '@app/store/reducers/uiGeometryDesigner';
import {RootState} from '@store/store';
// import {render} from '@app/geometryDesigner/ElementsRenderer';
import ElementsTreeView from '@app/components/geomtry-designer/ElementsTreeView';
import GDAppBar from '@app/components/geomtry-designer/GDAppBar';
import MiniDrawer from '@app/components/geomtry-designer/SideBar';
import GDScene from '@app/components/geomtry-designer/GDScene';

const GeometryDesigner = () => {
  const isFullScreen = useSelector(
    (state: RootState) => state.ugd.isFullScreen
  );
  const fullScreenZ = useSelector(
    (state: RootState) => state.ugd.fullScreenZIndex
  );
  const dispatch = useDispatch();

  return (
    <div>
      <ContentHeader title="Geomtry Designer" />
      <section className="content">
        <div
          className={`container-fluid p-0
          ${isFullScreen ? 'fullscreen' : 'content-full-height'}
          d-flex flex-column
          `}
          style={{zIndex: fullScreenZ}}
        >
          <GDAppBar />

          <div className="h-100 w-100 position-relative d-flex">
            <MiniDrawer />
            <div className="h-100 w-100 position-relative">
              <GDScene />
              <button
                type="button"
                className="btn btn-tool fullscreen-btn"
                onClick={() => dispatch(toggleFullScreen())}
              >
                <i
                  className={`fas fa-${isFullScreen ? 'compress' : 'expand'}`}
                />
              </button>

              <ElementsTreeView />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GeometryDesigner;
