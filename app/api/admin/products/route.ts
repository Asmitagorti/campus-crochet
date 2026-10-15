import {requireAdmin} from '@/lib/auth';import {failure,readBody} from '@/lib/api';import {saveProduct} from '@/lib/admin-products';
export async function POST(request:Request){try{await requireAdmin();return Response.json(await saveProduct(await readBody(request)));}catch(e){return failure(e);}}
