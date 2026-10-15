import {requireAdmin} from '@/lib/auth';import {allRows,failure} from '@/lib/api';import {getServiceRoleClient} from '@/lib/server-db';
export async function GET(){try{await requireAdmin();return Response.json(await allRows((s,e)=>getServiceRoleClient().from('support_tickets').select('*').order('created_at',{ascending:false}).order('id').range(s,e)));}catch(e){return failure(e);}}
