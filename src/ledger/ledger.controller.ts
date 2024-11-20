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
import {CreateLedgerDto} from './dto/create-ledger.dto';
import {UpdateLedgerDto} from './dto/update-ledger.dto';
import {FileInterceptor} from "@nestjs/platform-express";
import {FileUploadDto} from "./dto/upload-ledger.dto";
import * as fs from "node:fs";
import {GrpcService} from "./grpc/grpc.service";

@Controller('ledger')
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService,
    private readonly grpcService: GrpcService) {
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
            const response = await this.grpcService.uploadFileToGrpc(file);
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
