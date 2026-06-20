import { FileValidator } from '@nestjs/common';

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

/** Accepts PDF / DOC / DOCX uploads for CVs. */
export class DocumentFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean {
    return !!file && ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return 'Unsupported file type. Allowed: PDF, DOC, DOCX';
  }
}
