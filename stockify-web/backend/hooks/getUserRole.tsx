import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getUserData(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error in getUserData:", error.message);
      return null;
    }

    return data?.role || null;
  } catch (err) {
    console.error("Unexpected error fetching user data:", err);
    return null;
  }
}