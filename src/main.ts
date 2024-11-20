import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import client from "./ledger/configs/eureka.module";
import * as path from "node:path";

async function bootstrap() {
    client.start();
    const app = await NestFactory.create(AppModule);

    // app.connectMicroservice({
    //     transport: Transport.GRPC,
    //     options: {
    //         url: '127.0.0.1:5000',  // 해당 url로 서버를 연다.
    //         package: 'user',  // proto파일의 패키지명
    //         protoPath: path.join(__dirname, '../src/proto/user.proto'), // 프로토 파일 위치
    //         loader: {  // 이거는... 아마도 해당 타입들을 어떤 형식으로 받을지에 대한 정보같다.
    //             enums: String,  // 일단 이렇게 적자.
    //             objects: true,
    //             arrays: true,
    //         },
    //     },
    // });

    await app.startAllMicroservices(); //
    await app.listen(process.env.PORT ?? 8083);

}

bootstrap();
