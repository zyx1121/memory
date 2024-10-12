import ExifReader from 'exifreader';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';

interface PhotoData {
    src: string;
    thumbnail: string;
    lat: number;
    lng: number;
    width: number;
    height: number;
}

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
                    console.error(`Error reading EXIF data for ${file}:`, error);
                    // 如果無法讀取 EXIF 數據，使用默認值
                    return {
                        src: `/photos/${file}`,
                        thumbnail: `/photos/${file}`,
                        lat: 25.0330,
                        lng: 121.5654,
                        width: metadata.width,
                        height: metadata.height,
                    };
                }

                let lat = 25.0330;  // 默認值，可以根據需要調整
                let lng = 121.5654; // 默認值，可以根據需要調整

                if (tags.GPSLatitude && tags.GPSLongitude) {
                    lat = parseFloat(tags.GPSLatitude.description);
                    lng = parseFloat(tags.GPSLongitude.description);
                }

                return {
                    src: `/photos/${file}`,
                    thumbnail: `/photos/${file}`,
                    lat,
                    lng,
                    width: metadata.width,
                    height: metadata.height,
                };
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
                // 如果處理文件時出錯，返回 null
                return null;
            }
        })
    );

    // 過濾掉 null 值（處理失敗的圖片）
    const validPhotoData = photoData.filter(photo => photo !== null) as PhotoData[];

    const clusteredPhotos = clusterPhotos(validPhotoData, 0.005);

    return NextResponse.json(clusteredPhotos);
}
