// Violation fixture: browser code importing the Supabase SDK.
import { createClient } from "@supabase/supabase-js";

export const client = createClient("https://example.supabase.co", "key");
