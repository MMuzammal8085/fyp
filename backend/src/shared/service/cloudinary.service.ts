import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    this.configureFromEnvIfNeeded();
  }

  private configureFromEnvIfNeeded() {
    const current = cloudinary.config();
    if (current.cloud_name && current.api_key && current.api_secret) {
      return;
    }

    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl } as any);
      return;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ??
      process.env.CLOUD_NAME ??
      process.env.cloud_name;
    const apiKey =
      process.env.CLOUDINARY_API_KEY ??
      process.env.CLOUDINARY_KEY ??
      process.env.cloudinary_api_key;
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET ??
      process.env.CLOUDINARY_SECRET ??
      process.env.cloudinary_API_Secret ??
      process.env.cloudinary_api_secret;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  private ensureConfigured() {
    this.configureFromEnvIfNeeded();

    const cloudName = cloudinary.config().cloud_name;
    const apiKey = cloudinary.config().api_key;
    const apiSecret = cloudinary.config().api_secret;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured on the server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or cloud_name, cloudinary_api_key, cloudinary_API_Secret) in backend/.env and restart the backend.',
      );
    }
  }

  async uploadResumePdf(options: {
    buffer: Buffer;
    fileName?: string;
    publicId?: string;
  }): Promise<{ secureUrl: string; publicId: string }> {
    this.ensureConfigured();

    const folder =
      process.env.CLOUDINARY_RESUME_FOLDER ??
      process.env.CLOUDINARY_FOLDER ??
      'resumes';

    const publicId = options.publicId;
    const fileName = options.fileName ?? 'resume.pdf';

    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
          filename_override: fileName,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id) {
            return reject(new Error('Cloudinary upload failed'));
          }
          resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        },
      );

      uploadStream.end(options.buffer);
    });
  }
}
