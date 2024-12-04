import {
    Body,
    Controller,
    Get,
    Headers,
    Logger, NotFoundException,
    Param, Patch,
    Post, Put,
    UploadedFile,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import {LedgerService} from './ledger.service';
import {FilesInterceptor} from "@nestjs/platform-express";
import {UpdateLedgerDto} from "./dto/update-ledger.dto";
import {UploadLedgerDto} from "./dto/upload-ledger.dto";

@Controller('ledger')
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) {
    }

    private readonly logger = new Logger(LedgerController.name);

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10)) // 최대 10개의 파일 허용
    async uploadFiles(
        @Headers('X-Authorization-memberId') memberId: number,
        @UploadedFiles() files: Express.Multer.File[]) {
        console.log(files);
        const result = await this.ledgerService.sendImages(files);
        return this.ledgerService.saveResult(memberId, result);
    }

    @Post('upload/update')
    async update(@Headers('X-Authorization-memberId') memberId: number,
                 @Body() updateLedgerDto: UpdateLedgerDto) {
        await this.ledgerService.update(updateLedgerDto, memberId);
    }

    @Get(':id')
    async oneImage(@Headers('X-Authorization-memberId') memberId: number,
                   @Param('id') id: number) {
        const ledger = await this.ledgerService.findLedgerById(memberId, id);

        if (!ledger) {
            throw new NotFoundException(`Ledger with ID ${id} not found for Member ID ${memberId}`);
        }

        return ledger;
    }

    @Post('upload/enroll')
    async enroll(@Headers('X-Authorization-memberId') memberId: number, @Body() uploadLedgerDto: UploadLedgerDto) {
        await this.ledgerService.enroll(uploadLedgerDto, memberId);
    }


    @Get(':year/:month')
    findAll(@Headers('X-Authorization-memberId') memberId: number,
            @Param('year') year: number,
            @Param('month') month: number) {
        return this.ledgerService.findAll(memberId, year, month);
    }

    @Get(':year/:month/:day')
    findOne(@Headers('X-Authorization-memberId') memberId: number,
            @Param('year') year: number,
            @Param('month') month: number,
            @Param('day') day: number) {
        return this.ledgerService.findOne(memberId, year, month, day);
    }

    @Get('/analyze/category/:year/:month')
    findByCategory(@Headers('X-Authorization-memberId') memberId: number,
                   @Param('year') year: number,
                   @Param('month') month: number) {
        return this.ledgerService.findByCategory(memberId, year, month);
    }
}
