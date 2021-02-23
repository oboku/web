import React, { FC } from 'react';
import { Typography, useTheme } from '@material-ui/core';

export const OrDivider: FC<{ title?: string, style?: React.CSSProperties }> = ({ title = 'or', style }) => {
  const theme = useTheme()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
      width: '100%',
      ...style,
    }}>
      <div style={{
        borderBottom: '1px solid black',
        height: 1,
        width: '100%',
        opacity: '30%'
      }}>
      </div>
      <div style={{
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
      }}>
        <Typography>{title}</Typography>
      </div>
      <div style={{
        borderBottom: '1px solid black',
        width: '100%',
        opacity: '30%'
      }}>
      </div>
    </div>
  );
}