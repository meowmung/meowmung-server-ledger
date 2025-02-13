import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {LedgerModule} from './ledger/ledger.module';
import {TypeOrmModule} from '@nestjs/typeorm';
import {DataSource} from "typeorm";
import {ConfigModule, ConfigService} from '@nestjs/config';
import {Ledger} from "./ledger/entities/ledger.entity";
import {Item} from "./ledger/entities/item.entity";


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                retryAttempts: configService.get('NODE_ENV') === 'prod' ? 10 : 1,
                type: 'mysql',
                host: configService.get('DB_HOST'),
                port: Number(configService.get('DB_PORT')),
                database: configService.get('DB_NAME'),
                username: configService.get('DB_USER'),
                password: configService.get('DB_PASSWORD'),
                entities: [Ledger,Item],
                synchronize: true, // 변경 필요 false <- 배포용
                logging: true,
                timezone: 'local',
            }),
        }),
        LedgerModule,
        // GrpcModule,
        ConfigModule.forRoot()
    ],
    // imports: [LedgerModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor(private dataSource: DataSource) {
    }
}
