// app/privacy-policy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0f", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8f4f4", padding: "60px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: "#2A8C8A", fontSize: 13, textDecoration: "none" }}>← buenaonda.ai</a>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#2A8C8A", marginBottom: 8, letterSpacing: "-0.5px" }}>Privacy Policy</h1>
        <p style={{ color: "#4a7a7a", fontSize: 13, marginBottom: 48 }}>Last updated: March 19, 2026</p>

        {[
          {
            title: "1. Introduction",
            content: `Buena Onda ("we," "us," or "our") operates buenaonda.ai, an AI-powered Meta ad management platform. This Privacy Policy explains how we collect, use, and protect your information when you use our service.

By using Buena Onda, you agree to the collection and use of information in accordance with this policy.`
          },
          {
            title: "2. Information We Collect",
            content: `We collect the following categories of information:

Account Information: When you sign up, we collect your name, email address, and authentication credentials via Clerk.

Meta Ad Account Data: With your authorization, we access your Meta ad account data including campaign performance metrics, ad set information, spend data, and audience data. This access is read and write — meaning we can view your data and take actions on your behalf such as pausing or scaling ad sets.

WhatsApp Communication: If you connect WhatsApp, we process messages sent between you and the Buena Onda agent to facilitate campaign management and reporting.

Payment Information: Billing is processed through third-party payment processors. We do not store your full payment card details.

Usage Data: We collect information about how you interact with our platform including pages visited, features used, and actions taken.`
          },
          {
            title: "3. How We Use Your Information",
            content: `We use the information we collect to:

- Operate and improve the Buena Onda platform
- Execute automated ad management actions on your behalf
- Send you reports, alerts, and recommendations via WhatsApp or email
- Process billing and manage your subscription
- Detect and prevent fraud or abuse
- Train and improve our AI models to better serve users in your vertical (leads or ecommerce)
- Comply with legal obligations`
          },
          {
            title: "4. Meta Platform Data",
            content: `Buena Onda accesses your Meta ad account data through the Meta Marketing API. We use this data solely to provide the services you've requested — analyzing campaign performance, executing approved actions, and generating recommendations.

We do not sell your Meta ad data to third parties. We do not use your ad data for any purpose other than operating the Buena Onda service for your account.

Our use of Meta platform data complies with Meta's Platform Terms and Developer Policies.`
          },
          {
            title: "5. Data Sharing",
            content: `We do not sell your personal information. We may share your information with:

Service Providers: Third-party vendors who help us operate our platform, including Anthropic (AI processing), Neon (database), Vercel (hosting), Clerk (authentication), and Meta (ad platform integration).

Legal Requirements: If required by law, regulation, or legal process, we may disclose your information to comply with applicable obligations.

Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.`
          },
          {
            title: "6. Data Retention",
            content: `We retain your data for as long as your account is active or as needed to provide services. Ad performance metrics are retained to power the learning engine and improve recommendations over time. You may request deletion of your account and associated data by contacting us at hello@buenaonda.ai.`
          },
          {
            title: "7. Security",
            content: `We implement industry-standard security measures to protect your information, including encrypted connections (TLS), secure credential storage, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`
          },
          {
            title: "8. Your Rights",
            content: `Depending on your location, you may have rights regarding your personal data including the right to access, correct, or delete your information. To exercise these rights, contact us at hello@buenaonda.ai.`
          },
          {
            title: "9. Cookies",
            content: `We use cookies and similar tracking technologies to maintain your session and improve your experience. You can control cookie settings through your browser, though disabling cookies may affect platform functionality.`
          },
          {
            title: "10. Children's Privacy",
            content: `Buena Onda is not intended for users under the age of 18. We do not knowingly collect personal information from minors.`
          },
          {
            title: "11. Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Continued use of Buena Onda after changes constitutes your acceptance of the updated policy.`
          },
          {
            title: "12. Contact Us",
            content: `If you have questions about this Privacy Policy, please contact us at:

hello@buenaonda.ai
buenaonda.ai`
          },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2A8C8A", marginBottom: 12 }}>{title}</h2>
            <div style={{ fontSize: 13, color: "#8ab8b8", lineHeight: 1.8, whiteSpace: "pre-line" }}>{content}</div>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #1a2f2f", paddingTop: 32, marginTop: 48, fontSize: 12, color: "#2a4a4a" }}>
          © 2026 Buena Onda. All rights reserved.
        </div>
      </div>
    </div>
  );
}
