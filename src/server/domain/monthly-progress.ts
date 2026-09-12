import { Money } from "./money";

function monthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export function countMonthsInPeriod(startDate: Date, endDate: Date): number {
  return monthIndex(endDate) - monthIndex(startDate) + 1;
}

export function calculateMonthlyGoal(goal: Money, startDate: Date, endDate: Date): Money {
  const months = countMonthsInPeriod(startDate, endDate);
  return Money.fromCents(Math.round(goal.toCents() / months));
}

export interface MonthlyContribution {
  donorName: string;
  amount: Money;
}

export interface MonthlyProgress {
  month: Date;
  monthlyGoal: Money;
  receivedTotal: Money;
  paid: MonthlyContribution[];
  pending: MonthlyContribution[];
}

export function isMonthlyGoalReached(progress: MonthlyProgress): boolean {
  return progress.receivedTotal.toCents() >= progress.monthlyGoal.toCents();
}
