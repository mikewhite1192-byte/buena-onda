// app/dashboard/tools/marketing/page.tsx
import ToolForm from '../../_components/ToolForm';

const systemPrompt = `
You are a senior marketing strategist. Generate clear, actionable marketing ideas, angles, and offers.
Output concise bullet points with strong verbs and avoid fluff.
`;

export default function MarketingToolPage() {
  return (
    <ToolForm
      title="Marketing Strategy"
      emoji="📣"
      description="Get campaign ideas, angles, offers, and messaging frameworks."
      systemPrompt={systemPrompt}
      placeholder="Describe your product, audience, and goal. Ex: 'DTC skincare brand for men; launch email + IG campaign'"
    />
  );
}
