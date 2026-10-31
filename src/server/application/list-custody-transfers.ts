import type { Money } from "../domain/money";

export interface CustodyTransferSummary {
  id: string;
  fromUserLabel: string;
  recipientName: string;
  toVolunteer: boolean;
  amount: Money;
  transferDate: Date;
  registeredByUserLabel: string;
}

export interface CustodyTransferListReader {
  findByCampaign(campaignId: string): Promise<CustodyTransferSummary[]>;
}

export function listCustodyTransfers(
  reader: CustodyTransferListReader,
  campaignId: string,
): Promise<CustodyTransferSummary[]> {
  return reader.findByCampaign(campaignId);
}
