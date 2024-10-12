'use client'

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ClusterThumbnail, ThumbnailData } from '@/components/cluster-thumbnail';
import Image from 'next/image';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/loading-spinner';

interface PhotoData {
  src: string;
  thumbnail: string;
  lat: number;
  lng: number;
  width: number;
  height: number;
}

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [photoClusters, setPhotoClusters] = useState<PhotoData[][]>([]);
  const [selectedCluster, setSelectedCluster] = useState<PhotoData[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect for loading photos is running');
    const loadPhotos = async () => {
      try {
        console.log('Starting to fetch photos');
        const response = await fetch('/api/photos');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const clusterData = await response.json();
        console.log('Fetched cluster data:', clusterData);
        setPhotoClusters(clusterData);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading photos:', error);
        setIsLoading(false);
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
        mapId: "9648955677ddbcb6",
      });

      // 添加照片標記
      photoClusters.forEach((cluster) => {
        const firstPhoto = cluster[0];
        const thumbnails: ThumbnailData[] = cluster.map(photo => ({
          src: photo.thumbnail,
          width: photo.width,
          height: photo.height
        })).slice(0, 3);

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
          setCurrentPhotoIndex(0); // 重置當前照片索引
        });
      });
    };

    if (photoClusters.length > 0) {
      initMap();
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
      const timer = setTimeout(() => {
        setSelectedCluster(null);
        setIsClosing(false);
      }, 200); // 與動畫持續時間相同
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  useEffect(() => {
    if (selectedCluster) {
      // 當用戶選擇集群後，開始加載該集群的圖片
      Promise.all(selectedCluster.map((photo: PhotoData) =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = photo.src;
        })
      )).then(() => setImageLoading(false))
        .catch((error) => console.error('Error loading selected cluster images:', error));
    }
  }, [selectedCluster]);

  if (isLoading) {
    return (
      <div className="w-dvw h-dvh flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className='w-dvw h-dvh relative'>
      <div ref={mapRef} className="w-full h-full" />
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
              className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-full flex items-center justify-center">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <LoadingSpinner />
                  </div>
                )}
                <motion.div
                  key={currentPhotoIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <Image
                    src={selectedCluster[currentPhotoIndex].src}
                    alt={`Photo ${currentPhotoIndex + 1}`}
                    width={selectedCluster[currentPhotoIndex].width}
                    height={selectedCluster[currentPhotoIndex].height}
                    className="object-contain w-full h-full"
                    onLoad={() => setImageLoading(false)}
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
  );
}
