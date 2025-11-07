// supabase/functions/create-razorpay-order/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Razorpay from "https://cdn.skypack.dev/razorpay";

// Add this line to fix a Deno crypto bug
import "https://deno.land/x/xhr@0.3.1/mod.ts";

console.log("Create Razorpay Order function up!");

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { amount } = await req.json(); // We'll send the amount from our app

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!,
    });

    const options = {
      amount: amount * 100, // Amount in the smallest currency unit (e.g., paisa)
      currency: "INR",
      receipt: `receipt_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      throw new Error("Order creation failed");
    }

    return new Response(JSON.stringify({ orderId: order.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
