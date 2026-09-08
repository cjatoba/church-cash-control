/**
 * Value object monetário. Representa valores em centavos (inteiros) para
 * evitar erros de arredondamento de ponto flutuante em cálculos financeiros.
 */
export class Money {
  private constructor(private readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new Error("Money deve ser um número inteiro de centavos");
    }
    if (cents < 0) {
      throw new Error("Money não pode ser negativo");
    }
    return new Money(cents);
  }

  toCents(): number {
    return this.cents;
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
