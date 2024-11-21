import { ClientOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';

export const GreeterServiceClientOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        url: 'localhost',  // 나의 경우 로컬에서 5000번 포트에 grpc서버를 열 생각이다.
        package: 'image',  // 아까 proto파일에서 설정했던 패키지명
        protoPath: path.join(__dirname, '../../../../src/ledger/grpc/image.proto'),  // 프로토파일 경로
        loader: {  // 이거는... 아마도 해당 타입들을 어떤 형식으로 받을지에 대한 정보같다.
            enums: String,   // 일단 이렇게 설정하자.
            objects: true,
            arrays: true,
        },
    },
}