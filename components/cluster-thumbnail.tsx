import Image from 'next/image';
import React from 'react';
import { PhotoData } from '@/types/photo';

interface ClusterThumbnailProps {
  thumbnails: PhotoData[];
  size: number;
}

export const ClusterThumbnail = React.memo(function ClusterThumbnail({ thumbnails, size }: ClusterThumbnailProps) {
  const mainSize = size * 1.5;
  const smallSize = size;
  const borderWidth = 1;

  if (thumbnails.length === 0) {
    return <div>No images</div>;
  }

  const mainDimensions = getScaledDimensions(thumbnails[0].width, thumbnails[0].height, mainSize - borderWidth * 2);

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
      <div className="rounded-xl overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
        {thumbnail?.thumbnail ? (
          <ThumbnailImage
            thumbnail={thumbnail}
            dimensions={getScaledDimensions(thumbnail.width, thumbnail.height, size - borderWidth * 2)}
            alt={`Thumbnail ${position.toString()}`}
          />
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center">No image</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ width: mainSize, height: mainSize, position: 'relative' }}>
      <div className="rounded-xl overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
        {thumbnails[0]?.thumbnail ? (
          <ThumbnailImage thumbnail={thumbnails[0]} dimensions={mainDimensions} alt="Main thumbnail" />
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center">No image</div>
        )}
      </div>
      {thumbnails.length > 1 && (
        <ThumbnailContainer
          thumbnail={thumbnails[1]}
          size={smallSize}
          position={{ right: -smallSize / 2, bottom: -smallSize / 2 }}
        />
      )}
      {thumbnails.length > 2 && (
        <ThumbnailContainer
          thumbnail={thumbnails[2]}
          size={smallSize}
          position={{ left: -smallSize / 2, bottom: -smallSize / 2 }}
        />
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
