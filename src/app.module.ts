import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {LedgerModule} from './ledger/ledger.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '1234',
            database: 'final',
            entities: [],
            synchronize: true, // 프로덕션 환경에서 사용
        }),
        LedgerModule,
    ],
    // imports: [LedgerModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
