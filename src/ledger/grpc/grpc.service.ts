import { Injectable, Logger } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';

@Injectable()
export class GrpcService {
    private readonly logger = new Logger(GrpcService.name);
    private grpcClient: any;

    constructor() {
        const PROTO_PATH = __dirname + '/ledger/grpc/image.proto'; // gRPC 프로토콜 파일 경로
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const grpcPackage: any = grpc.loadPackageDefinition(packageDefinition);
        this.grpcClient = new grpcPackage.YourServiceName(
            'localhost:50051', // gRPC 서버 주소
            grpc.credentials.createInsecure(),
        );
    }

    async uploadFileToGrpc(file: Express.Multer.File): Promise<any> {
        try {
            this.logger.log(`Sending file to gRPC server: ${file.originalname}`);

            const fileStream = fs.createReadStream(file.path); // 파일 스트림 생성
            const metadata = {
                filename: file.originalname,
                mimetype: file.mimetype,
            };

            const grpcRequest = new Promise((resolve, reject) => {
                const call = this.grpcClient.uploadFile((error: any, response: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response);
                    }
                });

                // 메타데이터 전송
                call.write(metadata);

                // 파일 데이터 전송
                fileStream.on('data', (chunk) => call.write({ chunk }));
                fileStream.on('end', () => call.end());
                fileStream.on('error', (err) => reject(err));
            });

            const grpcResponse = await grpcRequest;
            this.logger.log(`gRPC Response: ${JSON.stringify(grpcResponse)}`);
            return grpcResponse;
        } catch (error) {
            this.logger.error(`Error sending file to gRPC server: ${error.message}`);
            throw error;
        }
    }
}
