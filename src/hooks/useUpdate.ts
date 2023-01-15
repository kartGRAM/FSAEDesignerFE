import * as React from 'react';

export default function useUpdate(): () => void {
  const [, setState] = React.useState<boolean>(false);
  return () => {
    setState((prev) => !prev);
  };
}
