const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');

exports.protect = async (req, res, next) => {
  // 1. get the token from req.headers.authorization
  let token = req.headers.authorization;

  // 2. if missing, return 401
  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: `Unauthorized`,
    });
  }

  token = req.headers.authorization.split(' ')[1];

  // 3. try to verify it with jwt.verify — wrap in try/catch since verify() throws on failure
  try {
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET, { algorithms: 'HS256' });

    // 5. if valid, find the User by the id in the decoded payload
    if (verifyToken) {
      const userId = verifyToken.id;
      let user = await User.findOne({ _id: userId });
      // 6. attach that user to req.user
      req.user = user;
    }
    next();
  } catch (error) {
    // 4. if verify fails, return 401 (catch block)
    return res.status(401).json({
      status: 'fail',
      message: `Cannot verify: ${error}`,
    });
  }

  // 7. call next()
};
