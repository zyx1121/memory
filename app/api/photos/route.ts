import { PhotoData } from '@/types/photo';
import ExifReader from 'exifreader';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';

// 定義一個函數來檢查文件是否為圖片
function isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
}

function clusterPhotos(photos: PhotoData[], distanceThreshold: number): PhotoData[][] {
    const clusters: PhotoData[][] = [];

    photos.forEach(photo => {
        let addedToCluster = false;
        for (const cluster of clusters) {
            const clusterCenter = cluster[0];
            const distance = Math.sqrt(
                Math.pow(photo.lat - clusterCenter.lat, 2) +
                Math.pow(photo.lng - clusterCenter.lng, 2)
            );
            if (distance < distanceThreshold) {
                cluster.push(photo);
                addedToCluster = true;
                break;
            }
        }
        if (!addedToCluster) {
            clusters.push([photo]);
        }
    });

    return clusters;
}

export async function GET() {
    const photosDir = path.join(process.cwd(), 'public', 'photos');
    const files = await fs.readdir(photosDir);

    const photoData = await Promise.all(
        files.filter(isImageFile).map(async (file) => {
            try {
                const filePath = path.join(photosDir, file);
                const buffer = await fs.readFile(filePath);
                const metadata = await sharp(buffer).metadata();

                let tags;
                try {
                    tags = await ExifReader.load(buffer);
                } catch (error) {
                    console.error(`讀取 ${file} 的 EXIF 數據時出錯:`, error);
                    return createDefaultPhotoData(file, metadata);
                }

                const { lat, lng } = getGPSCoordinates(tags);

                return {
                    src: `/photos/${file}`,
                    thumbnail: `/photos/thumbnails/${file}`,
                    filename: file,
                    lat,
                    lng,
                    width: metadata.width,
                    height: metadata.height,
                } as PhotoData;
            } catch (error) {
                console.error(`處理文件 ${file} 時出錯:`, error);
                return null;
            }
        })
    );

    const validPhotoData = photoData.filter(photo => photo !== null) as PhotoData[];
    const clusteredPhotos = clusterPhotos(validPhotoData, 0.005);

    return NextResponse.json(clusteredPhotos);
}

function createDefaultPhotoData(file: string, metadata: sharp.Metadata): PhotoData {
    return {
        src: `/photos/${file}`,
        thumbnail: `/photos/thumbnails/${file}`,
        filename: file,
        lat: 25.0330,
        lng: 121.5654,
        width: metadata.width || 0,
        height: metadata.height || 0,
    };
}

interface ExifTags {
    GPSLatitude?: { description: string };
    GPSLongitude?: { description: string };
}

function getGPSCoordinates(tags: ExifTags): { lat: number; lng: number } {
    if (tags.GPSLatitude && tags.GPSLongitude) {
        return {
            lat: parseFloat(tags.GPSLatitude.description),
            lng: parseFloat(tags.GPSLongitude.description),
        };
    }
    return { lat: 25.0330, lng: 121.5654 };
}
