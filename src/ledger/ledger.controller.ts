import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateLedgerDto } from './dto/update-ledger.dto';
import { UploadLedgerDto } from './dto/upload-ledger.dto';
import { S3Service } from './s3/s3.service';

@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly s3Service: S3Service,
  ) {
  }

  private readonly logger = new Logger(LedgerController.name);

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // 최대 10개의 파일 허용
  async uploadFiles(
    @Headers('X-Authorization-memberId') memberId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploadPromises = files.map((file) => this.s3Service.uploadFile(file));
    const uploadedUrls = await Promise.all(uploadPromises);
    const result = await this.ledgerService.sendImages(uploadedUrls);
    if (!result || this.ledgerService.validate(result)) {
      uploadedUrls.forEach((url) => {
        this.s3Service.deleteFile(url);
        console.log(url);
      });
      return false;
    }
    return this.ledgerService.saveResult(memberId, result);
  }

  @Post('upload/update')
  async update(
    @Headers('X-Authorization-memberId') memberId: number,
    @Body() updateLedgerDto: UpdateLedgerDto,
  ) {
    await this.ledgerService.update(updateLedgerDto, memberId);
  }

  @Get(':id')
  async oneImage(
    @Headers('X-Authorization-memberId') memberId: number,
    @Param('id') id: number,
  ) {
    const ledger = await this.ledgerService.findLedgerById(memberId, id);

    if (!ledger) {
      throw new NotFoundException(
        `Ledger with ID ${id} not found for Member ID ${memberId}`,
      );
    }

    return ledger;
  }

  @Post('upload/enroll')
  async enroll(
    @Headers('X-Authorization-memberId') memberId: number,
    @Body() uploadLedgerDto: UploadLedgerDto,
  ) {
    await this.ledgerService.enroll(uploadLedgerDto, memberId);
  }

  @Get(':year/:month')
  findAll(
    @Headers('X-Authorization-memberId') memberId: number,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.ledgerService.findAll(memberId, year, month);
  }

  @Get(':year/:month/:day')
  findOne(
    @Headers('X-Authorization-memberId') memberId: number,
    @Param('year') year: number,
    @Param('month') month: number,
    @Param('day') day: number,
  ) {
    return this.ledgerService.findOne(memberId, year, month, day);
  }

  @Get('/analyze/category/:year/:month')
  findByCategory(
    @Headers('X-Authorization-memberId') memberId: number,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.ledgerService.findByCategory(memberId, year, month);
  }
  @Delete(':id/:itemId')
  async delete(
    @Headers('X-Authorization-memberId') memberId: number,
    @Param('id') id: number,
    @Param('itemId') itemId: number,
  ) {
    console.log(`memberId: ${memberId}, id: ${id}, itemId: ${itemId}`);
    return await this.ledgerService.deleteItem(memberId, id, itemId);
  }


  @Delete(':id')
  async deleteLedger(
    @Headers('X-Authorization-memberId') memberId: number,
    @Param('id') ledgerId: number,
  ) {
    return await this.ledgerService.deleteLedger(memberId, ledgerId);
  }
}
