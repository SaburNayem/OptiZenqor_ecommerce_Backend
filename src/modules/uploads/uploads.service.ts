import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  createUploadIntent(filename: string) {
    const sanitized = filename.replace(/\s+/g, '-').toLowerCase();

    return {
      provider: 'local-adapter-ready',
      uploadKey: `uploads/${Date.now()}-${sanitized}`,
      publicUrl: `/uploads/${sanitized}`,
      notes: 'Swap this module with S3, Cloudinary, or another storage adapter in production.',
    };
  }
}
