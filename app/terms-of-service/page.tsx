import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

export const metadata = {
  title: "Terms of Service — Buena Onda",
  description:
    "Read Buena Onda's terms of service for the AI-powered ad management platform.",
};

export default function TermsOfService() {
  return (
    <div style={{ background: "#0d0f14", minHeight: "100vh", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8eaf0" }}>
      <LandingNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, color: "#e8eaf0" }}>Terms of Service</h1>
        <p style={{ color: "#8b8fa8", marginTop: 0, marginBottom: 36 }}>Last updated: March 2026</p>

        <p style={{ color: "#8b8fa8" }}>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Buena Onda platform operated by Buena Onda (&ldquo;Buena Onda,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;). By accessing or using the Service, you agree to these Terms.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>1. The Service</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda is an AI-powered ad management platform for marketing agencies. It integrates with Meta Ads, Google Ads, and TikTok Ads — along with Shopify and Slack — to provide campaign monitoring, anomaly detection, AI recommendations, ad building tools, and automated client reporting. Features are described on our website and may change over time.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>2. Eligibility and Accounts</h2>
        <p style={{ color: "#8b8fa8" }}>You must be at least 18 years old and authorized to manage the ad accounts you connect. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>3. Subscriptions and Billing</h2>
        <p style={{ color: "#8b8fa8" }}>Access to the Service requires a paid subscription. Plans and pricing are listed on our website. Subscriptions are billed monthly in advance. All fees are non-refundable except as required by law or as expressly stated in these Terms.</p>
        <p style={{ color: "#8b8fa8" }}>We reserve the right to change pricing with 30 days notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.</p>
        <p style={{ color: "#8b8fa8" }}>If your payment fails, we will attempt to retry for up to 7 days before suspending your account. You can update your payment method at any time from your account settings.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>4. Acceptable Use</h2>
        <p style={{ color: "#8b8fa8" }}>You agree not to:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>Use the Service to violate Meta&apos;s, Google&apos;s, or TikTok&apos;s advertising policies, Shopify&apos;s terms, or any applicable law</li>
          <li style={{ color: "#8b8fa8" }}>Attempt to reverse engineer, decompile, or extract source code from the Service</li>
          <li style={{ color: "#8b8fa8" }}>Use automated scripts to access the Service in a way that damages or overloads it</li>
          <li style={{ color: "#8b8fa8" }}>Share your account credentials with others or resell access to the Service</li>
          <li style={{ color: "#8b8fa8" }}>Use the Service to manage ad accounts you are not authorized to access</li>
          <li style={{ color: "#8b8fa8" }}>Upload or transmit malicious code or content</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>5. Meta Platform Compliance</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting your Meta ad accounts, you confirm that you are authorized to access and manage those accounts and that your use complies with Meta&apos;s Platform Terms and Advertising Policies. You are solely responsible for the ad campaigns you create, manage, or modify through the Service.</p>
        <p style={{ color: "#8b8fa8" }}>AI-generated recommendations are suggestions only. You retain full responsibility for all campaign decisions made using the Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>6. Google Ads API Compliance</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting your Google Ads accounts, you confirm that you are authorized to access and manage those accounts and that your use complies with the <a href="https://developers.google.com/google-ads/api/docs/terms" style={{ color: "#f5a623" }}>Google Ads API Terms and Conditions</a> and <a href="https://support.google.com/adspolicy/answer/6008942" style={{ color: "#f5a623" }}>Google Ads Policies</a>.</p>
        <p style={{ color: "#8b8fa8" }}>Buena Onda&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" style={{ color: "#f5a623" }}>Google API Services User Data Policy</a>, including the Limited Use requirements. You are solely responsible for all campaign decisions made using the Service, including campaigns created, modified, or optimized through AI-powered automation.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access to your Google Ads account at any time from your <a href="https://myaccount.google.com/permissions" style={{ color: "#f5a623" }}>Google Account permissions</a> page.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>7. TikTok Ads Compliance</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting your TikTok Ads accounts, you confirm that you are authorized to access and manage those accounts and that your use complies with TikTok&apos;s Business Terms and Advertising Policies. You are solely responsible for all campaign decisions made using the Service.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access at any time from your TikTok Business Center settings.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>8. Shopify Integration</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting your Shopify store, you confirm that you are authorized to access that store&apos;s data and that your use complies with Shopify&apos;s API Terms of Service. Buena Onda accesses order and revenue data solely to correlate ad performance with sales outcomes. We do not modify your store, access customer personal information, or use your Shopify data for any purpose unrelated to the Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>9. Slack Integration</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting Slack, you authorize Buena Onda to send campaign alerts and performance notifications to your designated Slack channels. We do not read, store, or process your Slack messages. You may revoke access at any time from your Slack workspace settings.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>10. WhatsApp Integration</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda provides an AI-powered conversational assistant via the Meta WhatsApp Business API. By interacting with Buena Onda on WhatsApp, you acknowledge that your messages are processed by our AI to generate responses about your campaign performance and ad strategy. AI-generated responses are informational and do not constitute professional advice.</p>
        <p style={{ color: "#8b8fa8" }}>Knowledge base rules submitted via WhatsApp are stored and applied to your campaign optimization. You are responsible for ensuring any rules or instructions you submit comply with applicable advertising policies. Use of the WhatsApp integration is subject to Meta&apos;s WhatsApp Business Terms of Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>11. Intellectual Property</h2>
        <p style={{ color: "#8b8fa8" }}>The Service, including its software, design, and content, is owned by Buena Onda and protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to use the Service for your internal business purposes during your subscription term.</p>
        <p style={{ color: "#8b8fa8" }}>You retain ownership of your data, including your ad account data and any content you upload.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>12. Disclaimer of Warranties</h2>
        <p style={{ color: "#8b8fa8" }}>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that AI recommendations will improve your campaign performance. Ad performance depends on many factors outside our control.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>13. Limitation of Liability</h2>
        <p style={{ color: "#8b8fa8" }}>To the maximum extent permitted by law, Buena Onda shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits or ad spend losses, arising from your use of the Service. Our total liability for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>14. Termination</h2>
        <p style={{ color: "#8b8fa8" }}>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period. We may suspend or terminate your account for violation of these Terms, with or without notice.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>15. Affiliate Program</h2>
        <p style={{ color: "#8b8fa8" }}>Participation in the Buena Onda affiliate program is subject to additional terms presented during signup. Commission rates and payout terms may change with 30 days notice to active affiliates.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>16. Governing Law</h2>
        <p style={{ color: "#8b8fa8" }}>These Terms are governed by the laws of the State of Michigan, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Michigan.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>17. Changes to These Terms</h2>
        <p style={{ color: "#8b8fa8" }}>We may update these Terms from time to time. We will notify you of material changes by email at least 14 days before they take effect. Continued use of the Service after changes take effect constitutes acceptance.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>18. Contact</h2>
        <p style={{ color: "#8b8fa8" }}>Questions about these Terms? Email us at <a href="mailto:hello@buenaonda.ai" style={{ color: "#f5a623" }}>hello@buenaonda.ai</a>.</p>
      </main>
      <LandingFooter />
    </div>
  );
}
