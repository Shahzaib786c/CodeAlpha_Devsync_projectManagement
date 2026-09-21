import { v2 as cloudinary } from 'cloudinary';
import ApiError from '../utils/ApiError.js';
export function getCloudinary() {
  const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = process.env;
  if (!cloud_name || !api_key || !api_secret) throw new ApiError(503, 'Avatar storage is not configured');
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  return cloudinary;
}
