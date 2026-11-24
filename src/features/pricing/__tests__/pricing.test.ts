import { MIN_DAILY_PRICE } from '../config';
import {
  formatMoney,
  kmFeeCents,
  listedPriceCents,
  minimumPriceCents,
  parseMoneyInput,
  quote,
  sizeCategoryFor,
} from '../pricing';

describe('sizeCategoryFor', () => {
  it('maps cats and dog weights to the PRD grid', () => {
    expect(sizeCategoryFor('cat', 30)).toBe('cat');
    expect(sizeCategoryFor('dog', 4)).toBe('dogSmall');
    expect(sizeCategoryFor('dog', 10)).toBe('dogMedium');
    expect(sizeCategoryFor('dog', 24.9)).toBe('dogMedium');
    expect(sizeCategoryFor('dog', 25)).toBe('dogLarge');
    expect(sizeCategoryFor('dog', 40)).toBe('dogXL');
    expect(sizeCategoryFor('dog')).toBe('dogMedium');
  });
});

describe('minimum prices', () => {
  it('matches the validated FR and CH grids', () => {
    expect(MIN_DAILY_PRICE.FR).toEqual({ cat: 850, dogSmall: 900, dogMedium: 1100, dogLarge: 1300, dogXL: 1700 });
    expect(MIN_DAILY_PRICE.CH).toEqual({ cat: 2020, dogSmall: 2140, dogMedium: 2610, dogLarge: 3080, dogXL: 4030 });
  });

  it('CH grid = (FR × 4000/1350, rounded to 10 cts) × 0.8, rounded to 10 cts — as validated', () => {
    const r10 = (c: number) => Math.round(c / 10) * 10;
    for (const k of Object.keys(MIN_DAILY_PRICE.FR) as (keyof typeof MIN_DAILY_PRICE.FR)[]) {
      const expected = r10(r10(MIN_DAILY_PRICE.FR[k] * (4000 / 1350)) * 0.8);
      expect(MIN_DAILY_PRICE.CH[k]).toBe(expected);
    }
  });

  it('sums pets and days for boarding / home visits', () => {
    expect(minimumPriceCents({ service: 'boarding', country: 'FR', sizes: ['cat', 'dogLarge'], days: 3 })).toBe((850 + 1300) * 3);
    expect(minimumPriceCents({ service: 'homeVisits', country: 'CH', sizes: ['dogXL'], days: 2 })).toBe(8060);
  });

  it('dog walking has no floor besides > 0', () => {
    expect(minimumPriceCents({ service: 'dogWalking', country: 'FR', sizes: ['dogSmall'], days: 1 })).toBe(1);
  });
});

describe('listedPriceCents', () => {
  it('never goes below the minimum even if a sitter rate is lower', () => {
    const price = listedPriceCents({
      service: { type: 'boarding', dailyRates: { cat: 500, dogSmall: 1500 } },
      country: 'FR',
      sizes: ['cat', 'dogSmall'],
      days: 2,
    });
    expect(price).toBe((850 + 1500) * 2);
  });

  it('uses walk price × number of walks for dog walking', () => {
    expect(listedPriceCents({ service: { type: 'dogWalking', walkPrice: 1500 }, country: 'FR', sizes: ['dogSmall'], days: 3 })).toBe(4500);
  });
});

describe('kmFeeCents', () => {
  it('charges the round trip at 0.37 €/km in FR and 0.45 CHF/km in CH', () => {
    expect(kmFeeCents(5, 'FR')).toBe(370);
    expect(kmFeeCents(5, 'CH')).toBe(450);
    expect(kmFeeCents(2.5, 'FR', 3)).toBe(185 * 3);
  });
});

describe('quote', () => {
  it('reproduces the PRD example (210 €, Master sitter)', () => {
    const q = quote({ servicePriceCents: 21000, level: 'master', country: 'FR' });
    expect(q.ownerFeeCents).toBe(1050);
    expect(q.ownerTotalCents).toBe(22050);
    expect(q.sitterCommissionCents).toBe(210);
    expect(q.sitterPayoutCents).toBe(20790);
    expect(q.platformRevenueCents).toBe(1260);
    expect(q.ownerClubTotalCents).toBe(19845);
    expect(q.ownerClubSavingsCents).toBe(2205);
  });

  it('applies the commission rate of each level', () => {
    const rates = (['beginner', 'explorer', 'advanced', 'expert', 'master'] as const).map(
      (level) => quote({ servicePriceCents: 10000, level, country: 'FR' }).sitterCommissionCents,
    );
    expect(rates).toEqual([500, 400, 300, 200, 100]);
  });

  it('includes the km fee in the subtotal (⚠️ interpretation à valider)', () => {
    const q = quote({ servicePriceCents: 2000, kmFeeCents: 370, level: 'beginner', country: 'FR' });
    expect(q.subtotalCents).toBe(2370);
    expect(q.ownerTotalCents).toBe(2370 + 119);
  });
});

describe('formatMoney / parseMoneyInput', () => {
  it('formats EUR and CHF', () => {
    expect(formatMoney(22050, 'EUR')).toBe('220,50 €');
    expect(formatMoney(123456, 'EUR')).toBe('1 234,56 €');
    expect(formatMoney(2020, 'CHF')).toBe('CHF 20.20');
  });
  it('parses user input', () => {
    expect(parseMoneyInput('12,5')).toBe(1250);
    expect(parseMoneyInput('12.50 €')).toBe(1250);
    expect(parseMoneyInput('abc')).toBeNaN();
  });
});
