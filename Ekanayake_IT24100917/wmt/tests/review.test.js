// tests/review.test.js
// Unit tests for the Reviews & Ratings WMT module
// Owner: Ekanayake E.M.T.D.B. | IT24100917
// Run with: npm test
// Install jest first: npm install --save-dev jest

const reviewController = require('../controllers/reviewController');

// ── Mock mongoose models ─────────────────────────────────────
jest.mock('../models/Review', () => {
  const reviewData = {
    _id:       'rev001',
    userId:    'user001',
    productId: 'prod001',
    rating:    5,
    comment:   'Amazing espresso, perfect for mornings!',
    createdAt: new Date('2026-03-18'),
  };

  const mockReview = {
    findOne:          jest.fn(),
    find:             jest.fn(),
    findById:         jest.fn(),
    findByIdAndDelete:jest.fn(),
    countDocuments:   jest.fn(),
    aggregate:        jest.fn(),
    create:           jest.fn().mockResolvedValue(reviewData),
  };
  return mockReview;
});

jest.mock('../models/Product', () => ({
  findById: jest.fn(),
}));

const Review  = require('../models/Review');
const Product = require('../models/Product');

// ── Helper: mock request / response ─────────────────────────
const mockReq = (body={}, params={}, user={ id:'user001', role:'user' }) => ({ body, params, user });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ════════════════════════════════════════════════════════════
//  TEST SUITE 1 — createReview
// ════════════════════════════════════════════════════════════
describe('createReview', () => {

  beforeEach(() => jest.clearAllMocks());

  test('TC01 — Returns 400 when productId is missing', async () => {
    const req = mockReq({ rating:4, comment:'Great coffee!' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('required') }));
  });

  test('TC02 — Returns 400 when comment is missing', async () => {
    const req = mockReq({ productId:'prod001', rating:4 });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC03 — Returns 400 when rating is 0 (below minimum)', async () => {
    const req = mockReq({ productId:'prod001', rating:0, comment:'Test comment' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('1 and 5') }));
  });

  test('TC04 — Returns 400 when rating is 6 (above maximum)', async () => {
    const req = mockReq({ productId:'prod001', rating:6, comment:'Test comment' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('1 and 5') }));
  });

  test('TC05 — Returns 404 when product does not exist', async () => {
    Product.findById.mockResolvedValue(null);
    const req = mockReq({ productId:'nonexistent', rating:4, comment:'Test comment here' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not found') }));
  });

  test('TC06 — Returns 409 when user has already reviewed the product', async () => {
    Product.findById.mockResolvedValue({ _id:'prod001', name:'Espresso' });
    Review.findOne.mockResolvedValue({ _id:'existingReview', rating:3 });
    const req = mockReq({ productId:'prod001', rating:4, comment:'Trying to review again' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('already reviewed') }));
  });

  test('TC07 — Returns 201 when all inputs are valid and no duplicate exists', async () => {
    Product.findById.mockResolvedValue({ _id:'prod001', name:'Espresso' });
    Review.findOne.mockResolvedValue(null);
    const req = mockReq({ productId:'prod001', rating:5, comment:'Amazing espresso, perfect for mornings!' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('submitted') }));
  });

  test('TC08 — Accepts boundary rating of 1', async () => {
    Product.findById.mockResolvedValue({ _id:'prod001', name:'Espresso' });
    Review.findOne.mockResolvedValue(null);
    const req = mockReq({ productId:'prod001', rating:1, comment:'Not great unfortunately' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('TC09 — Accepts boundary rating of 5', async () => {
    Product.findById.mockResolvedValue({ _id:'prod001', name:'Espresso' });
    Review.findOne.mockResolvedValue(null);
    const req = mockReq({ productId:'prod001', rating:5, comment:'Absolutely perfect!' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

});

// ════════════════════════════════════════════════════════════
//  TEST SUITE 2 — getReviewsByProduct
// ════════════════════════════════════════════════════════════
describe('getReviewsByProduct', () => {

  beforeEach(() => jest.clearAllMocks());

  test('TC10 — Returns empty array and avgRating 0 when no reviews exist', async () => {
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort:     jest.fn().mockResolvedValue([]),
    });
    const req = mockReq({}, { productId:'prod001' });
    const res = mockRes();
    await reviewController.getReviewsByProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.reviews).toHaveLength(0);
    expect(response.avgRating).toBe(0);
  });

  test('TC11 — Calculates correct average rating for multiple reviews', async () => {
    const fakeReviews = [
      { rating:5, userId:{ name:'Alice' } },
      { rating:3, userId:{ name:'Bob' } },
      { rating:4, userId:{ name:'Charlie' } },
    ];
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort:     jest.fn().mockResolvedValue(fakeReviews),
    });
    const req = mockReq({}, { productId:'prod001' });
    const res = mockRes();
    await reviewController.getReviewsByProduct(req, res);
    const response = res.json.mock.calls[0][0];
    // Average of 5+3+4 = 12/3 = 4.0
    expect(parseFloat(response.avgRating)).toBe(4.0);
  });

  test('TC12 — Returns correct review count in total field', async () => {
    const fakeReviews = [
      { rating:5, userId:{ name:'Alice' } },
      { rating:4, userId:{ name:'Bob' } },
    ];
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort:     jest.fn().mockResolvedValue(fakeReviews),
    });
    const req = mockReq({}, { productId:'prod001' });
    const res = mockRes();
    await reviewController.getReviewsByProduct(req, res);
    const response = res.json.mock.calls[0][0];
    expect(response.total).toBe(2);
  });

  test('TC13 — Returns distribution object with all star counts', async () => {
    const fakeReviews = [
      { rating:5 },{ rating:5 },{ rating:4 },{ rating:3 },{ rating:1 }
    ];
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort:     jest.fn().mockResolvedValue(fakeReviews),
    });
    const req = mockReq({}, { productId:'prod001' });
    const res = mockRes();
    await reviewController.getReviewsByProduct(req, res);
    const response = res.json.mock.calls[0][0];
    expect(response.distribution[5]).toBe(2);
    expect(response.distribution[4]).toBe(1);
    expect(response.distribution[3]).toBe(1);
    expect(response.distribution[1]).toBe(1);
  });

});

