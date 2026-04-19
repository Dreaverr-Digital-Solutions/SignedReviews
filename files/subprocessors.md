# Sub-processors

**Last updated:** April 19, 2026

This page lists the third-party service providers ("sub-processors") that Paid Rightly LLC uses to provide Signed Reviews. Each sub-processor is contractually required to use personal data only to provide services to us and to maintain appropriate security safeguards.

We may update this list from time to time. Material additions will be reflected by updating the "Last updated" date. We recommend checking this page periodically.

---

## Core infrastructure

| Sub-processor | Purpose | Data categories | Location |
|---|---|---|---|
| **Railway** | Cloud hosting and managed PostgreSQL database | All Service data at rest | United States |
| **Cloudinary** | Image hosting for review photos and business brand assets | User-uploaded images (review photos, logos) | United States |
| **Stripe** | Payment-related webhooks and OAuth for business Stripe connections | Business Stripe credentials; transaction metadata (charge ID, customer email, card last-4, amount, currency) | United States |
| **Resend** | Transactional email delivery | Recipient email addresses; email content (verification links, magic links, team invitations, review-request emails) | United States |

---

## AI services

| Sub-processor | Purpose | Data categories | Notes |
|---|---|---|---|
| **Anthropic** | AI logo extraction during business brand onboarding (Claude Haiku with vision) | Public website HTML and candidate logo images provided by the business during brand setup | **Not used on reviews, reviewer data, or payment data.** Anthropic does not train on data sent through its API under its commercial terms. |

---

## OAuth providers (only when used)

These sub-processors receive data only when a user chooses to log in or attach a profile using that provider. If you do not use a given provider, no data is shared with it.

| Sub-processor | Used for | Data exchanged |
|---|---|---|
| **Google** | Business login (SSO); reviewer profile attachment | OAuth sub, email, name, profile picture |
| **GitHub** | Business login (SSO); reviewer profile attachment | OAuth ID, verified email, name/username, avatar URL |
| **LinkedIn** | Business login (SSO); reviewer profile attachment | OAuth sub, email, name, profile picture |
| **Microsoft** | Business login (SSO) | OAuth ID, email, display name |
| **Facebook** | Reviewer profile attachment | Facebook ID, name, profile picture |
| **Instagram** | Reviewer profile attachment | Instagram handle, name, profile picture (via Facebook OAuth) |
| **Twitter / X** | Reviewer profile attachment | Twitter/X ID, name, username, profile picture |

---

## Specialized services

| Sub-processor | Purpose | Data categories | Notes |
|---|---|---|---|
| **Decodo** | Proxy service used to retrieve public Instagram profile data (profile picture and display name) during the reviewer profile attachment flow | Instagram profile URL (public); IP address of our backend server | Used only when a reviewer selects Instagram as their profile source and the direct OAuth path is unavailable. |
| **Gravatar** | Check whether a reviewer's email address has an associated Gravatar image | MD5 hash of email address | Used only when a reviewer chooses the Gravatar avatar option. We do not store Gravatar images. |

---

## Sub-processors we do not use

For transparency, we want to be clear about services we **do not** use as of the date above:

- **No analytics platforms** (no Google Analytics, Mixpanel, Amplitude, Segment, PostHog, Plausible, Heap, or similar)
- **No advertising networks**
- **No session replay tools** (no FullStory, Hotjar, LogRocket, or similar)
- **No error tracking services with PII access** (no Sentry, Datadog, Rollbar, or similar at this time)
- **No marketing email platforms** (no Mailchimp, HubSpot, ActiveCampaign, or similar — we use Resend only for transactional email)
- **No customer data platforms or enrichment services**
- **No cross-site tracking cookies or fingerprinting**

---

## Changes to this list

When we add a new sub-processor or change how an existing one is used in a way that materially affects personal data processing, we will:

1. Update this page and the "Last updated" date above
2. For material additions affecting business users or reviewers, provide notice through the Service or by email when practicable

You can request notification of future changes by emailing **legal@signedreviews.com** with the subject line "Sub-processor updates."

---

## Contact

Questions about sub-processors or how your data flows through them:

**Email:** legal@signedreviews.com
**Mail:** Paid Rightly LLC, 1209 Mountain Road Pl NE, Ste N, Albuquerque, NM 87110, United States
