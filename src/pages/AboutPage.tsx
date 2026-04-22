import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  MessageCircle,
  Building2,
  Code2,
  Heart,
  Flame,
  Github,
  Globe,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AboutPage = () => {
  const phone = "921193115";
  const whatsappLink = `https://wa.me/244${phone}`;
  const email = "evaristopaulocassoma00@gmail.com";

  return (
    <Layout>
      <div className="container max-w-2xl py-8 space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-primary/30">
            <Flame className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Bíblia<span className="text-primary">App</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sua Bíblia digital completa com IA
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Versão 1.0.0 · NVI completa
            </p>
          </div>
        </div>

        {/* Desenvolvedor */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 text-primary">
            <Code2 className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Desenvolvedor</h2>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-gold-gradient">
              <AvatarFallback className="bg-gold-gradient text-primary-foreground font-bold text-xl">
                EP
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-foreground text-lg">
                Evaristo Paulo Cassoma
              </h3>
              <p className="text-sm text-muted-foreground">
                Desenvolvedor Full-Stack
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {email}
                </p>
              </div>
            </a>

            <a
              href={`tel:+244${phone}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Contacto</p>
                <p className="text-sm font-medium text-foreground">
                  +244 {phone}
                </p>
              </div>
            </a>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="text-sm font-medium text-foreground">
                  +244 {phone}
                </p>
              </div>
            </a>
          </div>
        </Card>

        {/* Empresa */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Criado por</h2>
          </div>
          <div className="text-center py-2">
            <p className="font-display text-xl font-bold text-foreground">
              Corporação Papel
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Soluções digitais com propósito
            </p>
          </div>
        </Card>

        {/* Sobre o app */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Sobre o BíbliaApp</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            BíbliaApp é uma plataforma digital completa para leitura, estudo e
            compartilhamento da Palavra de Deus. Com Bíblia NVI completa,
            disponível offline, IA para gerar pregações, favoritos, notas,
            grupos de estudo e muito mais.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              "Bíblia NVI Completa",
              "Modo Offline",
              "Pregações com IA",
              "Favoritos e Notas",
              "Grupos de Estudo",
              "PWA Instalável",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-xs text-foreground"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {feature}
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            Feito com <Heart className="h-3 w-3 text-primary fill-primary" /> em
            Angola
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Corporação Papel · Todos os direitos
            reservados
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
