## Data Collection

This extension does **not** collect, store, or transmit any personal information or browsing history.

## What the Extension Does

### 1. Page scanning (local only)

The extension reads the HTML of the page you're currently viewing to detect known review platform signatures (e.g., Trustpilot widgets, SignedReviews badges, JSON-LD review schema). This scanning happens entirely inside your browser. No page content is sent anywhere.

### 2. API calls (only when a SignedReviews badge is detected)

If the page contains a SignedReviews badge, the extension fetches public aggregate review statistics (average rating, review count, rating distribution) from the SignedReviews API. The API key used is the business's public widget key found in the page's HTML — it is not a user key. These API calls return only aggregate numbers, never individual reviews or personal data.

## Data Storage

Detection results (platform name and trust tier) are stored temporarily in the browser's memory while the tab is open. This data is cleared when the tab is closed or navigated away. Nothing is written to disk or persisted between sessions.

## Third-Party Services

The only external request this extension makes is to the **SignedReviews Badge API** (`api.signedreviews.com/api/badge/*`) — and only when a SignedReviews badge is present on the current page. These requests contain no user-identifiable information.

## Permissions

- **`activeTab`** — to read the current page's DOM for review platform detection
- **`<all_urls>` host permission** — to inject the content script on every page you visit (so detection works everywhere) and to allow the service worker to call the SignedReviews API

## Contact

For questions about this privacy policy, contact: **[billing@dreaverr.com](mailto:billing@dreaverr.com)**

## Changes

We will post any privacy policy changes on this page.

---

This extension is published by **SignedReviews** ([signedreviews.com](https://signedreviews.com)).
