import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { serverEnv } from "@/config/env";

function createS3Client(): S3Client {
  return new S3Client({
    region: serverEnv.AWS_REGION(),
    credentials: {
      accessKeyId: serverEnv.AWS_ACCESS_KEY_ID() ?? "",
      secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY() ?? "",
    },
  });
}

function getBucket(): string {
  const bucket = serverEnv.AWS_S3_BUCKET();
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET 환경변수가 설정되지 않았습니다");
  }
  return bucket;
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
  const client = createS3Client();
  const bucket = getBucket();

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
  const client = createS3Client();
  const bucket = getBucket();

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
  const client = createS3Client();
  const bucket = getBucket();

  const listResult = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    })
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
