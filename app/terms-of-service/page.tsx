// app/terms-of-service/page.tsx
export default function TermsOfService() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0f", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8f4f4", padding: "60px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: "#2A8C8A", fontSize: 13, textDecoration: "none" }}>← buenaonda.ai</a>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#2A8C8A", marginBottom: 8, letterSpacing: "-0.5px" }}>Terms of Service</h1>
        <p style={{ color: "#4a7a7a", fontSize: 13, marginBottom: 48 }}>Last updated: March 19, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            content: `By accessing or using Buena Onda ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.`
          },
          {
            title: "2. Description of Service",
            content: `Buena Onda is an AI-powered Meta ad management platform that analyzes your advertising campaigns, takes automated actions on your behalf, and provides recommendations to improve performance. The Service connects to your Meta ad account via the Meta Marketing API with your authorization.`
          },
          {
            title: "3. Account Registration",
            content: `You must create an account to use Buena Onda. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information when creating your account.`
          },
          {
            title: "4. Meta Ad Account Access",
            content: `By connecting your Meta ad account to Buena Onda, you authorize us to:

- Read your campaign, ad set, and ad performance data
- Pause, scale, and modify ad set budgets on your behalf
- Create campaign briefs and recommendations
- Access audience and creative data associated with your account

You can revoke this access at any time through your Meta Business Settings. You remain solely responsible for all advertising spend, content, and compliance with Meta's advertising policies.`
          },
          {
            title: "5. Automated Actions",
            content: `Buena Onda may take automated actions on your Meta ad account including pausing underperforming ad sets, increasing budgets on high-performing ad sets, and flagging campaigns for your review.

You acknowledge that:

- Automated actions are based on rules and AI analysis, not human judgment
- We are not responsible for advertising performance outcomes
- You should review and monitor all automated actions through the platform dashboard
- You can disable automated execution and switch to manual approval mode at any time`
          },
          {
            title: "6. Acceptable Use",
            content: `You agree not to:

- Use the Service for any unlawful purpose or in violation of Meta's advertising policies
- Attempt to reverse engineer, hack, or disrupt the Service
- Use the Service to run ads for prohibited categories including illegal products, misleading health claims, or discriminatory content
- Share your account credentials with unauthorized parties
- Use the Service to scrape or extract data for competitive purposes`
          },
          {
            title: "7. Beta Access",
            content: `During the beta period, access to Buena Onda is provided at no charge or at a reduced rate. Beta features may be unstable, incomplete, or subject to change without notice. We may terminate beta access at any time. Beta users agree to provide feedback to help improve the Service.`
          },
          {
            title: "8. Payment Terms",
            content: `Paid subscription plans are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days notice. Failure to pay may result in suspension or termination of your account.`
          },
          {
            title: "9. Intellectual Property",
            content: `Buena Onda and its original content, features, and functionality are owned by Buena Onda and are protected by applicable intellectual property laws. You retain ownership of your ad account data and creative assets. By using the Service, you grant us a limited license to process your data to provide the Service.`
          },
          {
            title: "10. Disclaimer of Warranties",
            content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AUTOMATED ACTIONS WILL ACHIEVE ANY PARTICULAR ADVERTISING OUTCOME.

ADVERTISING RESULTS DEPEND ON MANY FACTORS OUTSIDE OUR CONTROL INCLUDING META'S ALGORITHM, MARKET CONDITIONS, AND CREATIVE QUALITY. WE MAKE NO GUARANTEES REGARDING COST PER LEAD, RETURN ON AD SPEND, OR ANY OTHER PERFORMANCE METRIC.`
          },
          {
            title: "11. Limitation of Liability",
            content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, BUENA ONDA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO ADVERTISING SPEND LOSSES, LOST PROFITS, OR DATA LOSS.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE THREE MONTHS PRECEDING THE CLAIM.`
          },
          {
            title: "12. Indemnification",
            content: `You agree to indemnify and hold harmless Buena Onda from any claims, damages, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or violation of any third-party rights including Meta's platform policies.`
          },
          {
            title: "13. Termination",
            content: `Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease and we will revoke our access to your Meta ad account. You may export your data prior to termination by contacting hello@buenaonda.ai.`
          },
          {
            title: "14. Changes to Terms",
            content: `We reserve the right to modify these Terms at any time. We will notify you of material changes by email or through the platform. Continued use of the Service after changes constitutes acceptance of the new Terms.`
          },
          {
            title: "15. Governing Law",
            content: `These Terms shall be governed by the laws of the State of Michigan, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved through binding arbitration.`
          },
          {
            title: "16. Contact",
            content: `For questions about these Terms, contact us at:

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
