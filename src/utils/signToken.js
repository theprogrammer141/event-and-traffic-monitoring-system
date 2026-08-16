const jwt = require('jsonwebtoken');

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = signToken;
