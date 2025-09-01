import React from 'react';
import { Box } from '@mui/material';

const Logo = ({ 
  variant = 'complete', // 'only', 'text', 'complete'
  size = 'medium', // 'small', 'medium', 'large'
  alt = 'Alt Clinic',
  sx = {},
  ...props 
}) => {
  const getLogoSrc = () => {
    switch (variant) {
      case 'only':
        return '/images/logo-only.png';
      case 'text':
        return '/images/logo-text.png';
      case 'complete':
      default:
        return '/images/logo-complete.png';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: '24px', width: 'auto' };
      case 'large':
        return { height: '80px', width: 'auto' };
      case 'medium':
      default:
        return { height: '40px', width: 'auto' };
    }
  };

  return (
    <Box
      component="img"
      src={getLogoSrc()}
      alt={alt}
      sx={{
        ...getSizeStyles(),
        objectFit: 'contain',
        ...sx
      }}
      {...props}
    />
  );
};

export default Logo;
