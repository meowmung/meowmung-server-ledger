import {Item} from "../entities/item.entity";

export class UpdateLedgerDto {
    id: number;
    location : string;
    message : string;
    date : string;
    items : Item[];

}
