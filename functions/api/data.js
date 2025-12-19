export async function onRequestGet(context) {
  // 从 KV 读取数据，KEY 为 "birthday_list"
  const data = await context.env.BIRTHDAY_KV.get("birthday_list");
  return new Response(data || "[]", {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  // 保存数据到 KV
  try {
    const data = await context.request.json();
    // 简单的校验
    if (!Array.isArray(data)) throw new Error("Invalid data");
    
    await context.env.BIRTHDAY_KV.put("birthday_list", JSON.stringify(data));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}
