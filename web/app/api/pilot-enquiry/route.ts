import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export interface PilotEnquiryPayload {
  name: string;
  organisation: string;
  email: string;
  phone?: string;
  fleetSize: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, organisation, email, phone, fleetSize, message } = body as Partial<PilotEnquiryPayload>;

    // Field validations
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.name = 'Full name is required (minimum 2 characters).';
    }

    if (!organisation || typeof organisation !== 'string' || organisation.trim().length < 2) {
      errors.organisation = 'Transit agency or organisation name is required.';
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.email = 'A valid work email address is required.';
    }

    if (!fleetSize || typeof fleetSize !== 'string' || fleetSize.trim().length === 0) {
      errors.fleetSize = 'Please specify your approximate fleet size.';
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      errors.message = 'Please provide details about your pilot objectives (minimum 10 characters).';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
          message: 'Validation failed. Please correct the highlighted fields.'
        },
        { status: 400 }
      );
    }

    const enquiryRecord = {
      id: `ENQ-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      name: name!.trim(),
      organisation: organisation!.trim(),
      email: email!.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      fleetSize: fleetSize!.trim(),
      message: message!.trim()
    };

    const webhookUrl = process.env.PILOT_ENQUIRY_WEBHOOK_URL?.trim();

    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enquiryRecord)
        });

        if (!webhookResponse.ok) {
          throw new Error(`Webhook target responded with status ${webhookResponse.status}`);
        }

        return NextResponse.json({
          success: true,
          mode: 'webhook',
          enquiryId: enquiryRecord.id,
          message: 'Thank you. Your pilot enquiry has been delivered to our operations team via the configured webhook.'
        });
      } catch (webhookErr) {
        console.error('Failed to forward pilot enquiry to webhook:', webhookErr);
        return NextResponse.json(
          {
            success: false,
            message: 'Configured enquiry webhook destination is currently unreachable. Please try again later.'
          },
          { status: 502 }
        );
      }
    }

    // In production, require an explicit webhook or database destination to avoid ephemeral bundle writes
    const isProduction = process.env.NODE_ENV === 'production';
    const allowLocalDemo = process.env.ALLOW_LOCAL_DEMO_ENQUIRIES === 'true';

    if (isProduction && !allowLocalDemo) {
      return NextResponse.json(
        {
          success: false,
          code: 'DESTINATION_NOT_CONFIGURED',
          message: 'Pilot enquiry delivery target is not configured. In production, a persistent PILOT_ENQUIRY_WEBHOOK_URL is required to record enquiries.'
        },
        { status: 503 }
      );
    }

    // Safe local-only demonstration store for development and automated testing
    try {
      const candidates = [
        path.resolve(process.cwd(), 'data', 'research', 'pilot_enquiries.json'),
        path.resolve(process.cwd(), '..', 'data', 'research', 'pilot_enquiries.json')
      ];

      let targetPath = candidates[0];
      for (const cand of candidates) {
        try {
          await fs.access(path.dirname(cand));
          targetPath = cand;
          break;
        } catch {
          // continue
        }
      }

      let existing: unknown[] = [];
      try {
        const raw = await fs.readFile(targetPath, 'utf8');
        existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }

      existing.unshift(enquiryRecord);
      await fs.writeFile(targetPath, JSON.stringify(existing.slice(0, 50), null, 2), 'utf8');

      return NextResponse.json({
        success: true,
        mode: 'demonstration_store',
        enquiryId: enquiryRecord.id,
        message: 'Enquiry received. Our customer care executive will contact you shortly.'
      });
    } catch (fsErr: unknown) {
      console.error('Local file persistence failed:', fsErr);
      const msg = fsErr instanceof Error ? fsErr.message : 'Filesystem write error';
      return NextResponse.json(
        {
          success: false,
          code: 'PERSISTENCE_FAILED',
          message: `Failed to persist enquiry to local store: ${msg}`
        },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error processing enquiry';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
