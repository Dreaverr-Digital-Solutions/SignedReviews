# Data Processing Agreement

**Effective:** April 26, 2026
**Operator (Processor):** Paid Rightly LLC, 1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States ("we", "us", "our", "Signed Reviews")
**Customer (Controller):** the Business User who has signed up for the Service ("you", "your")

This Data Processing Agreement ("DPA") forms part of the [Terms of Service](/terms/) and applies whenever Signed Reviews processes Personal Data on your behalf in connection with the Service. It is automatically incorporated into the Terms of Service the moment you accept the Terms; no separate signature is required for it to take effect.

If your organization is established in the European Economic Area, the United Kingdom, Switzerland, or another jurisdiction with comparable data-protection laws, this DPA reflects our obligations to you as a processor under those laws (including, where applicable, GDPR Article 28).

---

## 1. Definitions

Capitalized terms used and not defined here have the meaning given in the Terms of Service or, where relevant, in GDPR. Specifically:

- **"Personal Data"** means any information relating to an identified or identifiable natural person that we process on your behalf in connection with the Service.
- **"Processing"** has the meaning set out in GDPR Article 4(2).
- **"Data Subject"** means the individual to whom Personal Data relates — typically your customers (Reviewers) and your team members.
- **"Sub-processor"** means any third party we engage to process Personal Data on your behalf.
- **"Applicable Data Protection Law"** means GDPR, the UK GDPR, the Swiss FADP, the California Consumer Privacy Act and the California Privacy Rights Act, and any other privacy law of equivalent scope applicable to the processing.

---

## 2. Roles

For Personal Data processed in connection with the Service:

- You act as the **controller** (or, where applicable, **business** under CCPA/CPRA).
- We act as the **processor** (or, where applicable, **service provider** under CCPA/CPRA).

For Personal Data we process about you (the Business User account holder) in our capacity as the Service operator — for example, to invoice you under future paid plans or to provide customer support — we act as a controller in our own right; that processing is governed by our [Privacy Policy](/privacy/), not by this DPA.

---

## 3. Scope and duration

This DPA applies to Personal Data we process on your behalf in connection with your use of the Service from the moment you accept the Terms of Service until the later of (a) termination of the Terms or (b) deletion or return of all Personal Data per Section 12 below.

---

## 4. Description of processing (Annex I)

### 4.1 Categories of Data Subjects

- Your customers who receive review-request emails ("Reviewers")
- Reviewers who submit reviews
- Your team members invited to your account

### 4.2 Categories of Personal Data

- Reviewer email address
- Reviewer display name (if provided)
- Reviewer profile picture (if provided)
- Reviewer social-media handle (if provided)
- Stripe charge identifier and transaction metadata (charge ID, amount, currency, card last-4)
- Review content (rating, title, body, photos)
- Team-member email, display name, and OAuth identifiers
- Server logs containing technical metadata (request timestamps, anonymized rate-limit keys)

We do **not** process special-category data (Article 9 GDPR), criminal-conviction data (Article 10 GDPR), or full payment-card numbers.

### 4.3 Nature and purpose of processing

We process Personal Data solely to provide the Service: read Stripe charge metadata, send review-request emails, host signed review-submission links, store cryptographically-signed reviews, render reviews on the public review page and embeddable widget, expose reviews via the Public API, and perform basic operational functions (rate limiting, deliverability suppression, audit logging).

### 4.4 Duration

Personal Data is processed for as long as your account is active, plus the retention windows described in our Privacy Policy. On termination, Section 12 applies.

---

## 5. Your instructions

We will process Personal Data only on your documented instructions. The Terms of Service, this DPA, your account configuration, and any subsequent written instructions you give us through your account or to support@signedreviews.com constitute your instructions.

If we believe an instruction violates Applicable Data Protection Law, we will notify you and may suspend the affected processing until the conflict is resolved.

---

## 6. Confidentiality

Our personnel authorized to process Personal Data are bound by written confidentiality obligations or are under a statutory duty of confidentiality. Access is granted on a need-to-know basis.

---

## 7. Security measures (Annex II)

We implement appropriate technical and organizational measures consistent with GDPR Article 32 and equivalent obligations, including:

- **Encryption in transit:** all traffic to the Service uses TLS 1.2 or higher.
- **Encryption at rest:** sensitive credentials (Stripe API keys, Stripe webhook secrets) are encrypted with AES-256-GCM before being stored. User passwords are hashed with bcrypt (cost factor 12).
- **Access controls:** access to production systems is limited to authorized personnel and protected by strong authentication.
- **Network isolation:** databases are not exposed to the public internet.
- **Logging and monitoring:** application logs exclude payloads containing Personal Data where reasonable; logs are retained on a rolling basis for operational diagnostics.
- **Vulnerability management:** dependencies are tracked and patched; security advisories are reviewed regularly.
- **Backups:** managed automated backups are performed by our cloud provider with at-rest encryption.
- **Incident response:** we maintain procedures to investigate, contain, and remediate suspected security incidents, and to notify affected controllers (Section 10).

We may update these measures over time provided the level of protection is not materially reduced.

---

## 8. Sub-processors

### 8.1 Authorization

You authorize us to engage Sub-processors. The current list of Sub-processors — including the categories of Personal Data each one processes and the country in which it operates — is published at [signedreviews.com/subprocessors/](/subprocessors/) and forms part of this DPA.

