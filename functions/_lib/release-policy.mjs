export const MAX_RELEASE_SIZE = 1024 ** 3;

const types = {
  exe: 'application/vnd.microsoft.portable-executable',
  msi: 'application/x-msi',
  zip: 'application/zip',
};

export function releaseFileType(fileName) {
  const extension = String(fileName).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension ? types[extension] || null : null;
}

export function isReleaseUploadAllowed(user) {
  return Boolean(user && user.role === 'admin');
}

export function objectMatchesReleaseUpload(object, upload) {
  return Boolean(
    object && upload
    && Number(object.size) === Number(upload.file_size)
    && object.httpMetadata?.contentType === upload.content_type,
  );
}
