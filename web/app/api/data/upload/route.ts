import { NextRequest, NextResponse } from 'next/server';
import { ingestOperationalDataset, IngestionUploadItem } from '@/lib/supabase/ingestion-service';
import { uploadFileToBucket, BUCKETS } from '@/lib/supabase/storage-service';
import { recordAuditEvent } from '@/lib/supabase/persistence-service';
import { requireServerAuth } from '@/lib/auth/server-auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize caller server-side (enforcing data_manager or administrator role)
    const auth = await requireServerAuth(req, ['data_manager', 'administrator']);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user } = auth;
    const orgId = user.organizationId;
    const userId = user.id;

    const formData = await req.formData();
    const datasetType = (formData.get('datasetType') as string) || 'operational';
    const datasetName = (formData.get('datasetName') as string) || '';
    const datasetDate = (formData.get('datasetDate') as string) || new Date().toISOString().slice(0, 10);

    // 2. RESEARCH DATA UPLOAD WORKFLOW (KEPT STRICTLY SEPARATE)
    if (datasetType === 'research') {
      const researchFile = formData.get('file') as File | null;
      if (!researchFile) {
        return NextResponse.json(
          { success: false, message: 'No research file provided in upload request.' },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await researchFile.arrayBuffer());
      const ext = researchFile.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'json', 'csv'].includes(ext || '')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid research file type. Only Excel (.xlsx, .xls), JSON, or CSV research workbooks are permitted.'
          },
          { status: 400 }
        );
      }

      const storagePath = `${orgId}/research/${Date.now()}_${researchFile.name}`;
      const uploadResult = await uploadFileToBucket(
        BUCKETS.RESEARCH,
        storagePath,
        fileBuffer,
        researchFile.type || 'application/octet-stream'
      );

      await recordAuditEvent(
        orgId,
        userId,
        'research_file_uploaded',
        'research_source',
        storagePath,
        {
          filename: researchFile.name,
          fileSize: fileBuffer.length,
          classification: 'research_only_aggregate',
          uploadedBy: userId
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          storagePath,
          filename: researchFile.name,
          fileSize: fileBuffer.length,
          classification: 'Research Case Study (Simulated Archetypes Context Only)',
          storageResult: uploadResult
        },
        message: 'Research file uploaded and stored securely in private research storage. Isolated from operational dispatch tables.'
      });
    }

    // 3. OPERATIONAL DATASET UPLOAD WORKFLOW
    const files: IngestionUploadItem[] = [];
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        files.push({
          filename: value.name,
          buffer,
          mimeType: value.type || 'text/plain'
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No operational files received. The complete required set of 9 files must be submitted.' },
        { status: 400 }
      );
    }

    const ingestionResult = await ingestOperationalDataset(
      orgId,
      userId,
      datasetName,
      datasetDate,
      files
    );

    const httpStatus = ingestionResult.success ? 200 : 422;
    return NextResponse.json(ingestionResult, { status: httpStatus });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Upload processing error';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
