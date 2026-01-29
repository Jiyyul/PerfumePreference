import { z } from 'zod';
import type { Database } from '@/types/database';
import type { PreferenceUpsertInput } from '@/types/api';
import { ensureProfileRow, requireUser } from '@/app/api/_shared/auth';
import { badRequest, ok, serverError, unauthorized } from '@/app/api/_shared/response';

const upsertSchema = z.object({
  preferred_notes: z.array(z.string()).optional(),
  disliked_notes: z.array(z.string()).optional(),
  usage_context: z.array(z.string()).optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  try {
    const { supabase, user } = auth;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return serverError(error.message);
    return ok(data ?? null);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) return badRequest(parsed.error.message);

  try {
    const { supabase, user } = auth;
    await ensureProfileRow(supabase, user.id);

    const input = parsed.data satisfies PreferenceUpsertInput;
    const payload: Database['public']['Tables']['user_preferences']['Insert'] = {
      user_id: user.id,
      preferred_notes: input.preferred_notes ?? [],
      disliked_notes: input.disliked_notes ?? [],
      usage_context: input.usage_context ?? [],
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) return serverError(error.message);
    return ok(data);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

