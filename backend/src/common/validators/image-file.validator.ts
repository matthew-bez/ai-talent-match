import { FileValidator } from '@nestjs/common';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Accepts common web image formats for profile pictures. */
export class ImageFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean {
    return !!file && ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return `Unsupported image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
  }
}
