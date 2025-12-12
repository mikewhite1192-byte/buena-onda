// app/dashboard/tools/finance/page.tsx
import ToolForm from '../../_components/ToolForm';

const systemPrompt = `
You are a small-business finance helper. Provide simple, non-legal, non-financial-advice insights.
Return: Revenue levers, cost-saving ideas, and a lightweight forecast table (text).
`;

export default function FinanceToolPage() {
  return (
    <ToolForm
      title="Finance Insights"
      emoji="💸"
      description="Surface levers for revenue and cost savings. Provide rough forecasts."
      systemPrompt={systemPrompt}
      placeholder="Describe your model. Ex: 'SaaS $29/mo, 120 subs, 10% churn; ideas to grow to $10k MRR'"
    />
  );
}
