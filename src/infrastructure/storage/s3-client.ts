import { serverEnv } from "@/config/env";

const DEFAULT_BUCKET_NAME = "killhouse-uploads";

let resolvedBucket: string | null = null;

async function createS3Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");

  const accessKeyId = serverEnv.AWS_ACCESS_KEY_ID();
  const secretAccessKey = serverEnv.AWS_SECRET_ACCESS_KEY();

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region: serverEnv.AWS_REGION(),
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  // AWS_ACCESS_KEY_ID 미설정 시 AWS SDK 기본 자격 증명 체인 사용
  // (~/.aws/credentials, IAM role, 등)
  return new S3Client({
    region: serverEnv.AWS_REGION(),
  });
}

/**
 * S3 버킷 이름을 반환.
 * AWS_S3_BUCKET 환경변수가 있으면 그대로 사용.
 * 없으면 기본 버킷(killhouse-uploads)을 확인 후 없으면 생성.
 * 생성도 실패하면 에러를 throw.
 */
async function getBucket(): Promise<string> {
  const envBucket = serverEnv.AWS_S3_BUCKET();
  if (envBucket) {
    return envBucket;
  }

  if (resolvedBucket) {
    return resolvedBucket;
  }

  const { HeadBucketCommand, CreateBucketCommand } =
    await import("@aws-sdk/client-s3");
  const client = await createS3Client();
  const region = serverEnv.AWS_REGION();

  // 버킷 존재 여부 확인
  try {
    await client.send(new HeadBucketCommand({ Bucket: DEFAULT_BUCKET_NAME }));
    resolvedBucket = DEFAULT_BUCKET_NAME;
    return resolvedBucket;
  } catch {
    // 버킷이 없으면 생성 시도
  }

  try {
    await client.send(
      new CreateBucketCommand({
        Bucket: DEFAULT_BUCKET_NAME,
        ...(region !== "us-east-1" && {
          CreateBucketConfiguration: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            LocationConstraint: region as any,
          },
        }),
      })
    );
    resolvedBucket = DEFAULT_BUCKET_NAME;
    return resolvedBucket;
  } catch (createError) {
    throw new Error(
      `S3 버킷을 생성할 수 없습니다 (${DEFAULT_BUCKET_NAME}): ${createError instanceof Error ? createError.message : String(createError)}`
    );
  }
}

/**
 * S3에 파일 업로드
 *
 * @param key S3 오브젝트 키 (예: "uploads/project-id/repo-id/source.zip")
 * @param body 파일 버퍼
 * @param contentType MIME 타입
 * @returns 업로드된 오브젝트의 S3 키
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await createS3Client();
  const bucket = await getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return key;
}

/**
 * S3에서 단일 오브젝트 삭제
 */
export async function deleteFromS3(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await createS3Client();
  const bucket = await getBucket();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * S3에서 특정 프리픽스의 모든 오브젝트 삭제
 * 프로젝트 삭제 시 해당 프로젝트의 모든 업로드 파일을 정리
 */
export async function deleteS3Prefix(prefix: string): Promise<number> {
  const { ListObjectsV2Command, DeleteObjectsCommand } =
    await import("@aws-sdk/client-s3");
  const client = await createS3Client();
  const bucket = await getBucket();

  const listResult = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
  );

  const objects = listResult.Contents;
  if (!objects || objects.length === 0) {
    return 0;
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key })),
      },
    })
  );

  return objects.length;
}

/**
 * 업로드용 S3 키 생성
 */
export function generateUploadKey(
  projectId: string,
  repositoryId: string,
  filename: string
): string {
  return `uploads/${projectId}/${repositoryId}/${filename}`;
}

/**
 * 프로젝트용 S3 프리픽스
 */
export function getProjectPrefix(projectId: string): string {
  return `uploads/${projectId}/`;
}

/** 테스트용: resolvedBucket 캐시 초기화 */
export function _resetBucketCache(): void {
  resolvedBucket = null;
}
