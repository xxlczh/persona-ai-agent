/**
 * 错误处理测试
 */

const AppError = require('../../src/utils/AppError');
const apiResponse = require('../../src/utils/apiResponse');
const { ErrorCodes, getErrorInfo } = require('../../src/utils/errorCodes');

describe('AppError', () => {
  test('should create AppError with correct properties', () => {
    const error = new AppError('ERR_COMMON_001', 'Test error');
    expect(error.code).toBe('ERR_COMMON_001');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  test('should use default message from error code', () => {
    const error = new AppError('USER_NOT_FOUND');
    expect(error.code).toBe('USER_NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  test('should convert to JSON correctly', () => {
    const error = new AppError('INVALID_PARAMETER', 'Invalid input', { field: 'email' });
    const json = error.toJSON();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe('INVALID_PARAMETER');
    expect(json.message).toBe('Invalid input');
    expect(json.details).toEqual({ field: 'email' });
  });

  test('should create notFound error correctly', () => {
    const error = AppError.notFound('Project');
    expect(error.code).toBe('ERR_COMMON_006');
    expect(error.message).toBe('Project not found');
  });

  test('should create missingParameter error correctly', () => {
    const error = AppError.missingParameter('name');
    expect(error.code).toBe('ERR_COMMON_003');
    expect(error.message).toBe('Missing required parameter: name');
  });
});

describe('ErrorCodes', () => {
  test('should have correct error code properties', () => {
    const errorInfo = ErrorCodes.USER_NOT_FOUND;
    expect(errorInfo.code).toBe('ERR_USER_001');
    expect(errorInfo.status).toBe(404);
  });

  test('should return UNKNOWN for invalid code', () => {
    const errorInfo = getErrorInfo('INVALID_CODE');
    expect(errorInfo.code).toBe('ERR_COMMON_001');
  });
});

describe('apiResponse', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test('should send success response', () => {
    apiResponse.success(mockRes, { id: 1 }, 'Success', 200);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: { id: 1 },
      timestamp: expect.any(String)
    });
  });

  test('should send success response with pagination', () => {
    const pagination = { total: 100, page: 1, pageSize: 10 };
    apiResponse.successWithPagination(mockRes, [{ id: 1 }], pagination);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: [{ id: 1 }],
      pagination: {
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10
      },
      timestamp: expect.any(String)
    });
  });
});
