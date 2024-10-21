import Image from 'next/image';
import React from 'react';
import { PhotoData } from '@/types/photo';

interface ClusterThumbnailProps {
  thumbnails: PhotoData[];
  size: number;
}

export const ClusterThumbnail = React.memo(function ClusterThumbnail({ thumbnails, size }: ClusterThumbnailProps) {
  const mainSize = size * 2;
  const smallSize = size;

  const mainDimensions = getScaledDimensions(thumbnails[0].width, thumbnails[0].height, mainSize - 4);

  const ThumbnailImage = ({ thumbnail, dimensions, alt }: ThumbnailImageProps) => (
    <Image
      src={thumbnail.thumbnail}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      className="rounded-xl object-cover w-full h-full"
      placeholder="blur"
      blurDataURL={thumbnail.thumbnail}
      priority
    />
  );

  // Extract ThumbnailContainer component
  const ThumbnailContainer = ({ thumbnail, size, position }: ThumbnailContainerProps) => (
    <div style={{ position: 'absolute', ...position }}>
      <div className="relative rounded-2xl overflow-hidden shadow-sm bg-white/30 backdrop-blur-sm border transition-shadow duration-300 p-1"
        style={{ width: size, height: size }}
      >
        <ThumbnailImage thumbnail={thumbnail} dimensions={getScaledDimensions(thumbnail.width, thumbnail.height, size)} alt={`Thumbnail ${position.toString()}`} />
      </div>
    </div>
  );

  return (
    <div style={{ width: mainSize, height: mainSize, position: 'relative' }}>
      <div className="relative rounded-2xl overflow-hidden shadow-sm bg-white/30 backdrop-blur-sm border transition-shadow duration-300 p-1"
        style={{ width: mainDimensions.width, height: mainDimensions.height }}
      >
        <ThumbnailImage thumbnail={thumbnails[0]} dimensions={mainDimensions} alt="Main thumbnail" />
      </div>
      {thumbnails.length > 1 && (
        <ThumbnailContainer thumbnail={thumbnails[1]} size={smallSize} position={{ left: -smallSize / 2, bottom: -smallSize / 8 }} />
      )}
      {thumbnails.length > 2 && (
        <ThumbnailContainer thumbnail={thumbnails[2]} size={smallSize} position={{ left: smallSize / 4, bottom: -smallSize / 4 }} />
      )}
      {thumbnails.length > 3 && (
        <ThumbnailContainer thumbnail={thumbnails[3]} size={smallSize} position={{ left: smallSize, bottom: -smallSize / 6 }} />
      )}
    </div>
  );
});

const getScaledDimensions = (width: number, height: number, maxSize: number) => {
  const aspectRatio = width / height;
  if (width > height) {
    return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
  } else {
    return { width: Math.round(maxSize * aspectRatio), height: maxSize };
  }
};

interface ThumbnailImageProps {
  thumbnail: PhotoData;
  dimensions: { width: number; height: number };
  alt: string;
}

interface ThumbnailContainerProps {
  thumbnail: PhotoData;
  size: number;
  position: { [key: string]: number };
}

ClusterThumbnail.displayName = 'ClusterThumbnail';
