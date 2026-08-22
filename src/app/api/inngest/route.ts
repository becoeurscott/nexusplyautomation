import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  postPublish,
  creditPlanRefill,
  creditPlanRefillOnDemand,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [postPublish, creditPlanRefill, creditPlanRefillOnDemand],
});
