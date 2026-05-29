import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface Motivational {
  id: string; title: string; message: string;
  book_name: string; chapter: number; verse_reference: string | null;
}

export const MotivationalHighlight = () => {
  const [items, setItems] = useState<Motivational[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("motivational_chapters")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(3);
      setItems((data as Motivational[]) || []);
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Capítulos em Destaque
      </h2>
      <div className="grid gap-3">
        {items.map(it => (
          <Link key={it.id} to="/biblia" className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors block">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{it.title}</h3>
                <p className="text-xs text-primary mt-0.5">{it.book_name} {it.chapter}{it.verse_reference ? `:${it.verse_reference}` : ""}</p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{it.message}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
