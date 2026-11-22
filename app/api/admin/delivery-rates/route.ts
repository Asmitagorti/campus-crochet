// Retained for older dashboard bundles; individual postage rates are no longer used.
export async function POST() {
  return Response.json({ error: "Delivery rates are no longer editable. Home delivery uses the flat shop policy." }, { status: 410 });
}
