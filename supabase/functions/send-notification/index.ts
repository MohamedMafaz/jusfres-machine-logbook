import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user: string;
  step: number;
  entryId: string;
}

serve(async (req) => {
  console.log(`Notification function called with method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { user, step, entryId }: NotificationPayload = await req.json();
      
      console.log(`Sending notification: User ${user} completed step ${step} for entry ${entryId}`);

      // For now, we'll use a simple broadcast through Supabase realtime
      // In production, you could integrate with push notification services
      
      // Send notification through realtime channel
      const notificationData = {
        id: crypto.randomUUID(),
        user,
        step,
        entryId,
        message: `New maintenance update submitted by ${user} - Step ${step}/3 completed.`,
        timestamp: new Date().toISOString(),
        type: 'maintenance_update'
      };

      // Broadcast to all connected clients
      const channel = supabaseClient.channel('maintenance_notifications');
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notificationData
      });

      console.log('Notification sent successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification sent',
          data: notificationData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );

  } catch (error) {
    console.error('Error in notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});