/**
 * ZIP 파일 유효성 검사
 *
 * 1. 파일 확장자 검사 (.zip)
 * 2. 매직 바이트 검사 (PK\x03\x04)
 * 3. 파일 크기 제한 검사
 */

const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ZipValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 파일명의 확장자가 .zip인지 검사
 */
export function validateZipExtension(filename: string): ZipValidationResult {
  if (!filename.toLowerCase().endsWith(".zip")) {
    return {
      valid: false,
      error: "ZIP 파일만 업로드할 수 있습니다",
    };
  }
  return { valid: true };
}

/**
 * 파일 버퍼의 매직 바이트가 ZIP 형식인지 검사
 */
export function validateZipMagicBytes(
  buffer: ArrayBuffer | Buffer
): ZipValidationResult {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) {
    return {
      valid: false,
      error: "유효한 ZIP 파일이 아닙니다",
    };
  }

  for (let i = 0; i < ZIP_MAGIC_BYTES.length; i++) {
    if (bytes[i] !== ZIP_MAGIC_BYTES[i]) {
      return {
        valid: false,
        error: "유효한 ZIP 파일이 아닙니다",
      };
    }
  }

  return { valid: true };
}

/**
 * 파일 크기 제한 검사
 */
export function validateFileSize(sizeBytes: number): ZipValidationResult {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다`,
    };
  }
  if (sizeBytes === 0) {
    return {
      valid: false,
      error: "빈 파일은 업로드할 수 없습니다",
    };
  }
  return { valid: true };
}

/**
 * ZIP 파일 종합 유효성 검사
 */
export function validateZipFile(
  filename: string,
  buffer: ArrayBuffer | Buffer,
  sizeBytes: number
): ZipValidationResult {
  const extensionResult = validateZipExtension(filename);
  if (!extensionResult.valid) return extensionResult;

  const sizeResult = validateFileSize(sizeBytes);
  if (!sizeResult.valid) return sizeResult;

  const magicResult = validateZipMagicBytes(buffer);
  if (!magicResult.valid) return magicResult;

  return { valid: true };
}
