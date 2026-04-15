export default async function handler(req, res) {
  const { stock } = req.body;

  // ====================== 填你的密钥 ======================
  const GROK_KEY = "xai-PMJalePqdQBKAln4bZGTEuvMvGlAxPC5RZQQhWprE6FyDwMFIR1vD6gH01INfh59aces1VV9OFTnAxBR";
  const DEEPSEEK_KEY = "sk-3117bc5926fe476c8453d0f8a76a6360";
  // ======================================================

  const prompt = `
对 ${stock} 做专业投资分析，包括行业逻辑、基本面、估值、看法与风险，简洁客观。
  `.trim();

  // 同时调用两个AI
  const [grok, deepseek] = await Promise.all([
    callGrok(prompt, GROK_KEY),
    callDeepSeek(prompt, DEEPSEEK_KEY)
  ]);

  // 生成总结对比
  const summary = await makeSummary(stock, grok, deepseek, GROK_KEY);

  res.json({ stock, grok, deepseek, summary });
}

// Grok
async function callGrok(prompt, key) {
  try {
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "调用失败";
  } catch (e) {
    return "Grok 出错";
  }
}

// DeepSeek
async function callDeepSeek(prompt, key) {
  try {
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "调用失败";
  } catch (e) {
    return "DeepSeek 出错";
  }
}

// 总结两个AI
async function makeSummary(stock, a, b, key) {
  try {
    const p = `
股票：${stock}
Grok：${a}
DeepSeek：${b}
请总结共识、分歧、综合客观结论，简洁专业。
    `.trim();

    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: p }]
      })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "无法总结";
  } catch (e) {
    return "总结失败";
  }
}