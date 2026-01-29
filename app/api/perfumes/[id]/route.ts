import { z } from 'zod';
import type { Database } from '@/types/database';
import type { PerfumeUpdateInput } from '@/types/api';
import { ensureProfileRow, requireUser } from '@/app/api/_shared/auth';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/app/api/_shared/response';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  notes_top: z.array(z.string()).optional(),
  notes_middle: z.array(z.string()).optional(),
  notes_base: z.array(z.string()).optional(),
  family: z.string().min(1).optional(),
  mood: z.string().min(1).optional(),
  usage_context: z.array(z.string()).nullable().optional(),
});

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  const { id } = await ctx.params;

  try {
    const { supabase } = auth;
    const { data, error } = await supabase.from('user_perfumes').select('*').eq('id', id).single();
    if (error) return notFound();
    return ok(data);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return badRequest(parsed.error.message);

  try {
    const { supabase, user } = auth;
    await ensureProfileRow(supabase, user.id);

    const input = parsed.data satisfies PerfumeUpdateInput;
    const payload: Database['public']['Tables']['user_perfumes']['Update'] = {
      ...input,
    };

    const { data, error } = await supabase
      .from('user_perfumes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return serverError(error.message);
    return ok(data);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return unauthorized();

  const { id } = await ctx.params;

  try {
    const { supabase, user } = auth;
    await ensureProfileRow(supabase, user.id);

    const { error } = await supabase.from('user_perfumes').delete().eq('id', id);
    if (error) return serverError(error.message);
    return ok({ id });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : 'Server error');
  }
}

