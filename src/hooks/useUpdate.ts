import * as React from 'react';

export default function useUpdate(): () => void {
  const [, setState] = React.useState<number>(0);
  return () => {
    setState((prev) => (prev + 1) % 100000000);
  };
}
