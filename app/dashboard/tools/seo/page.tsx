// app/dashboard/tools/seo/page.tsx
import ToolForm from '../../_components/ToolForm';

const systemPrompt = `
You are an SEO strategist. Generate keywords, content briefs, and on-page outline suggestions.
Return: Target keyword, related terms, outline H2/H3, and meta title/description.
`;

export default function SeoToolPage() {
  return (
    <ToolForm
      title="SEO Planner"
      emoji="🔎"
      description="Get keyword ideas, briefs, and outlines for SEO content."
      systemPrompt={systemPrompt}
      placeholder="Describe your topic and intent. Ex: 'Email list building for coaches; TOFU blog ideas + outline'"
    />
  );
}
