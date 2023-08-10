import {BannerBox} from '@app/components/AdminLTE';
import React from 'react';

const Top = () => {
  return (
    <div className="container-fluid vh-container d-flex flex-column align-items-center justify-content-center">
      <div>
        <h1 className="brand-text font-weight-light text-center mb-4 mt-4">
          Chose Your Application
        </h1>
      </div>
      <div className="row justify-content-center w-100">
        <div className="col-lg-8 col-12">
          <BannerBox
            title="Tire Data Analyzer Ver. 0.1"
            description="fit your tire model"
            navigateTo="/tire-data-analyzer"
          />
        </div>
      </div>
      {/* /.row */}
      <div className="row justify-content-center w-100">
        <div className="col-lg-8 col-12">
          <BannerBox
            title="Geometry Designer Ver. 0.1"
            description="design your suspension geometries"
            navigateTo="/geometry-designer"
            img="/img/geometry.png"
          />
        </div>
      </div>
      {/* /.row */}
      <div className="row justify-content-center w-100">
        <div className="col-lg-8 col-12">
          <BannerBox
            title="Simulater Ver. 0.1"
            description="check your vehicles"
            navigateTo="/simulator"
          />
        </div>
      </div>
      {/* /.row */}
    </div>
  );
};

export default Top;
