# Terms of Service

**Effective date:** April 19, 2026
**Last updated:** April 19, 2026

These Terms of Service ("Terms") are a binding legal agreement between you and **Paid Rightly LLC** ("we," "us," "our"), a New Mexico limited liability company, regarding your use of Signed Reviews ("Service"), available at [signedreviews.com](https://signedreviews.com) and [platform.signedreviews.com](https://platform.signedreviews.com).

Signed Reviews is a service operated by Paid Rightly LLC.

**By registering for an account, accessing the Service, or submitting a review through the Service, you agree to these Terms and to our [Privacy Policy](https://signedreviews.com/privacy).** If you do not agree, do not use the Service.

> **Important:** Section 17 contains an agreement to resolve most disputes through binding arbitration on an individual basis rather than in court, and a waiver of the right to participate in class actions and jury trials. Please read it carefully.

---

## 1. Who can use the Service

### 1.1 Account types

The Service has two categories of users:

- **Business users** — businesses and their authorized team members who register for a Signed Reviews account at `platform.signedreviews.com` to collect, verify, and display reviews from their customers.
- **Reviewers** — customers of those businesses who receive a review invitation via email and submit a review through a one-time link.

A single reviewer does not create an account with Signed Reviews; they interact with the Service only by submitting reviews and receiving verification emails.

### 1.2 Eligibility

The Service is not directed at individuals under 16 years of age. If you are using the Service on behalf of a business, you represent that you have authority to bind that business to these Terms.

### 1.3 Registration and accuracy

When you register a business account, you agree to provide accurate and current information and to keep it accurate and current. You are responsible for all activity that occurs under your account.

### 1.4 Credentials

You are responsible for keeping your login credentials (email, password, OAuth account, magic-link email access) secure. You must notify us promptly at support@signedreviews.com if you believe your account has been compromised.

---

## 2. Description of the Service

Signed Reviews helps businesses collect verified, tamper-evident reviews from their customers. The core workflow:

1. A business connects their Stripe account to Signed Reviews.
2. When a customer makes a purchase (resulting in a successful Stripe charge), Signed Reviews sends the customer an email invitation to leave a review.
3. The customer clicks a one-time, time-limited link, writes a review, and submits it.
4. The review is cryptographically signed server-side and stored.
5. If enabled by the business, the review is displayed publicly on a hosted review page, in an embeddable widget, and via a public API.

Verified reviews are labeled "Purchase Verified." This label indicates that (a) the review is linked to a specific Stripe charge, (b) the reviewer had access to the email address associated with that charge, and (c) the review content has not been altered since submission. It does not verify the reviewer's legal identity or the subjective truth of the review content.

---

## 3. Current pricing

Signed Reviews is currently offered **free of charge**. There is no subscription fee, no per-review charge, no commission on business transactions, and no platform fee taken from any connected Stripe account.

We reserve the right to introduce paid tiers, usage-based fees, or other charges in the future. We will provide at least 30 days' advance notice by email and an in-product notice before any such change takes effect. If you do not agree to the new pricing, you may discontinue use of the Service before the change takes effect.

---

## 4. Your license to use the Service

Subject to your ongoing compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service for your own internal business purposes.

You may not:

- Copy, modify, reverse engineer, or create derivative works of the Service (except to the extent this restriction is prohibited by applicable law)
- Resell, rent, lease, or otherwise commercially exploit the Service to third parties
- Use the Service to build a competing product
- Remove or obscure any proprietary notices on the Service
- Circumvent or attempt to circumvent rate limits, access controls, or security measures

---

## 5. Your Stripe connection

To use most of the Service, you must connect a Stripe account. By connecting your Stripe account, you:

- Grant us read-only access to your charge data for the purpose of triggering review requests
- Authorize us to create a webhook endpoint on your Stripe account to receive `charge.succeeded` and related events
- Remain solely responsible for your relationship with Stripe, including compliance with Stripe's Services Agreement

We do not take platform fees from your Stripe account, do not initiate charges on your Stripe account, and do not transfer funds. Our access is limited to reading charge metadata necessary to operate the review-request workflow.

You can disconnect your Stripe account at any time through the Service. Doing so will stop future review requests from being triggered.

---

## 6. Business user obligations regarding reviewers

When you use Signed Reviews to request reviews from your customers, you act as the data controller for your customer relationship. You are responsible for:

### 6.1 Lawful basis and consent

Having a lawful basis under applicable law (GDPR, CASL, CAN-SPAM, and any other relevant regime) to send review-request emails to your customers. Where required, you are responsible for obtaining and maintaining records of your customers' consent.

### 6.2 Accuracy of Stripe data

The review invitations Signed Reviews sends are based on the customer data in your connected Stripe account. You are responsible for the accuracy of that data.

### 6.3 No inducements or manipulation

You agree **not** to:

- Offer payment, discounts, free products, or any other consideration in exchange for positive reviews
- Condition a refund, service, or benefit on leaving a review
- Selectively suppress, hide, or filter negative reviews while displaying positive ones
- Edit, fabricate, or impersonate reviewers or reviews
- Solicit reviews from individuals who are not actual paying customers
- Send review requests to email addresses obtained outside the ordinary course of your business relationship with the customer

These restrictions reflect US Federal Trade Commission guidance on endorsements and reviews, as well as similar rules in other jurisdictions. Violation may result in immediate suspension of your account and referral to regulatory authorities.

### 6.4 Replies to reviews

If you respond to a reviewer's review through the Service, your response will be displayed publicly alongside the review. You are responsible for the content of your responses.

### 6.5 Stripe acceptable-use covenant

You represent and warrant that your business does not operate in any category that Stripe identifies as a Restricted Business or Prohibited Business under its published policies (currently maintained at https://stripe.com/legal/restricted-businesses, as updated by Stripe from time to time). If we discover that your connected Stripe account operates in any such category, we may suspend or terminate your account under Section 12, with or without notice.

---

## 7. Reviewer obligations

If you are submitting a review, you agree that:

- Your review reflects your honest, personal opinion based on your actual experience with the business
- You have not been paid, compensated, or offered consideration by the business in exchange for writing the review
- You are the person who made the purchase, or are authorized to submit a review about it
- You own, or have permission to use, any photos you upload
- Your review does not contain content that is unlawful, defamatory, harassing, threatening, obscene, or that infringes anyone's rights

By submitting a review, you understand and agree that:

- Your review will be displayed publicly on the business's review page, in their widget if embedded on third-party sites, and may be made available through their public API
- The display name, photo, and social handle you choose to include will be displayed alongside your review
- You may request anonymization of your review at any time by emailing legal@signedreviews.com
- You can opt out of future review-request emails from any Signed Reviews business by clicking the unsubscribe link in any review-request email

---

## 8. Your content

### 8.1 Ownership

You retain ownership of the content you submit to the Service, including reviews, photos, business branding materials, and replies ("Your Content").

### 8.2 License to us

You grant us a worldwide, non-exclusive, royalty-free, sublicensable license to host, store, reproduce, modify (for technical purposes like format conversion and resizing), display, distribute, and transmit Your Content solely for the purpose of operating and providing the Service, including:

- Displaying reviews on public review pages and in widgets embedded on third-party sites
- Making reviews available through the public API to authorized consumers
- Using anonymized and aggregated data to operate and improve the Service
- Creating backups and operational copies

This license continues for as long as Your Content remains on the Service. If Your Content is anonymized pursuant to a deletion or erasure request, the license continues to apply to the anonymized content.

### 8.3 No moderation guarantee

We do not pre-screen, moderate, or verify the accuracy of reviews or other user-generated content before it is published. Reviews go live immediately on submission. We reserve the right, but have no obligation, to remove content that violates these Terms.

### 8.4 Refunded transactions

If a business refunds the Stripe charge associated with a review, the review will be hidden from public display (widgets, review pages, public API). The underlying record is retained for integrity and audit purposes but is no longer surfaced to the public.

---

## 9. Prohibited uses

You agree not to use the Service to:

- Violate any law, regulation, or third-party right
- Transmit malicious code, viruses, or any harmful content
- Interfere with or disrupt the Service, including by probing, scanning, or testing vulnerabilities without authorization
- Scrape, crawl, or extract data from the Service except through the documented public API, and only within the rate limits and terms of that API
- Use the Service for any form of harassment, discrimination, or hate speech
- Misrepresent your identity or affiliation
- Share your login credentials or allow others to use your account
- Circumvent the unique-review-per-customer controls
- Resell or redistribute data obtained through the Service in a way that violates these Terms or applicable law

We may suspend or terminate accounts that violate these restrictions.

---

## 10. Public API and widget

If you use the public API or embed the Signed Reviews widget on a third-party website, you additionally agree that:

- Your API key is confidential; sharing it is a breach of these Terms
- The public API is rate limited to 100 requests per minute per API key; excessive use may result in throttling or termination
- Widget-embedded reviews must be displayed in their original form without editing or selective omission of negative reviews
- You are responsible for ensuring the widget or API data you display on your site complies with applicable law (including disclosure rules for endorsements)

---

## 11. Service availability and changes

We work to keep the Service available, but we do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the Service at any time. When we make material changes that adversely affect how you use the Service, we will provide reasonable advance notice by email or through the Service.

Scheduled maintenance, infrastructure provider outages, and emergency security actions may interrupt the Service without advance notice.

---

## 12. Termination

### 12.1 Termination by you

You may stop using the Service at any time. You may request deletion of your account by emailing legal@signedreviews.com. When your account is deleted:

- Your business user profile is soft-deleted and your personal identifiers are anonymized
- Reviews collected through your account are anonymized but remain publicly visible (see Section 8.2 of the Privacy Policy for how this works and why)
- Your Stripe connection is revoked
- Team members lose access to the business account

### 12.2 Termination by us

We may suspend or terminate your access to the Service, without refund, if:

- You materially breach these Terms
- Your use of the Service creates legal risk for us or others
- Required by law, regulation, or order of a competent authority
- You fail to pay fees that become due after paid tiers are introduced
- Extended inactivity makes continued service impractical

We will generally give you notice and an opportunity to cure before terminating for a non-urgent breach. For urgent breaches (fraud, illegal use, security threats), we may terminate immediately.

### 12.3 Effect of termination

On termination, your right to use the Service ends immediately. Sections of these Terms that by their nature should survive termination (including Sections 8.2, 13, 14, 15, 16, 17, and 18) will survive.

---

## 13. Third-party services

The Service integrates with third-party services, including Stripe, Resend, Cloudinary, Anthropic, OAuth providers (Google, GitHub, LinkedIn, Microsoft, Facebook, Twitter/X, Instagram), and others listed at [signedreviews.com/subprocessors](https://signedreviews.com/subprocessors). Your use of those services is governed by their own terms. We are not responsible for the acts, omissions, or policies of third-party services.

When we process personal data of your customers (reviewers) on your behalf, we act as your processor under GDPR Article 28 and equivalent privacy laws. The terms of that processing relationship are set out in our [Data Processing Agreement](/dpa/), which is incorporated into these Terms by reference and applies automatically when you accept these Terms.

---

## 14. Disclaimers

THE SERVICE IS PROVIDED **"AS IS" AND "AS AVAILABLE"** WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.

We do not warrant that:

- The Service will be uninterrupted, timely, secure, or error-free
- Any defects will be corrected
- The Service will meet your specific requirements
- Reviews submitted through the Service are accurate, truthful, or non-infringing
- Verification labels guarantee the honesty or identity of reviewers beyond what Section 2 describes

Some jurisdictions do not allow the disclaimer of implied warranties. In those jurisdictions, the above disclaimers apply to the maximum extent permitted.

---

## 15. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

- IN NO EVENT WILL PAID RIGHTLY LLC BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, OR FOR LOST PROFITS, LOST REVENUE, LOST DATA, LOST BUSINESS OPPORTUNITIES, OR REPUTATIONAL HARM, ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE, WHETHER BASED ON CONTRACT, TORT, STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

- OUR TOTAL CUMULATIVE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES YOU PAID TO US IN THE 12 MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE HUNDRED US DOLLARS ($100).

These limitations apply even if a remedy fails of its essential purpose. Some jurisdictions do not allow the exclusion or limitation of certain damages. In those jurisdictions, the above limitations apply to the maximum extent permitted.

---

## 16. Indemnification

You agree to defend, indemnify, and hold harmless Paid Rightly LLC, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to:

- Your use of the Service
- Your violation of these Terms
- Your violation of any applicable law or third-party right
- Your Content, including any claim that it infringes intellectual property rights, is defamatory, or violates privacy rights
- Your relationship with your customers, including compliance with consent and anti-spam laws

We reserve the right, at our expense, to assume exclusive defense and control of any matter otherwise subject to indemnification by you. You agree to cooperate with our defense.

---

## 17. Dispute resolution, arbitration, and class action waiver

> **Please read this section carefully. It affects your legal rights, including your right to file a lawsuit in court.**

### 17.1 Informal resolution (required first step)

Before initiating any arbitration or legal action, you and Paid Rightly LLC agree to attempt to resolve any dispute informally. You must send a written notice describing the dispute to **legal@signedreviews.com**, including your name, contact information, a clear description of the claim, and the specific relief sought. We will similarly send any notice to you using the contact information on your account. **Neither party may commence an arbitration or lawsuit (other than in small claims court, or for injunctive or IP relief as described below) until at least 30 days after the notice is sent.** The parties will make a good-faith effort to resolve the dispute during that 30-day period.

### 17.2 Agreement to arbitrate

If informal resolution does not resolve the dispute, you and Paid Rightly LLC agree that **any dispute, claim, or controversy arising out of or relating to these Terms or the Service — except for the carve-outs in Section 17.4 — will be resolved by binding individual arbitration** rather than in court.

The arbitration will be administered by the **American Arbitration Association (AAA)** under its Consumer Arbitration Rules (or its Commercial Rules, if applicable based on the claim), available at [www.adr.org](https://www.adr.org). If AAA is unavailable, the parties will agree on an alternative arbitrator; if they cannot agree, a court may appoint one. The arbitration will be conducted in English. The seat of arbitration will be **Albuquerque, New Mexico**, though the arbitrator may conduct proceedings remotely or by written submission where feasible, and hearings may be held elsewhere with the parties' agreement.

The arbitrator's decision will be final and binding. Judgment on the arbitration award may be entered in any court of competent jurisdiction.

### 17.3 Class action and jury trial waiver

YOU AND PAID RIGHTLY LLC AGREE THAT ANY DISPUTE RESOLUTION PROCEEDING WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT AS A CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE ACTION. THE ARBITRATOR HAS NO AUTHORITY TO CONSOLIDATE THE CLAIMS OF MULTIPLE PARTIES OR TO PRESIDE OVER ANY FORM OF CLASS OR REPRESENTATIVE PROCEEDING.

YOU AND PAID RIGHTLY LLC EACH WAIVE THE RIGHT TO A TRIAL BY JURY.

If the class action waiver is found to be unenforceable in a particular case, that specific claim will proceed in court, but the remainder of this Section 17 will remain in effect for all other claims.

### 17.4 Carve-outs (what stays in court)

The following disputes are **not** subject to mandatory arbitration and may be brought in court:

- **Small claims court actions** — either party may bring an individual claim in a small claims court of competent jurisdiction, as long as the matter stays in that court and is not removed or appealed to a court of general jurisdiction.
- **Injunctive relief** — either party may seek temporary or preliminary injunctive relief in a court of competent jurisdiction to address urgent harms (such as misuse of login credentials, unauthorized scraping, or breaches of Section 9).
- **Intellectual property disputes** — either party may bring a court action to protect its intellectual property rights (including claims of infringement, misappropriation of trade secrets, or enforcement of license terms).

### 17.5 Opt-out of arbitration

You may opt out of the arbitration agreement in Section 17.2 by sending written notice to legal@signedreviews.com within **30 days of first accepting these Terms**. The notice must include your name, the email address associated with your account, and a clear statement that you are opting out of the arbitration agreement. Opting out will not affect any other provision of these Terms.

### 17.6 Governing law

These Terms are governed by the laws of the **State of New Mexico, United States**, without regard to its conflict-of-laws principles. The Federal Arbitration Act governs the interpretation and enforcement of Section 17.2.

### 17.7 Forum for non-arbitrable disputes

For any dispute that is not subject to arbitration under Section 17.4 or otherwise, you and Paid Rightly LLC agree to submit to the exclusive jurisdiction of the state and federal courts located in **Bernalillo County, New Mexico**, and waive any objection to venue in those courts.

---

## 18. General

### 18.1 Entire agreement

These Terms, together with the Privacy Policy and any other policies referenced in them, constitute the entire agreement between you and Paid Rightly LLC regarding the Service and supersede any prior agreements.

### 18.2 Changes to these Terms

We may update these Terms from time to time. When we make material changes, we will update the "Last updated" date and notify you by email or through the Service at least 30 days before the changes take effect (except for changes required for legal or security reasons, which may take effect sooner). Continued use of the Service after the updated Terms take effect constitutes acceptance. If you do not agree, you must stop using the Service.

### 18.3 Severability

If any provision of these Terms is held unenforceable, the remaining provisions will remain in full force and effect, and the unenforceable provision will be modified to the minimum extent necessary to make it enforceable while reflecting the original intent.

### 18.4 No waiver

Our failure to enforce any right or provision of these Terms is not a waiver of that right or provision.

### 18.5 Assignment

You may not assign or transfer these Terms without our prior written consent. We may assign these Terms freely in connection with a merger, acquisition, financing, or sale of assets.

### 18.6 No third-party beneficiaries

These Terms do not create any third-party beneficiary rights.

### 18.7 Force majeure

Neither party is liable for delays or failures caused by events beyond its reasonable control, including acts of God, war, terrorism, pandemic, labor disputes, government action, utility failures, or internet outages.

### 18.8 Contact

For questions about these Terms:

**Email:** legal@signedreviews.com
**Mail:** Paid Rightly LLC, 1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States

For general support: support@signedreviews.com
