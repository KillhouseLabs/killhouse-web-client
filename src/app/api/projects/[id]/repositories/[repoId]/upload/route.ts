import { NextResponse } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  validateZipFileMetadata,
  validateZipMagicBytes,
} from "@/lib/upload/validate-zip";
import {
  uploadStreamToS3,
  generateUploadKey,
} from "@/infrastructure/storage/s3-client";

interface RouteParams {
  params: Promise<{ id: string; repoId: string }>;
}

// POST /api/projects/[id]/repositories/[repoId]/upload - Upload ZIP file
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId, repoId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
        status: { not: "DELETED" },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check repository exists and is MANUAL
    const repository = await prisma.repository.findFirst({
      where: {
        id: repoId,
        projectId,
        provider: "MANUAL",
      },
    });

    if (!repository) {
      return NextResponse.json(
        { success: false, error: "수동 저장소를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "파일이 필요합니다" },
        { status: 400 }
      );
    }

    // Validate file metadata (name and size)
    const metadataValidation = validateZipFileMetadata(file.name, file.size);
    if (!metadataValidation.valid) {
      return NextResponse.json(
        { success: false, error: metadataValidation.error },
        { status: 400 }
      );
    }

    // Read first 4 bytes for magic number validation
    const stream = file.stream();
    const reader = stream.getReader();
    const { value: firstChunk } = await reader.read();

    if (!firstChunk || firstChunk.length < 4) {
      return NextResponse.json(
        { success: false, error: "유효한 ZIP 파일이 아닙니다" },
        { status: 400 }
      );
    }

    // Validate ZIP magic bytes
    const magicValidation = validateZipMagicBytes(
      Buffer.from(firstChunk.slice(0, 4))
    );
    if (!magicValidation.valid) {
      reader.releaseLock();
      return NextResponse.json(
        { success: false, error: magicValidation.error },
        { status: 400 }
      );
    }

    // Create a new stream that includes the first chunk we already read
    // Convert Web ReadableStream to Node.js Readable stream
    const nodeStream = Readable.from(
      (async function* () {
        // Yield the first chunk we already read
        yield firstChunk;
        // Then yield the rest of the stream
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield value;
          }
        } finally {
          reader.releaseLock();
        }
      })()
    );

    // Upload to S3 using streaming
    const s3Key = generateUploadKey(projectId, repoId, file.name);
    await uploadStreamToS3(s3Key, nodeStream, "application/zip");

    // Update repository with upload key
    const updatedRepo = await prisma.repository.update({
      where: { id: repoId },
      data: { uploadKey: s3Key },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          uploadKey: s3Key,
          repository: updatedRepo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
