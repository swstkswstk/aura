export const uploadProfileImage = async (_file: File): Promise<never> => {
  throw new Error('Profile image upload is disabled until real cloud storage is configured.');
};
