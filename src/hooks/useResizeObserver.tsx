import {useEffect} from 'react';

const useResizeObserver = (elements: any, callback: any) => {
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      callback(entries);
    });

    elements.forEach((elem: any) => {
      // eslint-disable-next-line no-unused-expressions
      elem.current && resizeObserver.observe(elem.current);
    });

    return () => resizeObserver.disconnect();
  }, []);
};

export default useResizeObserver;
