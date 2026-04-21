import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { theme } = await req.json();
    if (!theme || typeof theme !== "string" || theme.length > 200) {
      return new Response(JSON.stringify({ error: "Tema inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um pastor evangélico experiente e expositor bíblico. Prepare pregações **organizadas, fluentes, didáticas e edificantes** baseadas na Bíblia (NVI).

REGRAS:
- Português do Brasil claro e pastoral.
- Cite **referências bíblicas completas** (Livro Capítulo:Versículo) e transcreva o versículo entre aspas em itálico.
- Explique o **contexto histórico** (autor, época, situação).
- Linguagem fluente, parágrafos conectados, sem listas secas.

ESTRUTURA OBRIGATÓRIA EM MARKDOWN:

# [Título inspirador]

## ✨ Versículo-chave
> *"texto"* — **Livro X:Y (NVI)**

## 📖 Introdução
Parágrafo apresentando o tema e sua relevância hoje.

## 🔍 Contexto Bíblico
Pano de fundo das passagens — autores, época, situação.

## 📜 Fundamentação Bíblica
Apresente **3 a 4 passagens-chave**. Para cada uma:
### [Referência ex: João 3:16]
> *"versículo transcrito"*
**Explicação:** parágrafo explicando significado e aplicação.

## 💡 Desenvolvimento
Texto corrido fluente, 3 a 4 parágrafos conectando as passagens.

## 🙌 Aplicação Prática
3 a 4 aplicações concretas em parágrafos curtos.

## 🙏 Conclusão e Oração
Fechamento + oração sincera entre aspas.

## 📚 Referências Citadas
Lista bullet com todas as referências.

Seja profundo e bíblico. NÃO invente versículos.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Prepare uma pregação completa e fluente sobre: "${theme}"` },
        ],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      throw new Error("AI gateway error");
    }

    // Stream the response back to the client (SSE passthrough)
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("generate-sermon error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
