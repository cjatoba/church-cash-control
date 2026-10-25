import {
  countRemainingInstallments,
  listFirstInstallmentMonths,
  toMonthKey,
} from "@/server/domain/pledge";
import { formatMonthLabel } from "@/app/_lib/format";

export interface FirstMonthOption {
  value: string;
  label: string;
  maxInstallmentCount: number;
}

export function buildFirstMonthOptions(
  campaign: { startDate: Date; endDate: Date },
  now: Date,
): FirstMonthOption[] {
  const currentMonthKey = toMonthKey(now);
  return listFirstInstallmentMonths(campaign.startDate, campaign.endDate, now).map((month) => {
    const value = toMonthKey(month);
    const label = formatMonthLabel(month).replace("/", " de ");
    return {
      value,
      label: value === currentMonthKey ? `${label} (mês atual)` : label,
      maxInstallmentCount: countRemainingInstallments(month, campaign.endDate),
    };
  });
}
