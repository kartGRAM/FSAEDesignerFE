import * as React from 'react';
import {
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box
} from '@mui/material';
import {getItems} from '@gd/analysis/RestoreData';

export function ItemBox() {
  return (
    <Box component="div">
      <Toolbar />
      <Divider />
      <List>
        {getItems().map((item) => {
          if (item === 'divider') return <Divider />;
          return (
            <ListItem key={item.className} disablePadding>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
