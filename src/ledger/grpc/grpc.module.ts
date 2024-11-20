import { Module } from '@nestjs/common';
import { GrpcService } from './grpc.service';

@Module({
    providers: [GrpcService],
    exports: [GrpcService], // 다른 모듈에서 사용 가능하도록 내보냄
})
export class GrpcModule {}