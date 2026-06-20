import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ResumeModule } from './modules/resume/resume.module';
import { JobModule } from './modules/job/job.module';
import { ApplicationModule } from './modules/application/application.module';

@Module({
  imports: [
    // Keep this to load variables from your root .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // Import your clean, new Prisma connection
    PrismaModule,

    // Shared object storage (MinIO / S3)
    StorageModule,

    // Authentication (registers the global JWT guard)
    AuthModule,

    // Candidate-facing feature modules
    UserModule,
    ResumeModule,
    JobModule,
    ApplicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