### 8.2 Sub-processor obligations

We enter into written contracts with each Sub-processor that impose data-protection obligations no less protective than those in this DPA, and we remain liable to you for the acts and omissions of our Sub-processors in their capacity as Sub-processors of your Personal Data.

### 8.3 Notice of changes

We will give at least **30 days' notice** before adding a new Sub-processor or replacing an existing one. We will publish the change on the Sub-processors page. You may object in writing to legal@signedreviews.com. If we cannot reasonably accommodate your objection, you may terminate the affected portion of the Service for the period after the change takes effect, by giving us written notice.

---

## 9. Data Subject rights

We will assist you, taking into account the nature of the processing, to fulfill your obligation to respond to Data Subject requests under Applicable Data Protection Law (access, rectification, erasure, restriction, portability, objection, and withdrawal of consent). Self-service tools to fulfill many of these rights are available in your account; for requests we cannot fulfill through tooling, write to legal@signedreviews.com and we will respond promptly and in any case within the timelines required by Applicable Data Protection Law.

If a Data Subject contacts us directly with a rights request relating to Personal Data we hold on your behalf, we will not respond on your behalf except to acknowledge receipt and direct the request to you.

---

## 10. Personal Data breach notification

We will notify you of a Personal Data breach affecting your data without undue delay after becoming aware of it, and in any event within **72 hours** where feasible. Our notice will include, to the extent known: the nature of the breach, the categories and approximate number of Data Subjects and records affected, the likely consequences, the measures taken or proposed, and a contact for more information. We will cooperate with you in good faith to fulfill any notification obligations you owe to supervisory authorities or Data Subjects.

---

## 11. Data Protection Impact Assessments

Taking into account the nature of the processing and the information available to us, we will provide reasonable assistance to you in carrying out Data Protection Impact Assessments and prior consultations with supervisory authorities under GDPR Articles 35–36, where the processing is likely to result in a high risk to Data Subjects.

---

## 12. Return or deletion of Personal Data

On termination of the Service, you may within thirty (30) days request that we return or delete Personal Data we hold on your behalf, except to the extent retention is required by applicable law. After this period, we will delete or anonymize remaining Personal Data in accordance with our Privacy Policy and our retention schedule.

For published reviews, our default deletion mechanism is **anonymization**: reviewer display name, profile picture, social handle, and email are removed; the rating, title, body, and cryptographic signature are retained for audit and integrity purposes. This approach is described in our Privacy Policy and protects the integrity of the verified-review record without retaining identifying information.

---

## 13. Audit rights

We will make available to you all information reasonably necessary to demonstrate compliance with this DPA, and will allow for and contribute to audits, including inspections, conducted by you or an auditor mandated by you, no more than once per twelve-month period (unless required more frequently by a supervisory authority or by Applicable Data Protection Law). Audits will be conducted on reasonable advance notice during business hours, will not unreasonably interfere with our operations, and will be subject to confidentiality obligations.

In lieu of an on-site inspection, we may satisfy audit requests by providing recent third-party assessments, technical documentation, or written responses to a reasonable list of questions.

---

## 14. International data transfers

Where you transfer Personal Data to us, or instruct us to transfer Personal Data on your behalf, from the European Economic Area, the United Kingdom, or Switzerland to a country that has not been recognized as providing an adequate level of data protection, the EU Standard Contractual Clauses approved by the European Commission (Decision 2021/914), and/or the UK International Data Transfer Addendum, are incorporated by reference into this DPA. The relevant elections under those Clauses are:

- **Module 2** (Controller-to-Processor) applies between you (data exporter) and us (data importer)
- **Clause 7 (Docking clause):** included
- **Clause 9 (Sub-processor authorization):** Option 2 (general authorization), 30 days' notice as set out in Section 8.3
- **Clause 11(a) (Independent dispute resolution body):** not selected
- **Clause 17 (Governing law):** the law of the Republic of Ireland
- **Clause 18 (Choice of forum):** the courts of the Republic of Ireland
- **Annex I.A (List of parties):** the parties identified in this DPA
- **Annex I.B (Description of transfer):** as described in Section 4
- **Annex II (Technical and organizational measures):** as described in Section 7
- **Annex III (List of Sub-processors):** as published at [signedreviews.com/subprocessors/](/subprocessors/)

---

## 15. Liability

The aggregate liability of each party arising out of or in connection with this DPA, the Standard Contractual Clauses, and Applicable Data Protection Law is subject to the limitation of liability in Section 15 of the Terms of Service, except for liabilities that cannot be limited by law (including direct liabilities to Data Subjects under Article 82 GDPR).

---

## 16. Order of precedence

In the event of any conflict between this DPA and the Terms of Service, this DPA prevails for matters relating to the processing of Personal Data on your behalf. The Standard Contractual Clauses prevail over this DPA where they apply.

---

## 17. Governing law

This DPA is governed by the laws of the State of New Mexico, United States, except where Applicable Data Protection Law or the Standard Contractual Clauses require otherwise.

---

## 18. Contact

For questions about this DPA, data-subject requests, or to exercise audit rights:

- **Email:** legal@signedreviews.com
- **Mail:** Paid Rightly LLC, 1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States
