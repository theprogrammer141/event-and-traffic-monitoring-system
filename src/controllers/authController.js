const User = require('./../models/userModel');
const signToken = require('./../utils/signToken');
const bcrypt = require('bcrypt');

exports.registerUser = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).json({
      status: 'fail',
      message: 'Passwords do not match!',
    });
  }

  try {
    const newUser = await User.create({ fullName, email, password });
    newUser.password = undefined;
    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      data: {
        token,
        newUser,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: `Cannot register user: ${error}`,
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Invalid email or password!' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    } else {
      const token = signToken(user._id);
      user.password = undefined;

      res.status(200).json({
        status: 'success',
        data: {
          token,
          user,
        },
      });
    }
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: `Login failed: ${error}`,
    });
  }
};
