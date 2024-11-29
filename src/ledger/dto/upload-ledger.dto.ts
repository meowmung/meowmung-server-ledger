import {Item} from "../entities/item.entity";

export class UploadLedgerDto {
    location : string;
    message : string;
    date : string;
    items : Item[];
}