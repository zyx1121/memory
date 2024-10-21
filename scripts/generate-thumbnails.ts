import ExifReader from 'exifreader';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');
const THUMBNAILS_DIR = path.join(process.cwd(), 'public', 'photos', 'thumbnails');
const THUMBNAIL_SIZE = 300;
const MAX_IMAGE_SIZE = 1024;
const WEBP_QUALITY = 80;

async function getPhotoMetadata(buffer: Buffer): Promise<any> {
    try {
        const tags = await ExifReader.load(buffer);
        return {
            takenTime: tags['DateTimeOriginal']?.description,
            latitude: tags['GPSLatitude']?.description,
            longitude: tags['GPSLongitude']?.description,
        };
    } catch (error) {
        console.error(`讀取 EXIF 數據時出錯`, error);
    }
    return null;
}

function calculateResizeDimensions(width: number, height: number, maxSize: number): { width: number, height: number } {
    if (width <= maxSize && height <= maxSize) {
        return { width, height };
    }

    const aspectRatio = width / height;
    if (width > height) {
        return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
    } else {
        return { width: Math.round(maxSize * aspectRatio), height: maxSize };
    }
}

async function processImage(file: string) {
    const inputPath = path.join(PHOTOS_DIR, file);
    const buffer = await fs.readFile(inputPath);

    try {
        const metadata = await getPhotoMetadata(buffer);
        const newFileName = metadata?.takenTime
            ? `${metadata.takenTime.replace(/[: ]/g, '')}.webp`
            : file.replace(/\.[^/.]+$/, ".webp");
        const newInputPath = path.join(PHOTOS_DIR, newFileName);
        const outputPath = path.join(THUMBNAILS_DIR, newFileName);

        if (path.extname(file).toLowerCase() === '.webp' && await fs.stat(outputPath).catch(() => false)) {
            console.log(`跳過已處理的文件: ${file}`);
            return;
        }

        const image = sharp(buffer);
        const { width, height } = await image.metadata();
        const resizeDimensions = calculateResizeDimensions(width ?? 0, height ?? 0, MAX_IMAGE_SIZE);

        if (metadata && inputPath !== newInputPath) {
            await image
                .resize(resizeDimensions.width, resizeDimensions.height)
                .webp({ quality: WEBP_QUALITY })
                .withMetadata()
                .toFile(newInputPath);
            await fs.unlink(inputPath);
            console.log(`轉換並重命名文件: ${file} -> ${newFileName}`);

            const metadataPath = path.join(PHOTOS_DIR, `${path.parse(newFileName).name}.json`);
            await fs.writeFile(metadataPath, JSON.stringify(metadata));
        }

        await image
            .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: WEBP_QUALITY })
            .withMetadata()
            .toFile(outputPath);

        console.log(`生成WebP縮略圖: ${newFileName}`);
    } catch (error) {
        console.error(`處理 ${file} 時出錯:`, error);
    }
}

async function cleanupOrphanedFiles() {
    const thumbnails = await fs.readdir(THUMBNAILS_DIR);
    const originalFiles = await fs.readdir(PHOTOS_DIR);

    for (const thumbnail of thumbnails) {
        const originalName = thumbnail.replace('.webp', '');
        if (!originalFiles.some(file => file.startsWith(originalName))) {
            await fs.unlink(path.join(THUMBNAILS_DIR, thumbnail));
            console.log(`刪除孤立的縮略圖: ${thumbnail}`);
        }
    }
}

async function generateThumbnails() {
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });

    const files = await fs.readdir(PHOTOS_DIR);
    const imageFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));

    await Promise.all(imageFiles.map(processImage));
    await cleanupOrphanedFiles();
}

generateThumbnails()
    .then(() => console.log('縮略圖生成完成'))
    .catch(error => console.error('生成縮略圖時發生錯誤:', error));
