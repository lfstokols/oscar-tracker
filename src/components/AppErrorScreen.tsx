import {Container} from '@mui/material';
import * as React from 'react';
import ErrorPage from '../assets/404page.png';
import MobileErrorPage from '../assets/404page_mobile.png';

export default function AppErrorScreen({
  isFullScreen,
}: {
  isFullScreen: boolean;
}): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = React.useState<string>(ErrorPage);

  React.useEffect(() => {
    const updateImage = () => {
      let width: number;
      let height: number;

      if (isFullScreen) {
        width = window.innerWidth;
        height = window.innerHeight;
      } else {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      }

      if (width === 0 || height === 0) return;

      const containerAspectRatio = width / height;
      const aspectRatio1_1 = 1; // 1:1
      const aspectRatio2_3 = 2 / 3; // 2:3

      // Calculate which aspect ratio is closer to the container
      const diff1_1 = Math.abs(containerAspectRatio - aspectRatio1_1);
      const diff2_3 = Math.abs(containerAspectRatio - aspectRatio2_3);

      // Choose the image with the closer aspect ratio
      // ErrorPage is 1:1, MobileErrorPage is 2:3
      setImageSrc(diff1_1 < diff2_3 ? ErrorPage : MobileErrorPage);
    };

    updateImage();
    window.addEventListener('resize', updateImage);
    return () => window.removeEventListener('resize', updateImage);
  }, [isFullScreen]);

  return (
    <Container
      ref={containerRef}
      sx={{
        height: isFullScreen ? '100vh' : '100%',
        width: isFullScreen ? '100vw' : '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : undefined,
        left: isFullScreen ? 0 : undefined,
        zIndex: isFullScreen ? 9999 : undefined,
        backgroundColor: isFullScreen ? 'background.default' : 'transparent',
      }}>
      <img
        alt="Error"
        src={imageSrc}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
    </Container>
  );
}
