import { NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can submit document links' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, documentUrls } = body;

    if (!requestId) {
      return NextResponse.json({ message: 'Missing requestId for document links submission' }, { status: 400 });
    }

    if (!documentUrls || !Array.isArray(documentUrls)) {
      return NextResponse.json({ message: 'No document URLs provided' }, { status: 400 });
    }

    const submittedDocuments = [];

    for (const url of documentUrls) {
      // Basic URL validation (can be enhanced with a library like 'is-valid-http-url' if needed)
      try {
        new URL(url); // Attempt to construct a URL object to validate
      } catch (e) {
        console.warn(`Skipping invalid URL: ${url}`);
        continue;
      }

      // Determine a basic fileType, or use a default if not inferable
      const fileExtension = url.split('.').pop()?.split('?')[0]; // Get extension, remove query params
      let fileType = 'application/octet-stream';
      if (fileExtension) {
        switch (fileExtension.toLowerCase()) {
          case 'pdf': fileType = 'application/pdf'; break;
          case 'jpg':
          case 'jpeg': fileType = 'image/jpeg'; break;
          case 'png': fileType = 'image/png'; break;
          case 'gif': fileType = 'image/gif'; break;
          case 'doc': fileType = 'application/msword'; break;
          case 'docx': fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
          case 'xls': fileType = 'application/vnd.ms-excel'; break;
          case 'xlsx': fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        }
      }

      const [newDoc] = await db.insert(documents).values({
        requestId: requestId,
        fileUrl: url, // Store the provided URL
        fileType: fileType,
      }).returning();
      submittedDocuments.push(newDoc);
    }

    if (submittedDocuments.length === 0) {
        return NextResponse.json({ message: 'No valid document links submitted' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Document links submitted successfully', documents: submittedDocuments }, { status: 201 });

  } catch (error) {
    console.error('Document link submission error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
