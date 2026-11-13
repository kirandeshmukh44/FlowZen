import apiClient from './client';

/**
 * Get current user's profile
 */
export const getProfile = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

/**
 * Upload profile photo
 * @param {File} file - The image file to upload
 */
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('photo', file);

  // Let Axios/browser attach the multipart boundary automatically.
  const response = await apiClient.post('/users/profile/photo', formData);

  return response.data;
};

/**
 * Remove profile photo
 */
export const removeProfilePhoto = async () => {
  const response = await apiClient.delete('/users/profile/photo');
  return response.data;
};
