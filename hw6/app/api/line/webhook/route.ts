// 重定向到主要的 webhook endpoint
// 這個檔案是為了支援 /api/line/webhook 路徑
import { NextRequest, NextResponse } from 'next/server';
import { validateSignature } from '@line/bot-sdk';
import { handleWebhookEvent } from '@/lib/line/handlers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get raw body as text (important: don't parse before validation)
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || request.headers.get('X-Line-Signature');

    console.log('Webhook received:', {
      hasSignature: !!signature,
      signatureLength: signature?.length || 0,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100),
    });

    if (!signature) {
      console.error('Missing LINE signature');
      // Return 200 to prevent LINE from retrying
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 200 }
      );
    }

    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      console.error('LINE_CHANNEL_SECRET not configured');
      return NextResponse.json(
        { error: 'LINE_CHANNEL_SECRET not configured' },
        { status: 500 }
      );
    }

    // Validate signature
    const isValid = validateSignature(body, channelSecret, signature);
    console.log('Signature validation:', {
      isValid,
      channelSecretLength: channelSecret.length,
      channelSecretPrefix: channelSecret.substring(0, 5) + '...',
    });

    if (!isValid) {
      console.error('Invalid LINE signature');
      console.error('Debug info:', {
        bodyLength: body.length,
        bodyType: typeof body,
        signatureLength: signature.length,
        channelSecretExists: !!channelSecret,
      });
      
      // For debugging: log first 200 chars of body
      console.error('Body preview:', body.substring(0, 200));
      
      // Still return 200 to prevent LINE from retrying repeatedly
      // But log the error for investigation
      return NextResponse.json(
        { 
          error: 'Invalid signature',
          note: 'Signature validation failed, but returning 200 to prevent retries'
        },
        { status: 200 }
      );
    }

    let events: any[];
    try {
      const webhookBody = JSON.parse(body);
      events = webhookBody.events || [];
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!events || events.length === 0) {
      console.log('No events in webhook request');
      return NextResponse.json({ success: true, message: 'No events to process' });
    }

    // Process events asynchronously
    // Use Promise.allSettled to ensure we return 200 even if some events fail
    const promises = events.map((event: any) => 
      handleWebhookEvent(event).catch((error) => {
        console.error(`Failed to process event ${event.type}:`, error);
        return null; // Return null instead of throwing
      })
    );
    
    await Promise.allSettled(promises);

    // Always return 200 to LINE Platform
    // LINE expects 200 even if event processing fails
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    console.error('Error stack:', error?.stack);
    
    // Still return 200 to prevent LINE from retrying
    // Log the error for debugging
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error?.message || 'Unknown error'
      },
      { status: 200 } // Return 200 to LINE even on error
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'LINE Webhook endpoint is running',
    path: '/api/line/webhook',
    note: 'This endpoint is an alias for /api/webhook'
  });
}

