// app/dashboard/tools/custom/page.tsx
import ToolForm from '../../_components/ToolForm';

export default function CustomToolPage() {
  return (
    <ToolForm
      title="Custom Flow"
      emoji="🧩"
      description="Run bespoke prompts for special use cases."
      placeholder="Paste or write your custom prompt here…"
      // No systemPrompt means pure user control
    />
  );
}
