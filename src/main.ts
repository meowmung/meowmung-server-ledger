import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import client from "./ledger/configs/eureka.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8083);
  client.start();
}
bootstrap();
