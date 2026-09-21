import { randomUUID } from 'node:crypto';
import { getCloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
export const mediaService = {
  async upload(buffer, userId) {
    const client = getCloudinary();
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = client.uploader.upload_stream({ resource_type: 'image', public_id: `devsync/avatars/${userId}/${randomUUID()}`, overwrite: false, timeout: 30000 }, (error, value) => error ? reject(error) : resolve(value));
        stream.on('error', reject);
        stream.end(buffer);
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch { throw new ApiError(502, 'Avatar storage upload failed. Try again later'); }
  },
  async destroy(publicId) {
    const result = await getCloudinary().uploader.destroy(publicId, { resource_type: 'image', invalidate: true, timeout: 30000 });
    if (!['ok', 'not found'].includes(result.result)) throw new Error('Avatar cleanup failed');
  }
};
// A failed cleanup never rolls back an already committed profile change.
// Operators can retry the recorded public ID in Cloudinary; there is no background job.
export async function cleanupAvatar(media, publicId) {
  if (!publicId) return false;
  try { await media.destroy(publicId); return false; }
  catch { console.error(JSON.stringify({ event: 'avatar_cleanup_failed', publicId })); return true; }
}
