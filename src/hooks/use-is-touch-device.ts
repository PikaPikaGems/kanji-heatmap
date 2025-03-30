import React from "react";

export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    const touchDetect = () => {
      setIsTouchDevice(true);
      window.removeEventListener("touchstart", touchDetect);
    };

    window.addEventListener("touchstart", touchDetect, { once: true });

    return () => {
      window.removeEventListener("touchstart", touchDetect);
    };
  }, []);

  // Alternatively:

  //  React.useEffect(() => {
  //    const mediaQuery = window.matchMedia('(pointer: coarse)');
  //    const updateTouchDevice = () => setIsTouchDevice(mediaQuery.matches);
  //    updateTouchDevice();
  //    mediaQuery.addEventListener('change', updateTouchDevice);
  //    return () => mediaQuery.removeEventListener('change', updateTouchDevice);
  //  }, []);

  return isTouchDevice;
};
