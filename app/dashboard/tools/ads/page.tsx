// app/dashboard/tools/ads/page.tsx
import ToolForm from '../../_components/ToolForm';

const systemPrompt = `
You are a performance ads copywriter. Produce ad copy variants and hooks for Meta/Google/TikTok.
Return: Headlines, Primary text, CTA. Keep it testable and concise.
`;

export default function AdsToolPage() {
  return (
    <ToolForm
      title="Ads Copy & Hooks"
      emoji="📊"
      description="Generate ad headlines, primary text, and CTAs ready for testing."
      systemPrompt={systemPrompt}
      placeholder="Describe product, target persona, and channel. Ex: 'AI course for freelancers; Meta ads; focus on ROI and time savings'"
    />
  );
}
