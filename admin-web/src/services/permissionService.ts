import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface PermissionStatusResult {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  message?: string;
}

export const permissionService = {
  /**
   * Check Camera Permission
   */
  async checkCameraPermission(): Promise<PermissionStatusResult> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: true, denied: false, prompt: false };
    }
    try {
      const status = await Camera.checkPermissions();
      const granted = status.camera === 'granted';
      const denied = status.camera === 'denied';
      return { granted, denied, prompt: status.camera === 'prompt' };
    } catch (e) {
      return { granted: true, denied: false, prompt: false };
    }
  },

  /**
   * Request Camera Permission
   */
  async requestCameraPermission(): Promise<PermissionStatusResult> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: true, denied: false, prompt: false };
    }
    try {
      const status = await Camera.requestPermissions({ permissions: ['camera'] });
      const granted = status.camera === 'granted';
      const denied = status.camera === 'denied';
      return {
        granted,
        denied,
        prompt: false,
        message: denied ? 'Camera permission is required to capture photos for profile and school work.' : undefined
      };
    } catch (e) {
      return { granted: false, denied: true, prompt: false, message: 'Camera permission request failed.' };
    }
  },

  /**
   * Check Notification Permission
   */
  async checkNotificationPermission(): Promise<PermissionStatusResult> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: true, denied: false, prompt: false };
    }
    try {
      const status = await LocalNotifications.checkPermissions();
      const granted = status.display === 'granted';
      const denied = status.display === 'denied';
      return { granted, denied, prompt: status.display === 'prompt' };
    } catch (e) {
      return { granted: true, denied: false, prompt: false };
    }
  },

  /**
   * Request Notification Permission
   */
  async requestNotificationPermission(): Promise<PermissionStatusResult> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: true, denied: false, prompt: false };
    }
    try {
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';
      const denied = status.display === 'denied';
      return {
        granted,
        denied,
        prompt: false,
        message: denied ? 'Notification permission allows you to stay updated on attendance, homework, and notices.' : undefined
      };
    } catch (e) {
      return { granted: false, denied: true, prompt: false };
    }
  },

  /**
   * Capture photo using Camera or Gallery
   */
  async capturePhoto(source: 'camera' | 'photos'): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    try {
      if (Capacitor.isNativePlatform() && source === 'camera') {
        const perm = await this.requestCameraPermission();
        if (!perm.granted) {
          return { success: false, error: perm.message || 'Camera permission denied.' };
        }
      }

      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({
          quality: 85,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
        });
        return { success: true, dataUrl: image.dataUrl };
      } else {
        // Fallback for Web browser
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => resolve({ success: true, dataUrl: reader.result as string });
              reader.onerror = () => resolve({ success: false, error: 'Failed to read image file.' });
              reader.readAsDataURL(file);
            } else {
              resolve({ success: false, error: 'No image selected.' });
            }
          };
          input.click();
        });
      }
    } catch (e: any) {
      console.warn('Image capture canceled or failed:', e);
      return { success: false, error: e?.message || 'Operation canceled.' };
    }
  },

  /**
   * Pick Document / Media File
   */
  async pickDocument(accept: string = 'image/*,video/*,application/pdf'): Promise<{ success: boolean; name?: string; dataUrl?: string; type?: string; size?: number; error?: string }> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => resolve({
            success: true,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string
          });
          reader.onerror = () => resolve({ success: false, error: 'Failed to read selected file.' });
          reader.readAsDataURL(file);
        } else {
          resolve({ success: false, error: 'No file selected.' });
        }
      };
      input.click();
    });
  }
};
