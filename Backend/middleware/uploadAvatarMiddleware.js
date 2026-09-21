import multer from 'multer';
import sharp from 'sharp';
import ApiError from '../utils/ApiError.js';
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, cb) {
    cb(['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ? null : new ApiError(400, 'Use a JPEG, PNG or WebP image'), true);
  }
}).single('avatar');
export async function validateAvatar(req, res, next) {
  if (!req.file) throw new ApiError(400, 'Choose an image using the avatar file field');
  try {
    const image = sharp(req.file.buffer, { limitInputPixels: 16000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error('Unsupported image');
    req.avatarBuffer = await image.rotate().resize(512, 512, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();
  } catch { throw new ApiError(400, 'Image must be a valid, nonanimated JPEG, PNG or WebP up to 16 megapixels'); }
  next();
}
