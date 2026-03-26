export default function PrivacyPolicy() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "60px 28px 80px", fontFamily: "system-ui,-apple-system,sans-serif", color: "#1c1e21", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>Privacy Policy</h1>
      <p style={{ color: "#65676b", marginTop: 0, marginBottom: 36 }}>Last updated: March 2026</p>

      <p>Buena Onda AI, LLC (&ldquo;Buena Onda,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the Buena Onda platform available at buenaonda.ai (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, and protect your information when you use our Service.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>1. Information We Collect</h2>
      <p><strong>Account information.</strong> When you sign up, we collect your email address, name, and any other details you provide during registration.</p>
      <p><strong>Ad account data.</strong> With your explicit authorization, we access your ad account data from Meta Ads, Google Ads, and TikTok Ads (spend, leads, ROAS, campaign details, keywords, ad groups) via their respective APIs. We access only the permissions you grant and only to provide the Service.</p>
      <p><strong>E-commerce data.</strong> If you connect your Shopify store, we access order and revenue data to correlate ad performance with sales outcomes. We access only the data necessary to provide the Service.</p>
      <p><strong>Workspace notifications.</strong> If you connect Slack, we send campaign alerts, performance reports, and notifications to your designated Slack channels. We do not read or store your Slack messages.</p>
      <p><strong>Usage data.</strong> We collect information about how you interact with the Service, including pages visited, features used, and actions taken (e.g., campaigns reviewed, reports generated).</p>
      <p><strong>Payment information.</strong> Payments are processed by Stripe. We do not store your credit card number — Stripe handles all payment data in accordance with PCI-DSS standards.</p>
      <p><strong>Communications.</strong> If you contact us for support or submit feedback, we retain those communications to improve the Service.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>2. How We Use Your Information</h2>
      <ul>
        <li>To provide, operate, and improve the Service</li>
        <li>To generate AI-powered recommendations, alerts, and reports based on your ad account data</li>
        <li>To send transactional emails (reports, alerts, account notifications)</li>
        <li>To process payments and manage subscriptions</li>
        <li>To respond to support requests</li>
        <li>To comply with legal obligations</li>
      </ul>
      <p>We do not sell your personal information or your ad account data to third parties.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>3. Meta API Data</h2>
      <p>Buena Onda accesses Meta Ads data solely to provide the Service features you request. We do not use Meta user data to train AI models, share it with advertisers, or use it for any purpose unrelated to the Service. Data accessed through the Meta Marketing API is used only to display your own ad performance, generate your own reports, and power AI recommendations for your own accounts.</p>
      <p>You may revoke Buena Onda&apos;s access to your Meta account at any time from your Meta Business Settings.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>4. Google Ads API Data</h2>
      <p>Buena Onda accesses Google Ads data solely to provide the Service features you request, including campaign creation, budget management, performance reporting, and automated optimization. We do not use Google Ads data to train AI models, share it with third-party advertisers, or use it for any purpose unrelated to the Service.</p>
      <p>Data accessed through the Google Ads API — including campaign metrics, keyword performance, ad group data, conversion tracking, and cost data — is used only to display your own ad performance, generate your own reports, and power AI-driven optimization for your own accounts.</p>
      <p>Buena Onda&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" style={{ color: "#f5a623" }}>Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
      <p>You may revoke Buena Onda&apos;s access to your Google Ads account at any time from your <a href="https://myaccount.google.com/permissions" style={{ color: "#f5a623" }}>Google Account permissions</a> page.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>5. TikTok Ads API Data</h2>
      <p>Buena Onda accesses TikTok Ads data solely to provide the Service features you request, including campaign monitoring, performance reporting, and optimization recommendations. We do not use TikTok Ads data to train AI models, share it with third-party advertisers, or use it for any purpose unrelated to the Service.</p>
      <p>Data accessed through the TikTok Marketing API — including campaign metrics, ad group performance, and cost data — is used only to display your own ad performance, generate your own reports, and power AI-driven recommendations for your own accounts.</p>
      <p>You may revoke Buena Onda&apos;s access to your TikTok Ads account at any time from your TikTok Business Center settings.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>6. Shopify Data</h2>
      <p>If you connect your Shopify store, Buena Onda accesses order and revenue data solely to correlate your ad spend with sales performance. We do not access customer personal information, modify your store, or use your Shopify data for any purpose unrelated to the Service.</p>
      <p>You may disconnect your Shopify store at any time from your account settings. Upon disconnection, we will stop syncing new data. Previously synced data will be deleted when you cancel your account or upon request.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>7. Slack Integration</h2>
      <p>If you connect Slack, Buena Onda sends campaign alerts, performance summaries, and notifications to your designated Slack channels. We do not read, store, or process your Slack messages or any data beyond what is necessary to deliver notifications.</p>
      <p>You may revoke Buena Onda&apos;s access at any time from your Slack workspace settings under &ldquo;Manage Apps.&rdquo;</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>8. WhatsApp Integration</h2>
      <p>Buena Onda uses the Meta WhatsApp Business API to provide an AI-powered conversational assistant. If you interact with Buena Onda via WhatsApp, we process your incoming messages to generate responses about your campaign performance, agent actions, and ad strategy. Messages are processed in real time by our AI and are not stored long-term beyond what is necessary to deliver the response.</p>
      <p>You may also submit knowledge base rules and benchmarks via WhatsApp, which are stored in our database and applied to your future campaign optimization. These can be reviewed and removed from your dashboard at any time.</p>
      <p>Your WhatsApp phone number is stored in association with your account to route messages correctly. We do not share your phone number or message content with third parties. WhatsApp message delivery is governed by Meta&apos;s WhatsApp Business Terms of Service.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>9. Data Retention</h2>
      <p>We retain your account and ad data for as long as your account is active. If you cancel your account, we will delete your data within 30 days, except where retention is required by law.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>10. Data Security</h2>
      <p>We use industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security reviews. All third-party access tokens (Meta, Google, TikTok, Shopify, Slack) are encrypted before storage and rotated automatically.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>11. Third-Party Services</h2>
      <p>We use the following third-party services to operate the platform:</p>
      <ul>
        <li><strong>Clerk</strong> — authentication and user management</li>
        <li><strong>Stripe</strong> — payment processing</li>
        <li><strong>Neon</strong> — database hosting</li>
        <li><strong>Vercel</strong> — hosting and infrastructure</li>
        <li><strong>Anthropic</strong> — AI language model processing</li>
        <li><strong>Meta</strong> — Ads API integration</li>
        <li><strong>Google</strong> — Google Ads API integration</li>
        <li><strong>TikTok</strong> — TikTok Ads API integration</li>
        <li><strong>Shopify</strong> — e-commerce data integration</li>
        <li><strong>Slack</strong> — workspace notifications</li>
      </ul>
      <p>Each provider processes data in accordance with their own privacy policies.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>12. Your Rights</h2>
      <p>You may request access to, correction of, or deletion of your personal information at any time by emailing us at <a href="mailto:hello@buenaonda.ai" style={{ color: "#f5a623" }}>hello@buenaonda.ai</a>. We will respond within 30 days.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>13. Cookies</h2>
      <p>We use cookies and similar technologies to maintain sessions, remember preferences, and attribute referrals. You can disable cookies in your browser settings, though some features of the Service may not function correctly without them.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>14. Children</h2>
      <p>The Service is not directed to children under 13. We do not knowingly collect personal information from children.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>15. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on the Service. Continued use of the Service after changes become effective constitutes acceptance of the updated policy.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36 }}>16. Contact</h2>
      <p>Questions about this policy? Email us at <a href="mailto:hello@buenaonda.ai" style={{ color: "#f5a623" }}>hello@buenaonda.ai</a>.</p>
    </main>
  );
}
