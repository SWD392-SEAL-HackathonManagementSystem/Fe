import axiosClient from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export const userService = {
  /**
   * Get current user profile.
   * Returns user info including status (PENDING / APPROVED / REJECTED) and role.
   */
  getMe: async () => {
    return axiosClient.get(ENDPOINTS.USERS.ME);
  },

  /**
   * Update current user's onboarding profile.
   * PATCH /api/v1/users/me
   * @param {object} payload - { fullName, userType, studentCode, chapterId, institution, phone }
   */
  patchMe: async (payload) => {
    return axiosClient.patch(ENDPOINTS.USERS.ME, payload);
  },

  /**
   * Upload student card image.
   * POST /api/v1/users/me/student-card
   * @param {File} file - The image file to upload
   */
  uploadStudentCard: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(ENDPOINTS.USERS.ME_STUDENT_CARD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Admin / Coordinator: update user status to APPROVED or REJECTED.
   * PATCH /api/v1/users/{userId}/status
   * @param {string|number} userId
   * @param {'APPROVED'|'REJECTED'} status
   */
  updateUserStatus: async (userId, status) => {
    return axiosClient.patch(ENDPOINTS.USERS.STATUS(userId), { status });
  },
};
