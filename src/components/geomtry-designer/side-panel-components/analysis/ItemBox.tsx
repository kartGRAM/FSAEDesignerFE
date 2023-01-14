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
import {setDraggingNewTestFlowNode} from '@store/reducers/uiTempGeometryDesigner';
import {useDispatch} from 'react-redux';
import {Item} from '@gd/analysis/FlowNode';
import {v4 as uuidv4} from 'uuid';

export function ItemBox() {
  const dispatch = useDispatch();
  const ref = React.useRef<HTMLSpanElement>(null);

  const handleDragStart = React.useCallback(
    (item: Item, e: React.DragEvent<HTMLLIElement>) => {
      e.dataTransfer.effectAllowed = 'move';

      if (ref.current) e.dataTransfer.setDragImage(ref.current, 0, 0);
      dispatch(setDraggingNewTestFlowNode(item));
    },
    []
  );

  const handleDragEnd = React.useCallback(() => {
    dispatch(setDraggingNewTestFlowNode(null));
  }, []);

  return (
    <Box component="div">
      <Toolbar />
      <Divider />
      <List>
        {getItems().map((item) => {
          if (item === 'divider') return <Divider key={uuidv4()} />;
          return (
            <ListItem
              key={item.className}
              disablePadding
              draggable
              onDragStart={(e) => handleDragStart(item, e)}
              onDragEnd={handleDragEnd}
            >
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <span ref={ref} />
    </Box>
  );
}
