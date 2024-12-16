import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName = process.env.AWS_S3_BUCKET_NAME;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const folderPath = 'ledger/'; // 저장할 폴더 경로
    const fileKey = `${folderPath}${uuidv4()}-${file.originalname}`; // 폴더 경로 포함 파일 키 생성
    const params = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileKey = this.extractKeyFromUrl(fileUrl);
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
      };
      await this.s3.send(new DeleteObjectCommand(params));
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  private extractKeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return url.pathname.substring(1); // URL에서 파일 키 추출 (첫 번째 슬래시 제거)
  }
}
