import { User } from '../types';
import { authApi, getToken, removeToken } from './api';

// Demo admin phone that gets admin role
const ADMIN_PHONES = ['7786852209'];

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  demoCode?: string; // For development mode only
}

// Send OTP to phone
export const sendOtp = async (phone: string): Promise<AuthResponse> => {
  try {
    const result = await authApi.sendOtp(phone);

    if (result.success) {
      return {
        success: true,
        message: result.message || 'OTP sent successfully',
        demoCode: result.demoCode, // Only available in development
      };
    }

    return {
      success: false,
      message: result.error || 'Failed to send OTP',
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

// Verify OTP and login
export const verifyOtpAndLogin = async (
  phone: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const result = await authApi.verifyOtp(phone, code);

    if (result.success && result.user) {
      return {
        success: true,
        user: result.user,
      };
    }

    return {
      success: false,
      message: result.error || 'Verification failed',
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

// Check if user is logged in (from stored token)
export const checkAuth = async (): Promise<AuthResponse> => {
  try {
    const token = getToken();

    if (!token) {
      return { success: false };
    }

    const result = await authApi.getCurrentUser();

    if (result.success && result.user) {
      return {
        success: true,
        user: result.user,
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Check auth error:', error);
    return { success: false };
  }
};

// Logout
export const logout = (): void => {
  removeToken();
};

// Check if phone is admin
export const isAdminPhone = (phone: string): boolean => {
  return ADMIN_PHONES.includes(phone.replace(/\D/g, ''));
};

// Legacy exports for backward compatibility
export const sendMagicLink = sendOtp;

export const verifyMagicToken = async (
  phone: string,
  token: string
): Promise<AuthResponse> => {
  // Magic link is now handled as OTP
  return verifyOtpAndLogin(phone, token);
};
