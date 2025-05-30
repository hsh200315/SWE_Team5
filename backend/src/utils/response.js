module.exports = {
    // 성공 응답을 클라이언트에 전송
    success: (res, payload) => {
      const { code, message, data } = payload;
  
      const response = {
        code: code || 200,
        status: 'success',
        message,
        data,
      };
      res.status(code).json(response);
    },
    // 실패 응답을 클라이언트에 전송
    failed: (res, payload) => {
      const { code, message, error } = payload;
  
      const response = {
        code: code || 500,
        status: 'failed',
        message,
        error,
      };
  
      res.status(code).json(response);
    },
  };
  