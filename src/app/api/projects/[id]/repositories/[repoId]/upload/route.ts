import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { validateZipFile } from "@/lib/upload/validate-zip";
import {
  uploadToS3,
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

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate ZIP file
    const validation = validateZipFile(file.name, buffer, file.size);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload to S3
    const s3Key = generateUploadKey(projectId, repoId, file.name);
    await uploadToS3(s3Key, buffer, "application/zip");

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
