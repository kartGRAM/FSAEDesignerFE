import React from 'react';
import {Button} from '@mui/material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import BB, {ButtonProps} from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

const icons: any = {
  facebook: 'fab fa-facebook',
  google: 'fab fa-google',
  googlePlus: 'fab fa-google-plus'
};

export interface AppButtonProps extends ButtonProps {
  children: any;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: string;
  theme?: string;
}

const AppButton = ({
  children,
  isLoading,
  icon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  theme = 'primary',
  disabled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...otherProps
}: AppButtonProps) => {
  let spinnerTemplate;
  let iconTemplate;

  if (isLoading) {
    spinnerTemplate = (
      <Spinner
        className="ml-2"
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
    );
  }

  if (icon && icons[icon]) {
    iconTemplate = <i className={`${icons[icon]} mr-2`} />;
  }

  return (
    // eslint-disable-next-line react/button-has-type
    <Button
      // {...otherProps}
      disabled={isLoading || disabled}
    >
      {iconTemplate}
      {children}
      {spinnerTemplate}
    </Button>
  );
};

export default AppButton;
