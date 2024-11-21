import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Headers,
    Query,
    UploadedFile,
    UseInterceptors, Logger
} from '@nestjs/common';
import {LedgerService} from './ledger.service';
import {FileInterceptor} from "@nestjs/platform-express";
import {GrpcController} from "./grpc/grpc.controller";
import {ParamImage} from './grpc/interface/grpc-param.interface';

@Controller('ledger')
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService,
                private readonly grpcController: GrpcController) {
    }

    private readonly logger = new Logger(LedgerController.name);

    /**
     * form-data or multipart/form-data
     * key = file (file), value = 이미지
     * @param file
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        try {
            this.logger.log(`Received file: ${file.originalname}`);

            // gRPC로 파일 데이터 전송
            const param: ParamImage = {
                file: {
                    ...file,
                    buffer: file.buffer, // 파일 바이너리를 포함
                } as Express.Multer.File,
            };

            const response = this.grpcController.processFile(param);
            this.logger.log(`gRPC Server Response: ${JSON.stringify(response)}`);
        } catch (error) {
            this.logger.error(`Error during file upload: ${error.message}`);
        }
    }


    @Get(':year/:month')
    findAll(@Headers('X-Authorization-email') email: string,
            @Param('year') year: number,
            @Param('month') month: number) {
        return this.ledgerService.findAll(email, year, month);
    }

    @Get(':year/:month/:day')
    findOne(@Headers('X-Authorization-email') email: string,
            @Param('year') year: number,
            @Param('month') month: number,
            @Param('day') day: number) {
        return this.ledgerService.findOne(email, year, month, day);
    }

    @Get('category')
    findByCategory(@Headers('X-Authorization-email') email: string) {
        return this.ledgerService.findByCategory(email);
    }
}
