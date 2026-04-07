import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

export const metadata = {
  title: "Terms of Service — Buena Onda",
  description:
    "Read Buena Onda AI's terms of service for the autonomous AI-powered ad management platform.",
};

export default function TermsOfService() {
  return (
    <div style={{ background: "#0d0f14", minHeight: "100vh", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8eaf0" }}>
      <LandingNav />
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 pt-24 sm:pt-[120px] pb-16 sm:pb-20" style={{ overflowWrap: "break-word" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, color: "#e8eaf0" }}>Terms of Service</h1>
        <p style={{ color: "#8b8fa8", marginTop: 0, marginBottom: 36 }}>Last updated: April 2026</p>

        <p style={{ color: "#8b8fa8" }}>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Buena Onda platform operated by Buena Onda AI (&ldquo;Buena Onda,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a Michigan-based company located in Warren, MI (Macomb County). By accessing or using the Service at buenaonda.ai, you agree to be bound by these Terms. If you do not agree, do not use the Service. These Terms incorporate our <a href="/privacy-policy" style={{ color: "#f5a623" }}>Privacy Policy</a> by reference.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>1. The Service</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda is an autonomous AI-powered ad management SaaS platform for marketing agencies. It integrates with Meta Ads and Google Ads — along with Slack, WhatsApp (via Meta), and Google Calendar — to provide campaign monitoring, anomaly detection, AI-driven recommendations and optimizations, ad building tools, automated client reporting, and conversational campaign management. Features are described on our website and may change over time as we improve the Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>2. Eligibility and Accounts</h2>
        <p style={{ color: "#8b8fa8" }}>You must be at least 18 years old and have the legal authority to enter into these Terms. You must be authorized to manage the ad accounts you connect to the Service. You are responsible for maintaining the confidentiality and security of your account credentials (managed via Clerk) and for all activity that occurs under your account. You must notify us immediately at <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a> if you suspect unauthorized access to your account.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>3. Free Trial</h2>
        <p style={{ color: "#8b8fa8" }}>We offer a 14-day free trial on all subscription plans. During the trial period, you have full access to the features included in your selected plan. No payment is required to start the trial, but you must provide valid payment information before the trial ends to continue using the Service. If you do not convert to a paid subscription before the trial expires, your access to the Service will be suspended.</p>
        <p style={{ color: "#8b8fa8" }}>We reserve the right to modify, limit, or discontinue the free trial at any time without prior notice. Free trials are limited to one per user or organization.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>4. Subscriptions and Billing</h2>
        <p style={{ color: "#8b8fa8" }}>Access to the Service requires a paid subscription after your free trial ends. Current plans are priced at $97, $197, $297, and $397 per month. Plan details and feature breakdowns are listed on our <a href="/pricing" style={{ color: "#f5a623" }}>pricing page</a>. Subscriptions are billed monthly in advance through Stripe.</p>
        <p style={{ color: "#8b8fa8" }}>All fees are in US dollars and are non-refundable except as required by applicable law or as expressly stated in these Terms. Taxes may apply based on your jurisdiction and are your responsibility.</p>
        <p style={{ color: "#8b8fa8" }}>We reserve the right to change pricing with 30 days&apos; written notice. Continued use of the Service after a price change takes effect constitutes acceptance of the new pricing. If you do not agree with a price change, you may cancel your subscription before the change takes effect.</p>
        <p style={{ color: "#8b8fa8" }}>If your payment fails, we will attempt to retry for up to 7 days before suspending your account. You can update your payment method at any time from your account settings. During suspension, your data will be retained for 30 days, after which it may be permanently deleted.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>5. Acceptable Use</h2>
        <p style={{ color: "#8b8fa8" }}>You agree not to:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>Use the Service to violate Meta&apos;s, Google&apos;s, or any other platform&apos;s advertising policies, terms of service, or any applicable law or regulation</li>
          <li style={{ color: "#8b8fa8" }}>Attempt to reverse engineer, decompile, disassemble, or extract source code from the Service</li>
          <li style={{ color: "#8b8fa8" }}>Use automated scripts, bots, or other tools to access the Service in a way that damages, overloads, or impairs it</li>
          <li style={{ color: "#8b8fa8" }}>Share your account credentials with others, allow multiple individuals to use a single account, or resell access to the Service</li>
          <li style={{ color: "#8b8fa8" }}>Use the Service to manage ad accounts you are not authorized to access</li>
          <li style={{ color: "#8b8fa8" }}>Upload or transmit malicious code, viruses, or harmful content</li>
          <li style={{ color: "#8b8fa8" }}>Interfere with or disrupt the integrity or performance of the Service</li>
          <li style={{ color: "#8b8fa8" }}>Use the Service for any illegal, fraudulent, or deceptive purpose</li>
          <li style={{ color: "#8b8fa8" }}>Circumvent any usage limits, access controls, or security measures of the Service</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}>We reserve the right to suspend or terminate your account for violation of these acceptable use provisions, with or without notice.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>6. AI-Generated Recommendations and Automation</h2>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>The Service uses artificial intelligence (specifically Claude, developed by Anthropic) to analyze your ad campaign data and generate recommendations, optimizations, reports, and conversational responses.</strong></p>
        <p style={{ color: "#8b8fa8" }}>You acknowledge and agree that:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>AI-generated recommendations, insights, reports, and automated actions are provided on an &ldquo;as-is&rdquo; basis and do not constitute professional marketing, financial, or legal advice</li>
          <li style={{ color: "#8b8fa8" }}>AI outputs may contain errors, inaccuracies, or suboptimal recommendations. You should review all AI-generated recommendations before acting on them</li>
          <li style={{ color: "#8b8fa8" }}>Campaign performance depends on many factors outside the control of Buena Onda or its AI systems, including market conditions, competition, ad creative quality, targeting choices, platform algorithm changes, and budget levels</li>
          <li style={{ color: "#8b8fa8" }}>Buena Onda does not guarantee any specific results, improvements in campaign performance, return on ad spend (ROAS), or reduction in cost per acquisition (CPA) from using the Service or following AI recommendations</li>
          <li style={{ color: "#8b8fa8" }}>You retain full responsibility and sole liability for all campaign decisions, ad spend, ad content, targeting, and compliance with advertising platform policies, whether those decisions are informed by AI recommendations or automated by the Service</li>
          <li style={{ color: "#8b8fa8" }}>If you enable automated optimization features, the Service may make changes to your campaigns (such as budget adjustments, bid changes, or pausing underperforming ads) based on AI analysis. You are responsible for configuring automation settings and monitoring automated actions</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>7. Meta Platform Compliance</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting your Meta ad accounts, you confirm that you are authorized to access and manage those accounts and that your use complies with Meta&apos;s Platform Terms and Advertising Policies. You are solely responsible for the ad campaigns you create, manage, or modify through the Service, including compliance with all Meta advertising requirements.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>8. Google Ads API Compliance</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting your Google Ads accounts, you confirm that you are authorized to access and manage those accounts and that your use complies with the <a href="https://developers.google.com/google-ads/api/docs/terms" style={{ color: "#f5a623" }}>Google Ads API Terms and Conditions</a> and <a href="https://support.google.com/adspolicy/answer/6008942" style={{ color: "#f5a623" }}>Google Ads Policies</a>.</p>
        <p style={{ color: "#8b8fa8" }}>Buena Onda&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" style={{ color: "#f5a623" }}>Google API Services User Data Policy</a>, including the Limited Use requirements. You are solely responsible for all campaign decisions made using the Service, including campaigns created, modified, or optimized through AI-powered automation.</p>
        <p style={{ color: "#8b8fa8" }}>You may revoke Buena Onda&apos;s access to your Google Ads account at any time from your <a href="https://myaccount.google.com/permissions" style={{ color: "#f5a623" }}>Google Account permissions</a> page.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>9. Slack Integration</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting Slack, you authorize Buena Onda to send campaign alerts and performance notifications to your designated Slack channels. We do not read, store, or process your Slack messages. You may revoke access at any time from your Slack workspace settings.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>10. WhatsApp Integration</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda provides an AI-powered conversational assistant via the Meta WhatsApp Business API. By interacting with Buena Onda on WhatsApp, you acknowledge that your messages are processed by our AI to generate responses about your campaign performance and ad strategy. AI-generated responses are informational and do not constitute professional advice.</p>
        <p style={{ color: "#8b8fa8" }}>Knowledge base rules submitted via WhatsApp are stored and applied to your campaign optimization. You are responsible for ensuring any rules or instructions you submit comply with applicable advertising policies. Use of the WhatsApp integration is subject to Meta&apos;s WhatsApp Business Terms of Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>11. Google Calendar Integration</h2>
        <p style={{ color: "#8b8fa8" }}>By connecting Google Calendar, you authorize Buena Onda to create, update, and manage calendar events related to your ad campaigns and use of the Service. You may revoke access at any time from your <a href="https://myaccount.google.com/permissions" style={{ color: "#f5a623" }}>Google Account permissions</a> page.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>12. Intellectual Property</h2>
        <p style={{ color: "#8b8fa8" }}>The Service, including its software, algorithms, AI models (excluding third-party models like Claude), design, branding, documentation, and all related content, is owned by Buena Onda and protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service solely for your internal business purposes during your active subscription term.</p>
        <p style={{ color: "#8b8fa8" }}>You retain ownership of your data, including your ad account data, campaign content, and any content you upload to the Service. By using the Service, you grant us a limited license to process your data solely for the purpose of providing and improving the Service.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>13. Confidentiality</h2>
        <p style={{ color: "#8b8fa8" }}>Each party agrees to maintain the confidentiality of the other party&apos;s confidential information. Your ad account data, campaign strategies, performance metrics, and business information are treated as your confidential information. Our proprietary technology, algorithms, pricing strategies, and business plans are treated as our confidential information. Neither party will disclose the other&apos;s confidential information to third parties except as necessary to perform under these Terms or as required by law.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>14. Disclaimer of Warranties</h2>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</strong></p>
        <p style={{ color: "#8b8fa8" }}>Without limiting the foregoing, we do not warrant that:</p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>The Service will be uninterrupted, error-free, or free of harmful components</li>
          <li style={{ color: "#8b8fa8" }}>AI recommendations will improve your campaign performance or produce any specific results</li>
          <li style={{ color: "#8b8fa8" }}>The Service will be compatible with all ad account configurations or platform API changes</li>
          <li style={{ color: "#8b8fa8" }}>Data from third-party platforms (Meta, Google) will always be accurate, complete, or timely</li>
          <li style={{ color: "#8b8fa8" }}>Automated campaign actions will always produce desired outcomes</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}>Ad platform APIs may change without notice, which may temporarily or permanently affect Service functionality. We will make reasonable efforts to adapt to such changes but cannot guarantee uninterrupted integration.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>15. Limitation of Liability</h2>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BUENA ONDA, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</strong></p>
        <ul>
          <li style={{ color: "#8b8fa8" }}>Lost profits, revenue, or business opportunities</li>
          <li style={{ color: "#8b8fa8" }}>Ad spend losses or wasted advertising budget</li>
          <li style={{ color: "#8b8fa8" }}>Loss of data or data corruption</li>
          <li style={{ color: "#8b8fa8" }}>Damages arising from AI-generated recommendations or automated campaign actions</li>
          <li style={{ color: "#8b8fa8" }}>Damages arising from third-party platform changes, outages, or API modifications</li>
          <li style={{ color: "#8b8fa8" }}>Loss of goodwill or reputation</li>
          <li style={{ color: "#8b8fa8" }}>Cost of procurement of substitute services</li>
        </ul>
        <p style={{ color: "#8b8fa8" }}><strong style={{ color: "#e8eaf0" }}>OUR TOTAL AGGREGATE LIABILITY FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID TO BUENA ONDA IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.</strong></p>
        <p style={{ color: "#8b8fa8" }}>These limitations apply regardless of the theory of liability (contract, tort, negligence, strict liability, or otherwise) and even if we have been advised of the possibility of such damages. Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>16. Indemnification</h2>
        <p style={{ color: "#8b8fa8" }}>You agree to indemnify, defend, and hold harmless Buena Onda and its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any advertising platform&apos;s policies or terms; (d) your ad campaigns, ad content, or targeting decisions; or (e) your violation of any applicable law or regulation.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>17. Termination</h2>
        <p style={{ color: "#8b8fa8" }}>You may cancel your subscription at any time from your account settings or by contacting us at <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>. Cancellation takes effect at the end of your current billing period. You will continue to have access to the Service until the end of the period you have already paid for. No refunds or prorated credits will be issued for unused portions of a billing period.</p>
        <p style={{ color: "#8b8fa8" }}>We may suspend or terminate your account immediately for violation of these Terms, illegal activity, or for any reason with 30 days&apos; notice. Upon termination, your right to use the Service ceases immediately (or at the end of the notice period, as applicable). We will retain your data for 30 days after termination to allow you to export it, after which it may be permanently deleted.</p>
        <p style={{ color: "#8b8fa8" }}>Sections 6 (AI Disclaimer), 12 (Intellectual Property), 13 (Confidentiality), 14 (Disclaimer of Warranties), 15 (Limitation of Liability), 16 (Indemnification), and 19 (Governing Law) survive termination of these Terms.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>18. Affiliate Program</h2>
        <p style={{ color: "#8b8fa8" }}>Participation in the Buena Onda affiliate program is subject to additional terms presented during signup. Commission rates and payout terms may change with 30 days&apos; notice to active affiliates. Buena Onda reserves the right to modify, suspend, or terminate the affiliate program at any time.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>19. Governing Law and Dispute Resolution</h2>
        <p style={{ color: "#8b8fa8" }}>These Terms are governed by and construed in accordance with the laws of the State of Michigan, United States, without regard to conflict of law principles. Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved exclusively in the state or federal courts located in Macomb County, Michigan, and you consent to the personal jurisdiction of such courts.</p>
        <p style={{ color: "#8b8fa8" }}>Before initiating any formal legal proceeding, you agree to first attempt to resolve the dispute informally by contacting us at <a href="mailto:support@buenaonda.ai" style={{ color: "#f5a623" }}>support@buenaonda.ai</a>. We will attempt to resolve the dispute within 30 days of receiving your notice.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>20. Force Majeure</h2>
        <p style={{ color: "#8b8fa8" }}>Buena Onda shall not be liable for any failure or delay in performing its obligations under these Terms due to causes beyond its reasonable control, including but not limited to: natural disasters, acts of government, internet outages, third-party platform outages or API changes (Meta, Google, Stripe, etc.), cyberattacks, pandemics, or labor disputes.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>21. Severability</h2>
        <p style={{ color: "#8b8fa8" }}>If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision will be enforced to the maximum extent permissible, and the remaining provisions will remain in full force and effect.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>22. Entire Agreement</h2>
        <p style={{ color: "#8b8fa8" }}>These Terms, together with the <a href="/privacy-policy" style={{ color: "#f5a623" }}>Privacy Policy</a> and any additional terms referenced herein, constitute the entire agreement between you and Buena Onda regarding the Service and supersede all prior agreements, understandings, and communications, whether written or oral.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>23. Changes to These Terms</h2>
        <p style={{ color: "#8b8fa8" }}>We may update these Terms from time to time. We will notify you of material changes by email at least 14 days before they take effect. The &ldquo;Last updated&rdquo; date at the top of this page indicates the most recent revision. Continued use of the Service after changes take effect constitutes acceptance. If you do not agree to the updated Terms, you must stop using the Service and cancel your subscription.</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 36, color: "#f5a623" }}>24. Contact</h2>
        <p style={{ color: "#8b8fa8" }}>If you have questions about these Terms, contact us at:</p>
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
