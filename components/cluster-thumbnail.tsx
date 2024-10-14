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
  const borderWidth = 2;

  if (thumbnails.length === 0) {
    return <div>No images</div>;
  }

  const getScaledDimensions = (width: number, height: number, maxSize: number) => {
    const aspectRatio = width / height;
    if (width > height) {
      return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
    } else {
      return { width: Math.round(maxSize * aspectRatio), height: maxSize };
    }
  };

  const mainDimensions = getScaledDimensions(thumbnails[0].width, thumbnails[0].height, mainSize - borderWidth * 2);

  const ThumbnailImage = ({ thumbnail, dimensions, alt }: { thumbnail: PhotoData; dimensions: { width: number; height: number }; alt: string }) => (
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

  return (
    <div style={{ width: mainSize, height: mainSize, position: 'relative' }}>
      <div className="rounded-xl overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
        {thumbnails[0]?.thumbnail ? (
          <ThumbnailImage thumbnail={thumbnails[0]} dimensions={mainDimensions} alt="Main thumbnail" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">No image</div>
        )}
      </div>
      {thumbnails.length > 1 && (
        <div style={{ position: 'absolute', right: -smallSize / 2, bottom: -smallSize / 2 }}>
          <div className="rounded-xl overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
            {thumbnails[1]?.thumbnail ? (
              <ThumbnailImage
                thumbnail={thumbnails[1]}
                dimensions={getScaledDimensions(thumbnails[1].width, thumbnails[1].height, smallSize - borderWidth * 2)}
                alt="Secondary thumbnail"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">No image</div>
            )}
          </div>
        </div>
      )}
      {thumbnails.length > 2 && (
        <div style={{ position: 'absolute', left: -smallSize / 2, bottom: -smallSize / 2 }}>
          <div className="rounded-xl overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
            {thumbnails[2]?.thumbnail ? (
              <ThumbnailImage
                thumbnail={thumbnails[2]}
                dimensions={getScaledDimensions(thumbnails[2].width, thumbnails[2].height, smallSize - borderWidth * 2)}
                alt="Tertiary thumbnail"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">No image</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ClusterThumbnail.displayName = 'ClusterThumbnail';
