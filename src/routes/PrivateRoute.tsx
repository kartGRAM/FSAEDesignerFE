import React, {useEffect} from 'react';
import {Outlet} from 'react-router-dom';
import {useSelector, useDispatch} from 'react-redux';
import {loginUser} from '@store/reducers/auth';
import {checkLoggedIn} from '../services/auth';

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: any) => state.auth.isLoggedIn);

  const apiURL = useSelector((state: any) => state.auth.apiURLBase);

  useEffect(() => {
    const func = async () => {
      const payload = await checkLoggedIn(apiURL);
      if (payload) {
        dispatch(loginUser());
      } else {
        window.location.href = `${apiURL}login/`;
      }
    };
    func();
  });
  return isLoggedIn ? (
    <Outlet />
  ) : (
    <div className="preloader flex-column justify-content-center align-items-center">
      <img
        className="animation__shake"
        src="/img/logo.png"
        alt="AdminLTELogo"
        height="60"
        width="60"
      />
    </div>
  );
};

export default PrivateRoute;
