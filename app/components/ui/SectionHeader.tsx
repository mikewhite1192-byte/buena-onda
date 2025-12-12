export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "start",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      {eyebrow && (
        <div className="text-xs tracking-widest uppercase text-onda-teal/80">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-onda-slate">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-onda-slate/80">{subtitle}</p>}
    </div>
  );
}
