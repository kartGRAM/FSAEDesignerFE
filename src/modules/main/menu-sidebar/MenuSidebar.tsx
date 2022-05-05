import React from 'react';
import {useSelector} from 'react-redux';
import {Link} from 'react-router-dom';
import {MenuItem} from '@components';
import {root} from '@app/utils/helpers';

export interface IMenuItem {
  name: string;
  path?: string;
  icon?: string;
  svg?: boolean;
  children?: Array<IMenuItem>;
}

export const MENU: IMenuItem[] = [
  {
    name: 'menusidebar.label.top',
    icon: 'fas fa-home',
    path: '/'
  },
  {
    name: 'menusidebar.label.tire-data-analyzer',
    path: '/tire-data-analyzer',
    svg: true,
    icon: '/img/tire_0.svg'
  },
  {
    name: 'menusidebar.label.geometry-designer',
    icon: 'fas fa-project-diagram',
    path: '/geometry-designer'
  },
  {
    name: 'menusidebar.label.simulator',
    icon: 'fas fa-flag-checkered',
    path: '/simulator'
  },
  {
    name: 'menusidebar.label.mainMenu',
    icon: 'fas fa-cog',
    children: [
      {
        name: 'menusidebar.label.subMenu',
        path: '/sub-menu-1'
      },

      {
        name: 'menusidebar.label.subMenu',
        path: '/sub-menu-1'
      }
    ]
  }
];

const MenuSidebar = () => {
  const user = useSelector((state: any) => state.auth.currentUser);
  const sidebarSkin = useSelector((state: any) => state.ui.sidebarSkin);
  const menuItemFlat = useSelector((state: any) => state.ui.menuItemFlat);
  const menuChildIndent = useSelector((state: any) => state.ui.menuChildIndent);

  return (
    <aside className={`main-sidebar elevation-4 ${sidebarSkin}`}>
      <Link to="/" className="brand-link">
        <img
          src={`${root}/img/logo.png`}
          alt="AdminLTE Logo"
          className="brand-image img-circle elevation-3"
          style={{opacity: '.8'}}
        />
        <span className="brand-text font-weight-light">FSAE Designer</span>
      </Link>
      <div className="sidebar">
        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
          <div className="image">
            <img
              src={user.picture || `${root}/img/default-profile.png`}
              className="img-circle elevation-2"
              alt="User"
            />
          </div>
          <div className="info">
            <Link to="/profile" className="d-block">
              {user.email}
            </Link>
          </div>
        </div>
        <nav className="mt-2 nav-sidebar">
          <ul
            className={`nav nav-pills nav-sidebar flex-column${
              menuItemFlat ? ' nav-flat' : ''
            }${menuChildIndent ? ' nav-child-indent' : ''}`}
            role="menu"
          >
            {MENU.map((menuItem: IMenuItem) => (
              <MenuItem key={menuItem.name} menuItem={menuItem} />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default MenuSidebar;
