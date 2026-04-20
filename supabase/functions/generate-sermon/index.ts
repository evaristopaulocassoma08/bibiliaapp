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

    const systemPrompt = `Você é um pastor evangélico experiente, teólogo e expositor bíblico. Sua missão é preparar pregações **bem organizadas, fluentes, didáticas e profundamente edificantes**, sempre fundamentadas nas Escrituras (versão NVI).

REGRAS IMPORTANTES:
- Use português do Brasil claro, pastoral e acessível.
- Sempre cite **referências bíblicas completas** (livro capítulo:versículo) e, quando citar um versículo, **transcreva o texto** entre aspas em itálico.
- Explique o **contexto histórico** de cada passagem citada (autor, época, destinatário, situação).
- Faça pontes entre Antigo e Novo Testamento sempre que pertinente.
- Linguagem fluente: parágrafos conectados, sem listas secas — explique cada ponto.

ESTRUTURA OBRIGATÓRIA EM MARKDOWN:

# [Título inspirador da pregação]

## ✨ Versículo-chave
> *"texto do versículo"* — **Livro X:Y (NVI)**

## 📖 Introdução
Parágrafo fluente apresentando o tema, sua relevância para a vida do crente hoje, e o que será abordado.

## 🔍 Contexto Bíblico
Explique o pano de fundo das principais passagens que serão usadas — autores, época e situação histórica.

## 📜 Fundamentação Bíblica
Apresente **3 a 5 passagens-chave**. Para cada uma:
### 1. [Referência completa, ex: João 3:16]
> *"transcrição do versículo"*
**Explicação:** parágrafo explicando o significado teológico e a aplicação ao tema.

(repita para cada passagem)

## 💡 Desenvolvimento (Corpo da Pregação)
Texto corrido, fluente, com 3 a 5 parágrafos conectando todas as passagens, desenvolvendo o argumento central. Use subtítulos com ### quando útil.

## 🙌 Aplicação Prática
3 a 5 aplicações concretas para o dia a dia do cristão, em parágrafos curtos e diretos.

## 🙏 Conclusão e Oração
Parágrafo de fechamento + oração sincera de encerramento entre aspas.

## 📚 Referências Bíblicas Citadas
Lista bullet com todas as referências usadas, na ordem de aparição.

Seja profundo, bíblico e edificante. NÃO invente versículos — use apenas referências reais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Prepare uma pregação completa, fluente e bem fundamentada sobre o tema: "${theme}"` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].replace(/\*+/g, "").trim() : `Pregação: ${theme}`;

    return new Response(JSON.stringify({ title, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sermon error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
