'use client'

import { ClusterThumbnail } from '@/components/cluster-thumbnail';
import { PhotoData } from '@/types/photo';
import { Loader } from '@googlemaps/js-api-loader';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [photoClusters, setPhotoClusters] = useState<PhotoData[][]>([]);
  const [selectedCluster, setSelectedCluster] = useState<PhotoData[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch('/api/photos');
        if (!response.ok) {
          throw new Error(`HTTP 錯誤！狀態：${response.status}`);
        }
        const fetchedClusters = await response.json();
        setPhotoClusters(fetchedClusters);
      } catch (error) {
        console.error('加載照片時出錯：', error);
      }
    };

    loadPhotos();
  }, []);

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

      // 添加照片標記
      photoClusters.forEach((cluster) => {
        const firstPhoto = cluster[0];
        const thumbnails: PhotoData[] = cluster.slice(0, 3);

        const markerElement = document.createElement('div');
        const root = createRoot(markerElement);
        root.render(<ClusterThumbnail thumbnails={thumbnails} size={60} />);

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
      setTimeout(() => setIsLoading(false), 500); // Add a small delay to ensure smooth transition
    }
  }, [photoClusters]);

  const handleNextPhoto = () => {
    if (selectedCluster) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % selectedCluster.length);
    }
  };

  const handlePrevPhoto = () => {
    if (selectedCluster) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + selectedCluster.length) % selectedCluster.length);
    }
  };

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
      )).catch((error) => console.error('加載選定集群圖片時出錯：', error));
    }
  }, [selectedCluster]);

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
      <main className='w-dvw h-dvh relative p-4'>
        <div ref={mapRef} className="w-full h-full border border-input rounded-xl" />
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
                className="relative max-w-4xl max-h-[90vh] border border-input rounded-xl overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div
                    key={currentPhotoIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <Image
                      src={selectedCluster[currentPhotoIndex].src}
                      alt={`照片 ${currentPhotoIndex + 1}`}
                      width={selectedCluster[currentPhotoIndex].width}
                      height={selectedCluster[currentPhotoIndex].height}
                      className="object-contain w-full h-full"
                      placeholder="blur"
                      blurDataURL={selectedCluster[currentPhotoIndex].thumbnail}
                      priority={currentPhotoIndex === 0}
                    />
                  </motion.div>
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
        </AnimatePresence>
      </main>
      <footer className="z-99 fixed bottom-4 right-4 w-80 h-12 bg-background rounded-tl-3xl hidden sm:block">
        <div className="absolute bottom-0 -left-8 w-8 h-4 bg-transparent rounded-br-xl shadow-[1rem_0_0_0_theme(colors.background)]"></div>
        <div className="absolute -top-8 right-0 w-4 h-8 bg-transparent rounded-br-xl shadow-[0_1rem_0_0_theme(colors.background)]"></div>
        <div className="absolute bottom-0 right-0 w-[calc(100%-1rem)] h-[calc(100%-1rem)] border border-input rounded-xl flex items-center justify-center text-foreground">
          © {new Date().getFullYear()} Loki
        </div>
      </footer>
    </>
  );
}
