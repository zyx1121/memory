'use client'

import { ClusterThumbnail } from '@/components/cluster-thumbnail';
import { PhotoData } from '@/types/photo';
import { Loader } from '@googlemaps/js-api-loader';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [photoClusters, setPhotoClusters] = useState<PhotoData[][]>([]);
  const [selectedCluster, setSelectedCluster] = useState<PhotoData[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const preloadImage = useCallback((src: string) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch('/api/photos');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const fetchedClusters = await response.json();
        setPhotoClusters(fetchedClusters);

        const preloadPromises = fetchedClusters.flat().flatMap((photo: PhotoData) => [
          preloadImage(photo.thumbnail),
          preloadImage(photo.src)
        ]);

        await Promise.all(preloadPromises);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading photos:', error);
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [preloadImage]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: 'weekly',
      });

      const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

      const map = new Map(mapRef.current as HTMLElement, {
        center: { lat: 25.003385192865906, lng: 121.52720552731212 },
        zoom: 12,
        disableDefaultUI: true,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID as string,
      });

      photoClusters.forEach((cluster) => {
        const firstPhoto = cluster[0];
        const thumbnails: PhotoData[] = cluster.slice(0, 5);

        const markerElement = document.createElement('div');
        const root = createRoot(markerElement);
        root.render(<ClusterThumbnail thumbnails={thumbnails} size={80} />);

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: firstPhoto.lat, lng: firstPhoto.lng },
          content: markerElement,
          title: `Cluster of ${cluster.length} photos`,
        });

        marker.addListener('click', () => {
          setSelectedCluster(cluster);
          setCurrentPhotoIndex(0);
        });
      });
    };

    if (photoClusters.length > 0) {
      initMap();
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [photoClusters]);

  const handleNextPhoto = useCallback(() => {
    if (selectedCluster) {
      const nextIndex = (currentPhotoIndex + 1) % selectedCluster.length;
      setCurrentPhotoIndex(nextIndex);

      const nextNextIndex = (nextIndex + 1) % selectedCluster.length;
      preloadImage(selectedCluster[nextNextIndex].src);
    }
  }, [selectedCluster, currentPhotoIndex, preloadImage]);

  const handlePrevPhoto = useCallback(() => {
    if (selectedCluster) {
      const prevIndex = (currentPhotoIndex - 1 + selectedCluster.length) % selectedCluster.length;
      setCurrentPhotoIndex(prevIndex);

      const prevPrevIndex = (prevIndex - 1 + selectedCluster.length) % selectedCluster.length;
      preloadImage(selectedCluster[prevPrevIndex].src);
    }
  }, [selectedCluster, currentPhotoIndex, preloadImage]);

  const handleClosePhoto = () => {
    setIsClosing(true);
  };

  useEffect(() => {
    if (isClosing) {
      setSelectedCluster(null);
      setIsClosing(false);
    }
  }, [isClosing]);

  useEffect(() => {
    if (selectedCluster) {
      Promise.all(selectedCluster.map((photo: PhotoData) =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = photo.src;
        })
      )).catch((error) => console.error('Error loading selected cluster photos:', error));
    }
  }, [selectedCluster]);

  const calculateImageSize = (originalWidth: number, originalHeight: number) => {
    const maxWidth = windowSize.width * 0.8;
    const maxHeight = windowSize.height * 0.8;
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return { width: newWidth, height: newHeight };
  };

  useEffect(() => {
    const preloadOriginalImages = async () => {
      const allPhotos = photoClusters.flat();
      for (let i = 0; i < allPhotos.length; i += 10) {
        await Promise.all(
          allPhotos.slice(i, i + 10).map(photo => preloadImage(photo.src))
        );
      }
    };

    if (photoClusters.length > 0) {
      preloadOriginalImages();
    }
  }, [photoClusters, preloadImage]);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="w-dvw h-dvh flex items-center justify-center fixed inset-0 z-50 bg-background"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-32 h-32 border-t-2 border-white rounded-full blur-lg"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <main className='w-dvw h-dvh relative p-2'>
        <div ref={mapRef} className="w-full h-full border border-input rounded-lg" />
        <AnimatePresence>
          {selectedCluster && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePhoto}
            >
              <motion.div
                className="relative max-w-4xl max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {selectedCluster[currentPhotoIndex] && (
                    <div className="relative rounded-2xl overflow-hidden shadow-sm bg-white/30 backdrop-blur-sm border transition-shadow duration-300 p-1">
                      <motion.div
                        key={currentPhotoIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {(() => {
                          const { width, height } = calculateImageSize(
                            selectedCluster[currentPhotoIndex].width,
                            selectedCluster[currentPhotoIndex].height
                          );
                          return (
                            <Image
                              src={selectedCluster[currentPhotoIndex].src}
                              alt={`Photo ${currentPhotoIndex + 1}`}
                              width={width}
                              height={height}
                              className="w-full h-full rounded-xl object-contain"
                              placeholder="blur"
                              blurDataURL={selectedCluster[currentPhotoIndex].thumbnail}
                              priority={currentPhotoIndex === 0}
                            />
                          );
                        })()}
                      </motion.div>
                    </div>
                  )}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence >
      </main >
      <footer className="z-99 fixed bottom-2 right-2 w-80 h-8 bg-background rounded-tl-[.75rem] hidden sm:block">
        <div className="absolute bottom-0 -left-4 w-4 h-4 bg-transparent rounded-br-lg shadow-[.5rem_0_0_0_theme(colors.background)]"></div>
        <div className="absolute -top-4 right-0 w-4 h-4 bg-transparent rounded-br-lg shadow-[0_.5rem_0_0_theme(colors.background)]"></div>
        <div className="absolute bottom-0 right-0 w-[calc(100%-.5rem)] h-[calc(100%-.5rem)] border border-input rounded-lg flex items-center justify-center text-muted-foreground text-xs">
          © {new Date().getFullYear()} Loki
        </div>
      </footer>
    </>
  );
}