// ════════════════════════════════════════════════════════════
//  TEST SUITE 3 — deleteReview (Authorisation)
// ════════════════════════════════════════════════════════════
describe('deleteReview', () => {

  beforeEach(() => jest.clearAllMocks());

  test('TC14 — Returns 404 when review does not exist', async () => {
    Review.findById.mockResolvedValue(null);
    const req = mockReq({}, { id:'nonexistent123' });
    const res = mockRes();
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('TC15 — Returns 403 when a different user tries to delete', async () => {
    Review.findById.mockResolvedValue({ _id:'rev001', userId: { toString:()=>'differentUser' } });
    const req = mockReq({}, { id:'rev001' }, { id:'user001', role:'user' });
    const res = mockRes();
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Forbidden') }));
  });

  test('TC16 — Returns 200 when the owner deletes their own review', async () => {
    Review.findById.mockResolvedValue({ _id:'rev001', userId:{ toString:()=>'user001' } });
    Review.findByIdAndDelete.mockResolvedValue({ _id:'rev001' });
    const req = mockReq({}, { id:'rev001' }, { id:'user001', role:'user' });
    const res = mockRes();
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('deleted') }));
  });

  test('TC17 — Admin can delete any review regardless of ownership', async () => {
    Review.findById.mockResolvedValue({ _id:'rev001', userId:{ toString:()=>'someOtherUser' } });
    Review.findByIdAndDelete.mockResolvedValue({ _id:'rev001' });
    const req = mockReq({}, { id:'rev001' }, { id:'adminUser', role:'admin' });
    const res = mockRes();
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

});

// ════════════════════════════════════════════════════════════
//  TEST SUITE 4 — Input Validation edge cases
// ════════════════════════════════════════════════════════════
describe('Input Validation Edge Cases', () => {

  beforeEach(() => jest.clearAllMocks());

  test('TC18 — Rating as a string "5" is accepted (coerced to number)', async () => {
    Product.findById.mockResolvedValue({ _id:'prod001', name:'Espresso' });
    Review.findOne.mockResolvedValue(null);
    const req = mockReq({ productId:'prod001', rating:'5', comment:'Great coffee!' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('TC19 — Rating as a string "abc" is rejected as invalid', async () => {
    const req = mockReq({ productId:'prod001', rating:'abc', comment:'Test' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC20 — Empty comment string is rejected', async () => {
    const req = mockReq({ productId:'prod001', rating:4, comment:'' });
    const res = mockRes();
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

});
