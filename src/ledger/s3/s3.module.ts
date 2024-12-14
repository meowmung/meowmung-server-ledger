import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Service],
  exports: [S3Service], // 다른 모듈에서 사용할 수 있도록 exports
})
export class S3Module {}
