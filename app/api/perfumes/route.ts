import { z } from 'zod';
import type { Database } from '@/types/database';
import type { PerfumeCreateInput } from '@/types/api';
import { ensureProfileRow, requireUser } from '@/app/api/_shared/auth';
import { badRequest, created, ok, serverError, unauthorized } from '@/app/api/_shared/response';

const createSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  notes_top: z.array(z.string()).optional(),
  notes_middle: z.array(z.string()).optional(),
  notes_base: z.array(z.string()).optional(),
  family: z.string().min(1),
  mood: z.string().min(1),
  usage_context: z.array(z.string()).nullable().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  try {
    const { supabase } = auth;
    const { data, error } = await supabase
      .from('user_perfumes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return serverError(error.message);
    return ok(data ?? []);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return badRequest(parsed.error.message);

  try {
    const { supabase, user } = auth;
    await ensureProfileRow(supabase, user.id);

    const input = parsed.data satisfies PerfumeCreateInput;
    const payload: Database['public']['Tables']['user_perfumes']['Insert'] = {
      user_id: user.id,
      name: input.name,
      brand: input.brand,
      notes_top: input.notes_top ?? [],
      notes_middle: input.notes_middle ?? [],
      notes_base: input.notes_base ?? [],
      family: input.family,
      mood: input.mood,
      usage_context: input.usage_context ?? null,
    };

    const { data, error } = await supabase
      .from('user_perfumes')
      .insert(payload)
      .select('*')
      .single();

    if (error) return serverError(error.message);
    return created(data);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

