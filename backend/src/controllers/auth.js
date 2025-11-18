import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { 
  generateTokenPair, 
  verifyToken,
  createPasswordResetToken,
  createEmailVerificationToken,
  verifySpecialToken
} from '../utils/jwt.js';
import { AppError, catchAsync, validationError } from '../middleware/errorHandler.js';

// Register a new user
export const register = catchAsync(async (req, res, next) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const { username, email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    return next(new AppError(`User with this ${field} already exists`, 409));
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    profile: {
      firstName,
      lastName
    }
  });

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Save refresh token to user
  user.refreshTokens.push({
    token: tokens.refreshToken,
    createdAt: new Date()
  });
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      tokens
    }
  });
});

// Login user
export const login = catchAsync(async (req, res, next) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const { email, password } = req.body;

  // Find user with password field included
  const user = await User.findOne({ email }).select('+password +refreshTokens');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Please contact support.', 403));
  }

  // Update last login
  user.lastLogin = new Date();

  // Generate new tokens
  const tokens = generateTokenPair(user);

  // Clean up old refresh tokens (keep only last 5)
  user.refreshTokens = user.refreshTokens.slice(-4);
  user.refreshTokens.push({
    token: tokens.refreshToken,
    createdAt: new Date()
  });

  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      tokens
    }
  });
});

// Logout user
export const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove the specific refresh token
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  } else {
    // Remove all refresh tokens (logout from all devices)
    await User.updateOne(
      { _id: req.user.id },
      { $set: { refreshTokens: [] } }
    );
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh access token
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.id).select('+refreshTokens');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
  if (!tokenExists) {
    return next(new AppError('Refresh token not found', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 403));
  }

  // Generate new tokens
  const tokens = generateTokenPair(user);

  // Replace old refresh token with new one
  user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
  user.refreshTokens.push({
    token: tokens.refreshToken,
    createdAt: new Date()
  });

  await user.save();

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens
    }
  });
});

// Get current user profile
export const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const allowedFields = [
    'profile.firstName',
    'profile.lastName',
    'profile.preferences.defaultLanguage',
    'profile.preferences.theme',
    'profile.preferences.booksPerPage'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

// Change password
export const changePassword = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password +refreshTokens');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  
  // Clear all refresh tokens (force re-login on all devices)
  user.refreshTokens = [];
  
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again on all devices.'
  });
});

// Verify token endpoint
export const verifyTokenEndpoint = catchAsync(async (req, res, next) => {
  // If we reach here, the auth middleware has already verified the token
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

// Request password reset
export const forgotPassword = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate password reset token
  const resetToken = createPasswordResetToken(user._id);

  // In a real application, you would send this via email
  // For now, we'll just log it
  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
    // In development, return the token for testing
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

// Reset password
export const resetPassword = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const { token, newPassword } = req.body;

  // Verify reset token
  let decoded;
  try {
    decoded = verifySpecialToken(token, 'password-reset');
  } catch (error) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Find user
  const user = await User.findById(decoded.userId).select('+refreshTokens');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update password
  user.password = newPassword;
  
  // Clear all refresh tokens
  user.refreshTokens = [];
  
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
});