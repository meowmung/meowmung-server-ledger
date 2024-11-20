import {Controller, Get, Post, Body, Patch, Param, Delete, Headers, Query} from '@nestjs/common';
import {LedgerService} from './ledger.service';
import {CreateLedgerDto} from './dto/create-ledger.dto';
import {UpdateLedgerDto} from './dto/update-ledger.dto';

@Controller('ledger')
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) {
    }

    @Post()
    create(@Body() createLedgerDto: CreateLedgerDto) {
        // return this.ledgerService.create(createLedgerDto);
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
        return this.ledgerService.findOne(email,year,month,day);
    }

    @Get('category')
    findByCategory(@Headers('X-Authorization-email') email: string) {
        return this.ledgerService.findByCategory(email);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ledgerService.remove(+id);
    }
}
