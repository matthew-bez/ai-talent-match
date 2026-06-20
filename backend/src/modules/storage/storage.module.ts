import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';

/**
 * Global so any feature module (resumes, profile pictures, future AI pipeline)
 * can inject S3Service without re-importing the module everywhere.
 */
@Global()
@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class StorageModule {}
