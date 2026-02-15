import { NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

// For multipart/form-data, Zod's parsing typically happens after
// extracting fields. File handling for Next.js API routes usually
// involves directly accessing 'request.formData()'.

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can upload documents' }, { status: 403 });
    }

    const formData = await req.formData();
    const requestId = formData.get('requestId') as string;

    if (!requestId) {
      return NextResponse.json({ message: 'Missing requestId for document upload' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[]; // 'files' is the field name from the frontend

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Basic file type validation (can be enhanced with a library like 'file-type')
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!file.type || !allowedTypes.includes(file.type)) {
        console.warn(`Skipping unsupported file type: ${file.name} (${file.type})`);
        continue;
      }

      // --- Placeholder for actual file storage to S3 or similar ---
      // In a real application, you would stream the file to a cloud storage service (e.g., S3).
      // For demonstration purposes, we will just simulate a file_url.
      const simulatedFileUrl = `https://your-s3-bucket.com/uploads/${requestId}/${file.name}`;
      console.log(`SIMULATING FILE UPLOAD: File "${file.name}" would be uploaded to ${simulatedFileUrl}`);
      // Actual upload logic would go here, e.g.:
      // const buffer = Buffer.from(await file.arrayBuffer());
      // await s3.upload({ Bucket: 'your-bucket', Key: `uploads/${requestId}/${file.name}`, Body: buffer });
      // const fileUrl = getPublicUrl(s3key);
      // --- End Placeholder ---

      const [newDoc] = await db.insert(documents).values({
        requestId: requestId,
        fileUrl: simulatedFileUrl, // Store placeholder URL
        fileType: file.type || 'application/octet-stream',
      }).returning();
      uploadedDocuments.push(newDoc);
    }

    if (uploadedDocuments.length === 0) {
        return NextResponse.json({ message: 'No valid documents uploaded' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Documents uploaded successfully', documents: uploadedDocuments }, { status: 201 });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
