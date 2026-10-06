export interface CloudinaryUploadOptions {
  category: 'students' | 'employees' | 'homework' | 'leaves' | 'certificates' | 'school';
  schoolPrefix?: string; // Default: 'AVM'
  onProgress?: (progressPercent: number) => void;
  maxSizeBytes?: number; // Default: 10MB
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  original_filename?: string;
  created_at?: string;
  url: string;
}

export const CLOUDINARY_CONFIG = {
  cloudName: 'nscvwp2f',
  uploadPreset: 'school_erp_upload',
  uploadUrl: 'https://api.cloudinary.com/v1_1/nscvwp2f/auto/upload',
  defaultPrefix: 'AVM'
};

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

const validateFile = (fileInput: File | Blob | string, maxSizeBytes: number) => {
  if (fileInput instanceof File) {
    if (fileInput.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      const actualMb = (fileInput.size / (1024 * 1024)).toFixed(2);
      throw new Error(`File size (${actualMb} MB) exceeds maximum allowed limit of ${maxMb} MB.`);
    }
    const ext = fileInput.name.split('.').pop()?.toLowerCase();
    const mime = fileInput.type.toLowerCase();
    const isValidFormat = (ext && ALLOWED_FORMATS.includes(ext)) || mime.includes('image/') || mime.includes('pdf');
    if (!isValidFormat) {
      throw new Error(`Invalid file format (${ext}). Allowed formats: JPG, JPEG, PNG, WEBP, PDF.`);
    }
  } else if (typeof fileInput === 'string' && fileInput.startsWith('data:')) {
    const mimeMatch = fileInput.match(/^data:(image\/[a-zA-Z0-9+.-]+|application\/pdf)/);
    if (!mimeMatch) {
      throw new Error(`Invalid file format in Base64 data URL. Allowed formats: JPG, JPEG, PNG, WEBP, PDF.`);
    }
    const base64Length = fileInput.length - (fileInput.indexOf(',') + 1);
    const sizeInBytes = (base64Length * 3) / 4;
    if (sizeInBytes > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      const actualMb = (sizeInBytes / (1024 * 1024)).toFixed(2);
      throw new Error(`File size (${actualMb} MB) exceeds maximum allowed limit of ${maxMb} MB.`);
    }
  }
};

function parseUploadArgs(arg1?: any, arg2?: any, arg3?: any) {
  let schoolPrefix = CLOUDINARY_CONFIG.defaultPrefix;
  let onProgress: ((p: number) => void) | undefined = undefined;

  const checkPrefix = (val: any) => {
    if (typeof val === 'string') {
      if (val.toUpperCase().startsWith('AVM')) return 'AVM';
      if (val.toUpperCase().startsWith('GJPS')) return 'GJPS';
    }
    return null;
  };

  if (typeof arg1 === 'function') {
    onProgress = arg1;
  } else if (typeof arg1 === 'string') {
    const pref = checkPrefix(arg1);
    if (pref) schoolPrefix = pref;

    if (typeof arg2 === 'function') {
      onProgress = arg2;
    } else if (typeof arg2 === 'string') {
      const pref2 = checkPrefix(arg2);
      if (pref2) schoolPrefix = pref2;
      if (typeof arg3 === 'function') {
        onProgress = arg3;
      }
    }
  }

  return { schoolPrefix, onProgress };
}

export const cloudinaryService = {
  async uploadFile(
    fileInput: File | Blob | string,
    options: CloudinaryUploadOptions
  ): Promise<CloudinaryUploadResponse> {
    const prefix = options.schoolPrefix || CLOUDINARY_CONFIG.defaultPrefix;
    const folder = `${prefix}/${options.category}`;
    const maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB

    validateFile(fileInput, maxSizeBytes);

    const formData = new FormData();
    formData.append('file', fileInput);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', CLOUDINARY_CONFIG.uploadUrl, true);

      if (options.onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            options.onProgress!(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve({
              secure_url: res.secure_url,
              url: res.url || res.secure_url,
              public_id: res.public_id,
              resource_type: res.resource_type || 'image',
              format: res.format,
              bytes: res.bytes,
              original_filename: res.original_filename || 'file',
              created_at: res.created_at || new Date().toISOString()
            });
          } catch (err) {
            reject(new Error('Failed to parse Cloudinary response JSON.'));
          }
        } else {
          let errorMsg = `Upload failed (HTTP ${xhr.status}). Please check your internet connection and try again.`;
          try {
            const errRes = JSON.parse(xhr.responseText);
            if (errRes.error?.message) errorMsg = errRes.error.message;
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed. Please check your internet connection and try again.'));
      };

      xhr.send(formData);
    });
  },

  async uploadStudentPhoto(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    const { schoolPrefix, onProgress } = parseUploadArgs(arg1, arg2, arg3);
    return this.uploadFile(fileOrBase64, {
      category: 'students',
      schoolPrefix,
      onProgress
    });
  },

  async uploadEmployeePhoto(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    const { schoolPrefix, onProgress } = parseUploadArgs(arg1, arg2, arg3);
    return this.uploadFile(fileOrBase64, {
      category: 'employees',
      schoolPrefix,
      onProgress
    });
  },

  async uploadHomeworkFile(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    const { schoolPrefix, onProgress } = parseUploadArgs(arg1, arg2, arg3);
    return this.uploadFile(fileOrBase64, {
      category: 'homework',
      schoolPrefix,
      onProgress
    });
  },

  async uploadHomeworkAttachment(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    return this.uploadHomeworkFile(fileOrBase64, arg1, arg2, arg3);
  },

  async uploadLeaveDocument(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    const { schoolPrefix, onProgress } = parseUploadArgs(arg1, arg2, arg3);
    return this.uploadFile(fileOrBase64, {
      category: 'leaves',
      schoolPrefix,
      onProgress
    });
  },

  async uploadCertificate(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    const { schoolPrefix, onProgress } = parseUploadArgs(arg1, arg2, arg3);
    return this.uploadFile(fileOrBase64, {
      category: 'certificates',
      schoolPrefix,
      onProgress
    });
  },

  async uploadCertificateDocument(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    return this.uploadCertificate(fileOrBase64, arg1, arg2, arg3);
  },

  async uploadSchoolAsset(
    fileOrBase64: File | Blob | string,
    arg1?: any,
    arg2?: any,
    arg3?: any
  ): Promise<CloudinaryUploadResponse> {
    const { schoolPrefix, onProgress } = parseUploadArgs(arg1, arg2, arg3);
    return this.uploadFile(fileOrBase64, {
      category: 'school',
      schoolPrefix,
      onProgress
    });
  }
};
