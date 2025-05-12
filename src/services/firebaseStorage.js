import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload a profile picture to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - The user ID to associate with the file
 * @returns {Promise<string>} - The download URL for the uploaded file
 */
export const uploadProfilePicture = async (file, userId) => {
  try {
    if (!file) {
      console.error('No file provided for upload');
      throw new Error('No file provided for upload');
    }
    
    if (!userId) {
      console.error('No user ID provided for upload');
      throw new Error('No user ID provided for upload');
    }
    
    // Create a unique file path with timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    // Modify the storage path to match Firebase rules structure: profile_pictures/{userId}/{filename}
    const storageRef = ref(storage, `profile_pictures/${userId}/${timestamp}.${fileExtension}`);
    
    // Log detailed info for debugging
    console.log(`Preparing upload to Firebase Storage...`);
    console.log(`- File name: ${file.name}`);
    console.log(`- File type: ${file.type}`);
    console.log(`- File size: ${file.size} bytes`);
    console.log(`- User ID: ${userId}`);
    console.log(`- Storage path: profile_pictures/${userId}/${timestamp}.${fileExtension}`);
    
    // Upload the file to Firebase Storage
    console.log(`Starting upload...`);
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Profile picture uploaded successfully');
    console.log(`- Bytes transferred: ${snapshot.bytesTransferred}`);
    console.log(`- Total bytes: ${snapshot.totalBytes}`);
    
    // Get the download URL for the file
    console.log('Generating download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL generated:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide specific error messages for common Firebase storage errors
    if (error.code === 'storage/unauthorized') {
      throw new Error('Not authorized to upload. Please check your Firebase permissions.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown error occurred during upload.');
    } else {
      throw error;
    }
  }
};

/**
 * Delete an existing profile picture from Firebase Storage
 * @param {string} fileUrl - The URL of the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export const deleteProfilePicture = async (fileUrl) => {
  try {
    if (!fileUrl) return false;
    
    // Extract the file path from the URL
    // This is needed because we need a reference to the file, not the URL
    // The URL looks like: https://firebasestorage.googleapis.com/v0/b/[project-id].appspot.com/o/[file-path]?[params]
    const fileRef = ref(storage, decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]));
    
    // Delete the file from Firebase Storage
    await deleteObject(fileRef);
    console.log('Previous profile picture deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    // Don't throw error here - if deletion fails, we can still continue
    return false;
  }
};

/**
 * Update a user's profile picture - deletes old one if it exists and uploads new one
 * @param {File} file - The new profile picture file
 * @param {string} userId - The user ID
 * @param {string} currentPictureUrl - The current profile picture URL (if any)
 * @returns {Promise<string>} - The download URL for the new profile picture
 */
export const updateProfilePicture = async (file, userId, currentPictureUrl) => {
  try {
    // If there's an existing profile picture, try to delete it first
    if (currentPictureUrl && currentPictureUrl.includes('firebasestorage.googleapis.com')) {
      await deleteProfilePicture(currentPictureUrl);
    }
    
    // Upload the new profile picture
    return await uploadProfilePicture(file, userId);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
}; 