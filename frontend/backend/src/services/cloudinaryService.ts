import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Log once at startup to verify envs are loaded correctly
// eslint-disable-next-line no-console
console.log('Cloudinary env at startup:', {
         CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
         CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
         CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing',
});

cloudinary.config({
         cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
         api_key: process.env.CLOUDINARY_API_KEY as string,
         api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export const uploadToCloudinary = async (filePath: string, folder?: string) => {
         const res = await cloudinary.uploader.upload(filePath, {
                  folder: folder || 'ai-support-chat',
                  resource_type: 'auto',
         });

         return {
                  url: res.secure_url,
                  publicId: res.public_id,
                  format: res.format,
                  bytes: res.bytes,
                  resourceType: res.resource_type,
         };
};
