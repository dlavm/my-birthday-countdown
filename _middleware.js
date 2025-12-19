export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // 1. 设置密码 (在 Cloudflare 后台的环境变量中设置 ACCESS_PWD)
  const PASSWORD = env.ACCESS_PWD || "123456"; 
  const COOKIE_NAME = "auth_token";

  // 2. 辅助函数：获取 Cookie
  const getCookie = (name) => {
    const value = `; ${request.headers.get("Cookie")}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  // 3. 处理登录请求 (POST /login)
  if (url.pathname === "/login" && request.method === "POST") {
    const formData = await request.formData();
    const inputPwd = formData.get("password");
    
    if (inputPwd === PASSWORD) {
      // 密码正确，设置 Cookie 并重定向回首页
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `${COOKIE_NAME}=valid; Path=/; Max-Age=2592000; HttpOnly; SameSite=Strict` // 30天有效期
        }
      });
    }
    return new Response("密码错误", { status: 403 });
  }

  // 4. 检查是否已认证
  const cookie = getCookie(COOKIE_NAME);
  if (cookie === "valid") {
    return next(); // 这里的 next() 会继续执行后续的页面渲染或 API 调用
  }

  // 5. 未认证，返回登录页面 HTML
  const loginHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>访问受限</title>
      <style>
        body{display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f2f5;font-family:sans-serif;}
        form{background:#fff;padding:2rem;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
        input{padding:10px;border:1px solid #ddd;border-radius:4px;margin-right:10px;}
        button{padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;}
      </style>
    </head>
    <body>
      <form action="/login" method="POST">
        <h3>请输入访问密码</h3>
        <input type="password" name="password" placeholder="密码" required>
        <button type="submit">进入</button>
      </form>
    </body>
    </html>
  `;

  return new Response(loginHtml, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}
