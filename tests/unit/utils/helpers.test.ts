import { pick, buildPaginationMeta, safeInt } from '../../../src/utils/helpers';
import { AppError, createError } from '../../../src/utils/AppError';

describe('helpers', () => {
  describe('pick', () => {
    it('picks only specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('ignores missing keys', () => {
      const obj = { a: 1 };
      expect(pick(obj as { a: number; b?: number }, ['a', 'b'])).toEqual({ a: 1 });
    });
  });

  describe('buildPaginationMeta', () => {
    it('calculates correct total pages', () => {
      expect(buildPaginationMeta(100, 1, 10)).toMatchObject({
        totalPages: 10,
        totalResults: 100,
        page: 1,
        limit: 10,
      });
    });

    it('rounds up partial pages', () => {
      expect(buildPaginationMeta(11, 1, 10).totalPages).toBe(2);
    });
  });

  describe('safeInt', () => {
    it('parses valid number string', () => expect(safeInt('5', 1)).toBe(5));
    it('returns fallback for NaN', () => expect(safeInt('abc', 3)).toBe(3));
    it('returns fallback for undefined', () => expect(safeInt(undefined, 7)).toBe(7));
  });
});

describe('AppError', () => {
  it('creates error with correct status code', () => {
    const err = new AppError('test', 400);
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe('test');
  });

  it('createError.notFound uses 404', () => {
    expect(createError.notFound('User').statusCode).toBe(404);
  });

  it('createError.conflict uses 409', () => {
    expect(createError.conflict('Duplicate').statusCode).toBe(409);
  });

  it('createError.unauthorized uses 401', () => {
    expect(createError.unauthorized().statusCode).toBe(401);
  });
});
