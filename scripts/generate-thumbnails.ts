import ExifReader from 'exifreader';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');
const THUMBNAILS_DIR = path.join(process.cwd(), 'public', 'photos', 'thumbnails');
const THUMBNAIL_SIZE = 300;

async function getPhotoTakenTime(buffer: Buffer): Promise<string | null> {
    try {
        const tags = await ExifReader.load(buffer);
        if (tags['DateTimeOriginal']) {
            const dateTime = tags['DateTimeOriginal'].description;
            return dateTime.replace(/[: ]/g, '');
        }
    } catch (error) {
        console.error(`讀取 EXIF 數據時出錯`, error);
    }
    return null;
}

async function generateThumbnails() {
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });

    const files = await fs.readdir(PHOTOS_DIR);

    for (const file of files) {
        if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
            const inputPath = path.join(PHOTOS_DIR, file);
            const buffer = await fs.readFile(inputPath);

            try {
                const takenTime = await getPhotoTakenTime(buffer);
                const newFileName = takenTime ? `${takenTime}${path.extname(file)}` : file;
                const newInputPath = path.join(PHOTOS_DIR, newFileName);
                const outputPath = path.join(THUMBNAILS_DIR, newFileName);

                if (takenTime && inputPath !== newInputPath) {
                    await fs.rename(inputPath, newInputPath);
                    console.log(`重命名文件: ${file} -> ${newFileName}`);
                }

                await sharp(buffer)
                    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .toFile(outputPath);

                console.log(`生成縮略圖: ${newFileName}`);
            } catch (error) {
                console.error(`處理 ${file} 時出錯:`, error);
            }
        }
    }
}

generateThumbnails().then(() => console.log('縮略圖生成完成'));
