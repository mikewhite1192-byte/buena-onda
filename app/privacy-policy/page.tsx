import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

export const metadata = {
  title: "Privacy Policy — Buena Onda",
  description:
    "Read Buena Onda AI's privacy policy covering Meta Ads, Google Ads, Slack, WhatsApp, and Google Calendar data handling.",
};

export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#0d0f14", minHeight: "100vh", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8eaf0" }}>
      <LandingNav />
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 pt-24 sm:pt-[120px] pb-16 sm:pb-20" style={{ overflowWrap: "break-word" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, color: "#e8eaf0" }}>Privacy Policy</h1>
        <p style={{ color: "#8b8fa8", marginTop: 0, marginBottom: 36 }}>Last updated: April 2026</p>

        <p style={{ color: "#8b8fa8" }}>Buena Onda AI (&ldquo;Buena Onda,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a Michigan-based company located in Warren, MI (Macomb County). We operate the Buena Onda platform available at buenaonda.ai (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our Service. By using the Service, you agree to the practices described in this policy. This Privacy Policy is incorporated into and subject to our <a href="/terms-of-service" style={{ color: "#f5a623" }}>Terms of Service</a>.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>1. Information We Collect</h2>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Account information.</strong> When you sign up through Clerk (our authentication provider), we collect your email address, name, profile image, and any other details you provide during registration or subsequently add to your account.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Ad account data.</strong> With your explicit authorization, we access your ad account data from Meta Ads and Google Ads (including but not limited to ad spend, leads, ROAS, campaign details, keywords, ad groups, conversion data, and audience information) via their respective APIs. We access only the permissions you grant and only to provide the Service.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Workspace notifications.</strong> If you connect Slack, we send campaign alerts, performance reports, and notifications to your designated Slack channels. We do not read or store your Slack messages.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>WhatsApp data.</strong> If you interact with Buena Onda via WhatsApp, we process your incoming messages to generate AI-powered responses about your campaign performance and ad strategy. We store your WhatsApp phone number to route messages to your account. Knowledge base rules and benchmarks you submit via WhatsApp are stored and applied to your campaign optimization.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Google Calendar data.</strong> If you connect Google Calendar, we access your calendar data solely to schedule and manage meetings, reminders, and campaign-related events. We do not access calendar events unrelated to the Service beyond what is necessary for scheduling.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Usage data.</strong> We collect information about how you interact with the Service, including pages visited, features used, actions taken (e.g., campaigns reviewed, reports generated), browser type, device information, IP address, and referring URLs.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Payment information.</strong> Payments are processed by Stripe. We do not store your credit card number, bank account details, or other sensitive financial data. Stripe handles all payment data in accordance with PCI-DSS standards. We receive and store only your subscription plan, billing status, and transaction history from Stripe.</p>

        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Communications.</strong> If you contact us for support, submit feedback, or correspond with us via email or any other channel, we retain those communications and any information you provide in them to respond to you and improve the Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>2. How We Use Your Information</h2>
        <p style={{ color: "#8b8fa8" }}>We use the information we collect for the following purposes:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>To provide, operate, maintain, and improve the Service</li>
          <li style={{ color: "#8b8fa8" }}>To generate AI-powered campaign analysis, recommendations, alerts, automated optimizations, and reports based on your ad account data</li>
          <li style={{ color: "#8b8fa8" }}>To process your ad account data through our AI systems (powered by Claude, developed by Anthropic) for campaign optimization and strategic recommendations</li>
          <li style={{ color: "#8b8fa8" }}>To send transactional emails (reports, alerts, account notifications, billing receipts)</li>
          <li style={{ color: "#8b8fa8" }}>To process payments, manage subscriptions, and administer free trials</li>
          <li style={{ color: "#8b8fa8" }}>To respond to support requests and provide customer service</li>
          <li style={{ color: "#8b8fa8" }}>To detect, prevent, and address fraud, abuse, security issues, and technical problems</li>
          <li style={{ color: "#8b8fa8" }}>To comply with legal obligations and enforce our Terms of Service</li>
          <li style={{ color: "#8b8fa8" }}>To communicate with you about updates, new features, or changes to the Service</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>We do not sell your personal information or your ad account data to third parties. We do not use your data for advertising purposes unrelated to the Service.</strong></p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>3. AI Data Processing</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda uses artificial intelligence (specifically Claude, developed by Anthropic) to analyze your ad campaign data and generate recommendations, optimizations, reports, and conversational responses. Your ad account data, campaign metrics, and contextual information may be transmitted to Anthropic&apos;s API for processing. Anthropic does not use data submitted via their API to train their models.</p>
        <p style={{ color: "#8b8fa8" }}>AI-generated outputs are provided as recommendations and should not be treated as guaranteed results. You retain full control and responsibility over all campaign decisions. For more details, see our <a href="/terms-of-service" style={{ color: "#f5a623" }}>Terms of Service</a>.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>4. Meta API Data</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda accesses Meta Ads data solely to provide the Service features you request. We do not use Meta user data to train AI models, share it with advertisers, or use it for any purpose unrelated to the Service. Data accessed through the Meta Marketing API is used only to display your own ad performance, generate your own reports, and power AI recommendations for your own accounts.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access to your Meta account at any time from your Meta Business Settings.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>5. Google Ads API Data</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda accesses Google Ads data solely to provide the Service features you request, including campaign creation, budget management, performance reporting, and automated optimization. We do not use Google Ads data to train AI models, share it with third-party advertisers, or use it for any purpose unrelated to the Service.</p>
        <p style={{ color: "#8b8fa8" }}>Data accessed through the Google Ads API — including campaign metrics, keyword performance, ad group data, conversion tracking, and cost data — is used only to display your own ad performance, generate your own reports, and power AI-driven optimization for your own accounts.</p>
        <p style={{ color: "#8b8fa8" }}>Buena Onda&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" style={{ color: "#f5a623" }}>Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access to your Google Ads account at any time from your <a href="https://myaccount.google.com/permissions" style={{ color: "#f5a623" }}>Google Account permissions</a> page.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>6. Slack Integration</h2>
        <p style={{ color: "#8b8fa8" }}>If you connect Slack, Buena Onda sends campaign alerts, performance summaries, and notifications to your designated Slack channels. We do not read, store, or process your Slack messages or any data beyond what is necessary to deliver notifications.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access at any time from your Slack workspace settings under &ldquo;Manage Apps.&rdquo;</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>7. WhatsApp Integration</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda uses the Meta WhatsApp Business API to provide an AI-powered conversational assistant. If you interact with Buena Onda via WhatsApp, we process your incoming messages to generate responses about your campaign performance, agent actions, and ad strategy. Messages are processed in real time by our AI and are not stored long-term beyond what is necessary to deliver the response and maintain conversation context.</p>
        <p style={{ color: "#8b8fa8" }}>You may also submit knowledge base rules and benchmarks via WhatsApp, which are stored in our database and applied to your future campaign optimization. These can be reviewed and removed from your dashboard at any time.</p>
        <p style={{ color: "#8b8fa8" }}>Your WhatsApp phone number is stored in association with your account to route messages correctly. We do not share your phone number or message content with third parties. WhatsApp message delivery is governed by Meta&apos;s WhatsApp Business Terms of Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>8. Google Calendar Integration</h2>
        <p style={{ color: "#8b8fa8" }}>If you connect Google Calendar, Buena Onda accesses your calendar data solely to create, update, and manage events related to your ad campaigns and the Service (such as scheduled reports, review meetings, and optimization reminders). We do not access, modify, or delete calendar events unrelated to the Service.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access at any time from your <a href="https://myaccount.google.com/permissions" style={{ color: "#f5a623" }}>Google Account permissions</a> page.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>9. Data Sharing and Disclosure</h2>
        <p style={{ color: "#8b8fa8" }}>We do not sell, rent, or trade your personal information. We may share your information only in the following circumstances:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Service providers.</strong> We share data with third-party service providers who help us operate the Service (listed in Section 13), solely for the purposes of providing the Service to you.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Legal requirements.</strong> We may disclose your information if required by law, regulation, subpoena, court order, or other governmental request.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Protection of rights.</strong> We may disclose information to protect and defend the rights, property, or safety of Buena Onda, our users, or the public.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Business transfers.</strong> In connection with a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>With your consent.</strong> We may share your information for other purposes with your explicit consent.</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>10. Data Retention</h2>
        <p style={{ color: "#8b8fa8" }}>We retain your account and ad data for as long as your account is active or as needed to provide the Service to you. If you cancel your account, we will delete your personal data and ad account data within 30 days, except where retention is required by law or for legitimate business purposes (such as resolving disputes or enforcing our agreements).</p>
        <p style={{ color: "#8b8fa8" }}>Aggregated, anonymized data that cannot reasonably be used to identify you may be retained indefinitely for analytics and product improvement purposes.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>11. Data Security</h2>
        <p style={{ color: "#8b8fa8" }}>We use industry-standard security measures to protect your information, including:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>Encryption in transit (TLS/SSL) and at rest</li>
          <li style={{ color: "#8b8fa8" }}>Role-based access controls and least-privilege access principles</li>
          <li style={{ color: "#8b8fa8" }}>Encrypted storage of all third-party access tokens (Meta, Google, Slack)</li>
          <li style={{ color: "#8b8fa8" }}>Regular security reviews and monitoring</li>
          <li style={{ color: "#8b8fa8" }}>Hosted on Vercel with enterprise-grade infrastructure security</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}>While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>12. Cookies and Tracking Technologies</h2>
        <p style={{ color: "#8b8fa8" }}>We use a small number of cookies. Strictly-necessary cookies (authentication, session) are set without consent because the Service cannot function without them. Non-essential cookies are only set after you accept via the cookie banner.</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Clerk session cookies</strong> (strictly necessary) — keep you signed in.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>bo_consent</strong> (strictly necessary) — records your cookie-banner choice. 180 days.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>bo_sub_grace</strong> (strictly necessary) — short-lived after Stripe checkout return so navigation works while the webhook lands. 10 minutes.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>affiliate_email</strong> (strictly necessary, when using the affiliate portal) — keeps you signed into your affiliate dashboard. 7 days.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>_bv</strong> (analytics, non-essential) — anonymous visitor identifier for understanding which marketing pages perform. 1 year. Only set after consent.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>bo_ref</strong> (functional, non-essential) — affiliate-attribution cookie set when you arrive via an affiliate referral link. 90 days. Only set after consent.</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}>You can clear cookies from your browser settings at any time. We do not use cookies for third-party advertising or for tracking across other websites.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>13. Third-Party Services and Subprocessors</h2>
        <p style={{ color: "#8b8fa8" }}>We use the following subprocessors to operate the platform. Each receives only the data needed to deliver its part of the Service:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Clerk</strong> — authentication and user management</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Stripe</strong> — payment processing, subscription management, Stripe Tax, and Stripe Connect for affiliate payouts</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Neon</strong> — database hosting (PostgreSQL)</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Vercel</strong> — hosting and infrastructure</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Anthropic (Claude)</strong> — AI language model processing for campaign analysis and recommendations</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Meta</strong> — Meta Ads API and WhatsApp Business API integration</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Google</strong> — Google Ads API and Google Calendar API integration</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>TikTok</strong> — TikTok Ads API integration</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Shopify</strong> — Shopify Admin API integration for revenue and order metrics</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Slack</strong> — workspace notifications via OAuth-installed app</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Resend</strong> — transactional email delivery (login links, payment notifications, weekly reports)</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Slack</strong> — workspace notifications</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}>Each provider processes data in accordance with their own privacy policies. We encourage you to review the privacy policies of these third-party services.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>14. Your Privacy Rights</h2>
        <p style={{ color: "#8b8fa8" }}>Depending on your location, you may have certain rights regarding your personal information. All users may:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Access</strong> your personal information that we hold</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Correct</strong> inaccurate or incomplete personal information</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Delete</strong> your personal information and account</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Export</strong> your data in a portable format</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Revoke</strong> third-party integrations (Meta, Google, Slack) at any time</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}>To exercise any of these rights, email us at <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>. We will respond within 30 days (or sooner if required by applicable law).</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>15. California Privacy Rights (CCPA/CPRA)</h2>
        <p style={{ color: "#8b8fa8" }}>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Right to Know.</strong> You have the right to request that we disclose the categories and specific pieces of personal information we have collected about you, the categories of sources from which it was collected, the business or commercial purpose for collecting it, and the categories of third parties with whom we share it.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Right to Delete.</strong> You have the right to request deletion of your personal information, subject to certain exceptions.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Right to Correct.</strong> You have the right to request correction of inaccurate personal information.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Right to Opt-Out of Sale or Sharing.</strong> We do not sell or share your personal information for cross-context behavioral advertising purposes. Because we do not sell or share your data, there is no need to opt out.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Right to Non-Discrimination.</strong> We will not discriminate against you for exercising any of your CCPA rights.</li>
          <li style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Right to Limit Use of Sensitive Personal Information.</strong> We do not use or disclose sensitive personal information for purposes beyond what is necessary to provide the Service.</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Categories of personal information we collect:</strong> Identifiers (name, email, IP address, WhatsApp phone number), commercial information (subscription and billing records), internet or electronic network activity (usage data, interactions with the Service), and professional information (ad account data, campaign performance metrics).</p>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>How to submit a request:</strong> California residents may submit a verifiable consumer request by emailing <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>. We will verify your identity before processing your request and respond within 45 days. You may also designate an authorized agent to submit a request on your behalf.</p>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>Financial incentives:</strong> We offer a 14-day free trial to all new users. This trial does not require you to provide more personal information than what is required for a paid subscription. The value of the free trial is based on the cost of providing the Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>16. Other State Privacy Rights</h2>
        <p style={{ color: "#8b8fa8" }}>Residents of Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), and other states with comprehensive privacy laws may have similar rights to access, correct, delete, and port their data, and to opt out of targeted advertising, profiling, and sale of personal data. We do not sell your data or engage in targeted advertising or profiling as defined by these laws. To exercise your rights, email us at <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>17. Children</h2>
        <p style={{ color: "#8b8fa8" }}>The Service is not directed to children under 16. We do not knowingly collect personal information from children under 16. If we learn we have collected personal information from a child under 16, we will promptly delete that information. If you believe a child has provided us with personal information, please contact us at <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>18. Do Not Track Signals</h2>
        <p style={{ color: "#8b8fa8" }}>Some web browsers transmit &ldquo;Do Not Track&rdquo; (DNT) signals. Because there is no industry-standard interpretation of DNT signals, we do not currently alter our data collection and use practices based on DNT signals. We do not track users across third-party websites.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>19. International Users</h2>
        <p style={{ color: "#8b8fa8" }}>The Service is operated from the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States. By using the Service, you consent to the transfer of your information to the United States, which may have different data protection laws than your country of residence.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>20. Changes to This Policy</h2>
        <p style={{ color: "#8b8fa8" }}>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a prominent notice on the Service at least 14 days before changes take effect. The &ldquo;Last updated&rdquo; date at the top of this page indicates the most recent revision. Continued use of the Service after changes become effective constitutes acceptance of the updated policy.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>21. Contact</h2>
        <p style={{ color: "#8b8fa8" }}>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
        <p style={{ color: "#8b8fa8" }}>
          Buena Onda AI<br />
          Warren, MI 48088<br />
          Email: <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}
