import { REVIEW_CRITERIA, reviewRating } from '../criteria';

describe('review criteria', () => {
  it('has 4 criteria per role', () => {
    expect(REVIEW_CRITERIA.owner.map((c) => c.key)).toEqual(['care', 'communication', 'punctuality', 'overall']);
    expect(REVIEW_CRITERIA.sitter.map((c) => c.key)).toEqual(['punctuality', 'communication', 'agreements', 'handover']);
  });
  it('averages the 4 criteria and rejects incomplete reviews', () => {
    expect(reviewRating({ care: 5, communication: 4, punctuality: 4, overall: 5 }, 'owner')).toBe(4.5);
    expect(reviewRating({ care: 5 }, 'owner')).toBeUndefined();
  });
});
