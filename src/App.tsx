import React, {useEffect} from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Main from '@modules/main/Main';
// import Login from '@modules/login/Login';
// import Register from '@modules/register/Register';
// import ForgetPassword from '@modules/forgot-password/ForgotPassword';
// import RecoverPassword from '@modules/recover-password/RecoverPassword';
import {useWindowSize} from '@app/hooks/useWindowSize';
import {calculateWindowSize} from '@app/utils/helpers';
import {useDispatch, useSelector} from 'react-redux';
import {setWindowSize} from '@app/store/reducers/ui';

import Top from '@app/pages/Top';
import TireDataAnalyzer from '@pages/TireDataAnalyzer';
import GeometryDesigner from '@pages/GeometryDesigner';
import Simulator from '@pages/Simulator';
import SubMenu from '@pages/SubMenu';
import Profile from '@pages/profile/Profile';

// import PublicRoute from './routes/PublicRoute';
import PrivateRoute from './routes/PrivateRoute';

const App = () => {
  const windowSize = useWindowSize();
  const screenSize = useSelector((state: any) => state.ui.screenSize);
  const dispatch = useDispatch();

  useEffect(() => {
    const size = calculateWindowSize(windowSize.width);
    if (screenSize !== size) {
      dispatch(setWindowSize(size));
    }
  }, [windowSize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PrivateRoute />}>
          <Route path="/" element={<Main />}>
            <Route path="/sub-menu-1" element={<SubMenu />} />
            <Route path="/tire-data-analyzer" element={<TireDataAnalyzer />} />
            <Route path="/geometry-designer" element={<GeometryDesigner />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Top />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
