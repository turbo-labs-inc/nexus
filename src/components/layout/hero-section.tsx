import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function HeroSection({ title, description, children, className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "border-b bg-gradient-to-b from-background to-muted/20 py-12 md:py-16 lg:py-20",
        className
      )}
    >
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description && <p className="mt-4 text-muted-foreground md:text-xl">{description}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
