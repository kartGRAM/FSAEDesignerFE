import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {root} from '@app/utils/helpers';

export interface BannerBoxProps {
  img?: string;
  title: string;
  description: string;
  navigateTo: string;
}

const BannerBox = ({
  img = '/img/photo1.png',
  title,
  description,
  navigateTo
}: BannerBoxProps) => {
  // eslint-disable-next-line no-unused-vars
  const [t] = useTranslation();
  const screenSize = useSelector((state: any) => state.ui.screenSize);

  return (
    <Link to={navigateTo} className="small-box-footer">
      <div className={`card card-widget widget-user shadow-${screenSize}`}>
        <div
          className="widget-user-header text-white"
          style={{
            height: '200px',
            background: `url('${root}${img}')`,
            backgroundPosition: 'center, center'
          }}
        >
          <h3 className="widget-user-username text-left">{title}</h3>
          <h5 className="widget-user-desc text-left">{description}</h5>
        </div>
      </div>
    </Link>
  );
};

export default BannerBox;
