const { handleR2Delete } = require("../r2-presign.cjs");

module.exports = function handler(req, res) {
  return handleR2Delete(req, {
    writeHead(status, headers) {
      res.statusCode = status;
      Object.entries(headers || {}).forEach(([key, value]) => res.setHeader(key, value));
    },
    end(body) {
      res.end(body);
    },
  });
};
