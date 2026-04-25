# Privacy Policy

**Effective date:** April 19, 2026
**Last updated:** April 19, 2026

This Privacy Policy explains how Paid Rightly LLC ("we," "us," "our") collects, uses, discloses, and protects information when you use Signed Reviews, available at [signedreviews.com](https://signedreviews.com) and [platform.signedreviews.com](https://platform.signedreviews.com) (collectively, the "Service").

Signed Reviews is a service operated by Paid Rightly LLC, a New Mexico limited liability company.

**Contact for privacy matters:** legal@signedreviews.com
**Mailing address:** Paid Rightly LLC, 1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States

---

## 1. Who this policy applies to

Signed Reviews has three types of people whose personal data we handle:

- **Business users** — the businesses that sign up for Signed Reviews and their team members who log in to the platform at `platform.signedreviews.com`.
- **Reviewers** — the customers of those businesses who receive an email invitation to leave a review and submit one through a one-time link.
- **Visitors** — anyone who views a public review page, clicks a review widget embedded on a third-party site, or browses our marketing website.

Different parts of this policy apply to each group. Where relevant, we call this out explicitly.

---

## 2. Our role under privacy law

For **business users**, we act as a "controller" (or "business" under US state privacy laws) of your personal data.

For **reviewer data**, our role depends on context:

- When a business collects a review from their customer using Signed Reviews, the business is the controller of that reviewer's personal data for their own customer-relationship purposes. We act as a "processor" (or "service provider") on their behalf.
- For our own operational purposes — such as fraud prevention, platform security, and ensuring the integrity of the verified-review system — we act as a controller of a limited set of reviewer data (email address used for verification, cryptographic signatures, technical metadata).

This distinction matters because it determines who a reviewer should contact with questions about their data. In most cases, the business that requested your review is your primary contact. You can always reach us at legal@signedreviews.com as well.

When we act as a processor for a business, the terms of that processing relationship — including security measures, sub-processor authorization, breach notification, audit rights, and international-transfer mechanisms — are set out in our [Data Processing Agreement](/dpa/), which is incorporated by reference into the [Terms of Service](/terms/) at the moment a business signs up.

---

## 3. Information we collect

### 3.1 From business users

When you register for a Signed Reviews account, either directly or through Google, GitHub, LinkedIn, or Microsoft single sign-on, we collect:

- **Email address**
- **Display name**
- **Profile picture** (only if you provide one through SSO or upload)
- **Hashed password** (only for email/password signups — we never store your password in readable form; we use bcrypt with cost factor 12)
- **Business information you provide:** business name, website URL, brand logo, brand colors, email subject preferences, widget and review page customization settings

We do not collect phone numbers, dates of birth, physical addresses, government identification, or tax identification numbers from business users.

### 3.2 From reviewers

When a business uses Signed Reviews to request a review from you, we receive the following information from that business's Stripe account:

- **Your email address** (used to deliver the review invitation)
- **The last four digits of the payment card you used** (used for the optional email-and-card verification level)
- **The transaction amount and currency** (displayed on the review form if the business enables it)
- **A Stripe charge identifier** (used to prevent duplicate review requests and to cryptographically sign your review)

If you choose to submit a review, we also collect whatever you enter into the review form, which may include:

- **A star rating**
- **A review title and body** (up to 2,000 characters)
- **Up to three photos** (JPEG, PNG, or WebP, up to 5 MB each)
- **A social media handle** you choose to attach (Instagram, LinkedIn, Google, GitHub, Facebook, or Twitter/X), along with the display name and profile picture from that account if you link it
- **A display name and photo** from OAuth login with Google, GitHub, LinkedIn, Facebook, Twitter/X, or Instagram, or from Gravatar based on your email address, if you choose to attach one

Attaching a social handle and photo is always optional. You can submit a review with only the email address the business already has for you.

### 3.3 Payment information

Signed Reviews does not process payments from reviewers, does not take fees from business Stripe accounts, and does not store full card numbers, CVV codes, expiry dates, cardholder names, or full billing addresses.

The only payment-adjacent data we store is a narrow slice of charge metadata received from Stripe webhooks: the charge ID, customer email, card last four digits, amount, and currency. These are used to link a review to a verified purchase.

### 3.4 Technical information

We collect limited technical information to keep the Service working:

- **IP address** — used transiently for rate limiting to prevent abuse. We do not persist IP addresses in our database.
- **Browser session tokens** — stored in your browser's local storage after you log in. These are not cookies.

We do not use tracking cookies, analytics cookies, advertising cookies, session replay tools, or behavioral analytics platforms. We do not set any cookies from our backend. We do not embed tracking pixels in the emails we send.

### 3.5 From third parties

When you sign in using an OAuth provider (Google, GitHub, LinkedIn, Microsoft, Facebook, Twitter/X, or Instagram), that provider shares a limited profile with us — typically your subject identifier, email address, name, and profile picture URL. We only request the minimum scopes needed for authentication or for the specific feature you are using.

When a business enters their website URL during branding setup, we fetch that website's publicly accessible HTML to identify logo images. We may also query public favicon services (Clearbit, Google Favicons, DuckDuckGo) for logo candidates. We store only the logo images the business chooses to use.

---

## 4. How we use information

### 4.1 To provide the Service

- Authenticate business users and maintain logged-in sessions (7-day session tokens)
- Deliver review-request emails triggered by successful Stripe charges
- Generate and validate one-time review submission links (valid for 14 days, single-use)
- Display reviews on public review pages, embeddable widgets, and the public API, subject to each business's configuration
- Produce aggregate analytics for business users from their own review and transaction data

### 4.2 To verify reviews

Every review submitted through Signed Reviews is cryptographically signed server-side using HMAC-SHA256. This signature proves, to anyone who inspects the review later, that:

- The review was linked to a specific Stripe charge
- The reviewer had access to the email address on that charge
- The review content has not been altered since submission

We label these reviews as "Purchase Verified." This does **not** mean we have verified the reviewer's legal identity, verified that they are who they claim to be socially, or evaluated the honesty of their review. It only means the review is tied to a real purchase on the business's Stripe account.

### 4.3 To communicate with you

We send the following emails — all transactional, none marketing:

- Account email verification and password-change flows, for business users
- Magic-link login messages, for business users who request them
- Team invitations, for people invited to join a business account
- Review-request emails, for reviewers, white-labeled with the business's branding and a clear "Powered by Signed Reviews" footer

We do not send marketing emails, newsletters, product announcements, or promotional content to reviewers. Business users may receive occasional operational notices from us (security alerts, policy updates, service changes).

### 4.4 To protect the Service

- Rate limiting on review submission, public API access, and authentication endpoints
- Webhook deduplication to prevent duplicate processing of Stripe events
- One-review-per-customer-per-business enforcement (with an override if the customer makes a subsequent, higher-value purchase)

### 4.5 To comply with law

We may use and disclose information to comply with applicable law, respond to lawful government requests, enforce our Terms of Service, protect our rights and safety, and prevent fraud or abuse.

---

## 5. How we share information

We do not sell personal data. We do not share personal data with advertisers. We do not share personal data with data brokers.

We share personal data in the following limited circumstances:

### 5.1 With businesses that requested your review

If you are a reviewer, your review — including any content, photos, display name, and social handle you chose to include — is visible to the business that requested it. If that business has enabled public review display, your review is also visible to anyone who views the business's public review page or any site embedding the business's widget.

### 5.2 With sub-processors

We use a small number of service providers to operate the Service. A complete, current list is maintained at [signedreviews.com/subprocessors](https://signedreviews.com/subprocessors). At the time this policy was last updated, our sub-processors are:

- **Stripe** (payments and transaction data)
- **Resend** (transactional email delivery)
- **Cloudinary** (image hosting for review photos and brand assets)
- **Anthropic** (AI logo extraction — see Section 6 for specifics)
- **Railway** (cloud hosting and managed database)
- **Decodo** (proxy service used only for Instagram public profile lookups)
- **OAuth providers** (Google, GitHub, LinkedIn, Microsoft, Facebook, Twitter/X, Instagram) — only when you choose to use them
- **Gravatar** (only when we check whether your email has an associated avatar)

Each sub-processor is contractually bound to use personal data only for the purpose of providing services to us.

### 5.3 Business transfers

If Paid Rightly LLC is involved in a merger, acquisition, financing, or sale of assets, personal data may be transferred as part of that transaction. We will provide notice before personal data becomes subject to a different privacy policy.

### 5.4 Legal compliance and rights protection

We may disclose information in response to lawful subpoenas, court orders, or government requests; when required by applicable law; or when we believe disclosure is necessary to protect the rights, property, or safety of Paid Rightly LLC, our users, or the public.

---

## 6. How we use AI

We use Anthropic's Claude AI (specifically, Claude Haiku with vision capabilities) for one purpose only: helping businesses extract brand logos and visual identity from their own publicly available website during onboarding. The AI is shown the HTML of the website URL a business enters, along with candidate logo images from that site, and selects the most likely logo.

We do **not** use AI to analyze, moderate, score, or train on:

- Review content (ratings, titles, bodies, photos)
- Reviewer names, email addresses, social handles, or any reviewer personal data
- Payment or transaction data
- Private messages, business-reply text, or any business user's account data

Anthropic does not train models on data sent through the Claude API, per Anthropic's commercial terms. The only data that flows to Anthropic is the publicly accessible website content the business asked us to analyze.

---

## 7. How we protect information

- **In transit:** All traffic to the Service is protected by TLS (HTTPS).
- **At rest:** Our database and file storage rely on the encryption provided by our infrastructure providers (Railway for databases, Cloudinary for files).
- **Passwords:** Hashed with bcrypt (cost factor 12). We never see or store your plaintext password.
- **Review integrity:** Every review carries an HMAC-SHA256 signature generated with a server-side secret, making post-hoc tampering detectable.
- **Access control:** Team member access within a business account is role-based (Owner, Admin, Member).
- **Secrets handling:** API keys and other secrets required to operate the Service are stored in environment variables, not committed to source code.

No system is perfectly secure. If we become aware of a breach affecting your personal data, we will notify you as required by applicable law.

---

## 8. How long we keep information

- **Business user accounts:** Kept while your account is active. If you delete your account, we soft-delete your account and anonymize your associated reviews and transaction records (see Section 9).
- **Reviews and transactions:** Kept indefinitely by default, because the value of a verified-review platform depends on a durable record of reviews. If a reviewer requests erasure, we anonymize the review (see Section 9).
- **Short-lived tokens:** Review-submission tokens expire after 14 days; magic-link tokens after 15 minutes; invitations after 7 days. Expired tokens become unusable immediately; they may remain in the database for a period before routine cleanup.
- **Refunded transactions:** When a business refunds a Stripe charge, the associated review is hidden from public surfaces. The underlying record is retained for integrity purposes but is no longer displayed.
- **Email logs:** Resend, our email provider, retains delivery logs per their own retention policy.
- **Server logs:** Application logs generated during normal operation are retained by our hosting provider (Railway) for up to 30 days.

---

## 9. Your rights and choices

Depending on where you live, you may have rights under laws such as the EU General Data Protection Regulation (GDPR), the UK GDPR, the California Consumer Privacy Act (CCPA/CPRA), and similar US state laws (including Colorado, Connecticut, Virginia, Utah, Texas, and others). We honor these rights for all users regardless of location.

### 9.1 Rights available to you

- **Access** — request a copy of the personal data we hold about you
- **Correction** — correct inaccurate personal data
- **Erasure** — request deletion of your personal data (subject to the anonymization approach described below)
- **Portability** — receive your personal data in a portable format
- **Objection / restriction** — object to or restrict certain processing
- **Withdrawal of consent** — withdraw consent where processing relies on consent
- **Non-discrimination** — exercise these rights without being penalized in how the Service is provided

### 9.2 How erasure works

**For business users:** You can request account deletion by emailing legal@signedreviews.com. We will delete your account and associated personal data (email, display name, profile picture, team membership). Reviews and transaction records associated with your business will be anonymized — the review content, rating, and cryptographic signature remain public (because third parties rely on them), but reviewer identifiers tied to your account will be removed.

**For reviewers:** You can request erasure of your review by emailing legal@signedreviews.com with the email address you used to receive the review invitation. On verification, we will anonymize the review: your display name, photo, social handle, and email-derived identifiers will be removed, while the rating, review body, and verification signature will remain. We follow this anonymize-rather-than-delete approach because deleting reviews outright would undermine the integrity of the verified-review record that other users rely on. If anonymization does not satisfy your erasure request under applicable law, contact us and we will work with you in good faith to resolve it.

### 9.3 Opting out of review-request emails

Every review-request email contains a one-click unsubscribe link. Clicking it adds your email address to a global suppression list, preventing any Signed Reviews business from sending you future review invitations. This applies across all businesses using the platform, not just the one that sent the email.

### 9.4 How to exercise your rights

Email legal@signedreviews.com from the email address associated with your data, or from the email that received the review invitation (for reviewers). We will respond within the timeframe required by applicable law (typically 30 days under GDPR; 45 days under CCPA, extendable to 90 days). We may need to verify your identity before fulfilling requests.

### 9.5 Appeals and complaints

If we decline your request and you are covered by a US state law that provides an appeal right (e.g., Colorado, Virginia), you may appeal by replying to our response. If you are not satisfied, you may also file a complaint with your data protection authority:

- **EU/EEA residents:** Your local Data Protection Authority
- **UK residents:** The Information Commissioner's Office (ICO)
- **California residents:** The California Privacy Protection Agency or the California Attorney General
- **Other US residents:** Your state Attorney General

---

## 10. International data transfers

Signed Reviews is operated from the United States. When you use the Service from outside the US, your personal data is transferred to and processed in the United States and in countries where our sub-processors operate.

For transfers of EU/UK personal data to the United States, we rely on Standard Contractual Clauses (SCCs) with our sub-processors, as applicable. Stripe, Resend, Cloudinary, Anthropic, and our other sub-processors have their own cross-border transfer mechanisms in place.

---

## 11. Children

Signed Reviews is not directed at children under 16, and we do not knowingly collect personal data from children under 16. If you believe a child has submitted personal data to us, contact legal@signedreviews.com and we will delete it.

---

## 12. California-specific disclosures

If you are a California resident, the following additional information applies to you under the California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA):

**Categories of personal information collected in the last 12 months:** identifiers (email, name, IP address transiently), commercial information (transaction metadata from Stripe), internet/electronic activity information (login events), professional information (business name, role), and user-generated content (reviews, photos).

**Sources:** directly from you, from OAuth providers when you choose to use them, from Stripe webhooks when a business you've purchased from uses Signed Reviews, and from public websites during brand extraction.

**Business purposes for which we use this information:** providing the Service, verifying reviews, security and fraud prevention, communicating with you, and legal compliance.

**Categories disclosed to sub-processors:** see Section 5.2 and the sub-processor list.

**Sale or sharing of personal information:** We do **not** sell personal information and do **not** "share" personal information for cross-context behavioral advertising, as those terms are defined under CCPA/CPRA.

**Sensitive personal information:** We do not collect sensitive personal information as defined under CPRA.

**Right to limit use of sensitive personal information:** not applicable, because we do not collect such information.

---

## 13. Changes to this policy

We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last updated" date at the top and, where appropriate, notify you by email or through a notice in the Service. Continued use of the Service after the updated policy takes effect constitutes acceptance.

---

## 14. Contact us

For privacy questions, data subject requests, or any other inquiry related to this policy:

**Email:** legal@signedreviews.com
**Mail:** Paid Rightly LLC, 1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States

For general support, contact support@signedreviews.com.
