import Image from 'next/image';
import React from 'react';

export interface ThumbnailData {
  src: string;
  width: number;
  height: number;
}

interface ClusterThumbnailProps {
  thumbnails: ThumbnailData[];
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

  return (
    <div style={{ width: mainSize, height: mainSize, position: 'relative' }}>
      <div className="rounded-md overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
        <Image
          src={thumbnails[0].src}
          alt="Main thumbnail"
          width={mainDimensions.width}
          height={mainDimensions.height}
          className="rounded-md object-cover w-full h-full"
          priority
        />
      </div>
      {thumbnails.length > 1 && (
        <div style={{ position: 'absolute', right: -smallSize / 2, bottom: -smallSize / 2 }}>
          <div className="rounded-md overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
            <Image
              src={thumbnails[1].src}
              alt="Secondary thumbnail"
              {...getScaledDimensions(thumbnails[1].width, thumbnails[1].height, smallSize - borderWidth * 2)}
              className="rounded-md object-cover w-full h-full"
            />
          </div>
        </div>
      )}
      {thumbnails.length > 2 && (
        <div style={{ position: 'absolute', left: -smallSize / 2, bottom: -smallSize / 2 }}>
          <div className="rounded-md overflow-hidden" style={{ border: `${borderWidth}px solid white` }}>
            <Image
              src={thumbnails[2].src}
              alt="Tertiary thumbnail"
              {...getScaledDimensions(thumbnails[2].width, thumbnails[2].height, smallSize - borderWidth * 2)}
              className="rounded-md object-cover w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
});

ClusterThumbnail.displayName = 'ClusterThumbnail';
