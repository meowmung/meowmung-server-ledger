import {
    Body,
    Controller,
    Get,
    Headers,
    Logger,
    Param, Patch,
    Post, Put,
    UploadedFile,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import {LedgerService} from './ledger.service';
import {FileInterceptor, FilesInterceptor} from "@nestjs/platform-express";
import {UpdateLedgerDto} from "./dto/update-ledger.dto";

@Controller('ledger')
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) {
    }

    private readonly logger = new Logger(LedgerController.name);

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10)) // 최대 10개의 파일 허용
    async uploadFiles(
        @Headers('X-Authorization-email') email: string,
        @UploadedFiles() files: Express.Multer.File[]) {
        const result = await this.ledgerService.sendImages(files);
        return this.ledgerService.saveResult(email, result);
    }
    @Post('upload/update')
    async update(@Headers('X-Authorization-email') email: string,
                 @Body() updateLedgerDto: UpdateLedgerDto){
        await this.ledgerService.update(updateLedgerDto);
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

    // @Put(":year/:month/:day")
    // async updateLedger(@Headers('X-Authorization-email') email: string,
    //                    @Body() updateLedgerDto: UpdateLedgerDto) {
    //     return this.ledgerService.updateLedger(email, updateLedgerDto);
    // }

    @Get('category')
    findByCategory(@Headers('X-Authorization-email') email: string) {
        return this.ledgerService.findByCategory(email);
    }
}
