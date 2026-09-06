# auth.md

You are an agent. Signed Reviews supports **agentic registration** for its public API and content. Follow the steps in order; do not skip ahead.

Base URLs: `https://signedreviews.com` (content), `https://api.signedreviews.com` (API).

## Step 1. Discover

### 1a. Fetch the Protected Resource Metadata

```http
GET https://signedreviews.com/.well-known/oauth-protected-resource
```

Response shape:

```json
{
  "resource": "https://api.signedreviews.com/",
  "resource_name": "Signed Reviews",
  "resource_logo_uri": "https://signedreviews.com/images/SignedReviews_logo_only.png",
  "authorization_servers": ["https://signedreviews.com"],
  "scopes_supported": ["read:reviews", "read:profile", "write:invitations"],
  "bearer_methods_supported": ["header"]
}
```

- `resource`, canonical API URL. Use as `aud` when minting an identity assertion.
- `resource_name` / `resource_logo_uri`, display name and logo. Surface to users for consent.
- `authorization_servers`, base URL of the authorization server.
- `scopes_supported`, scopes the resource server understands.
- `bearer_methods_supported`. Send the access_token as `Authorization: Bearer …`.

### 1b. Fetch the Authorization Server metadata

```http
GET https://signedreviews.com/.well-known/oauth-authorization-server
```

Response shape:

```json
{
  "resource": "https://api.signedreviews.com/",
  "authorization_servers": ["https://signedreviews.com"],
  "scopes_supported": ["read:reviews", "read:profile", "write:invitations"],
  "bearer_methods_supported": ["header"],
  "issuer": "https://signedreviews.com",
  "token_endpoint": "https://api.signedreviews.com/v1/auth/token",
  "grant_types_supported": [
    "urn:ietf:params:oauth:grant-type:jwt-bearer",
    "urn:workos:agent-auth:grant-type:claim"
  ],
  "agent_auth": {
    "skill": "https://signedreviews.com/auth.md",
    "identity_endpoint": "https://api.signedreviews.com/v1/agent/identity",
    "claim_endpoint": "https://api.signedreviews.com/v1/agent/identity/claim",
    "identity_types_supported": ["anonymous", "identity_assertion", "service_auth"],
    "identity_assertion": {
      "assertion_types_supported": [
        "urn:ietf:params:oauth:token-type:id-jag"
      ]
    },
    "events_supported": [
      "https://schemas.workos.com/events/agent/auth/identity/assertion/revoked"
    ]
  }
}
```

- `issuer`, canonical issuer URL. Validate the `iss` claim against this.
- `token_endpoint`, where you exchange an identity assertion for an access_token (Step 5).
- `grant_types_supported`, `jwt-bearer` for identity assertion exchange, `claim` for claim ceremony polling.
- `agent_auth.skill`, the URL of this document.
- `agent_auth.identity_endpoint`, where you POST to register (Step 3).
- `agent_auth.claim_endpoint`, where you POST the claim invite and poll for completion.
- `agent_auth.identity_types_supported`, registration methods this service accepts.
- `agent_auth.identity_assertion.assertion_types_supported`, assertion types accepted (currently ID-JAG).
- `agent_auth.events_supported`, event schemas ingested. Informational.

## Step 2. Pick a method

Use this decision tree:

1. **You have a session tied to a user identity and can exchange it for an ID-JAG, audience-bound to this service** → `identity_assertion` + id-jag.
2. **You have only the user's email** → `service_auth`. Claims ceremony required.
3. **You have neither** → `anonymous`. Access to public content only; claim ceremony optional for upgrades.

## Step 3. Register

### identity_assertion + id-jag

Mint the ID-JAG with `aud` = the `resource` from Step 1a, fresh `jti`, near-term `exp` (≤5 minutes), and `auth_time` (epoch seconds of last user authentication).

```http
POST https://api.signedreviews.com/v1/agent/identity
Content-Type: application/json

{
  "type": "identity_assertion",
  "assertion_type": "urn:ietf:params:oauth:token-type:id-jag",
  "assertion": "<your ID-JAG JWT>"
}
```

### service_auth

```http
POST https://api.signedreviews.com/v1/agent/identity
Content-Type: application/json

{
  "type": "service_auth",
  "login_hint": "user@example.com"
}
```

Response includes `user_code` and `verification_uri` for the claim ceremony.

### anonymous

```http
POST https://api.signedreviews.com/v1/agent/identity
Content-Type: application/json

{
  "type": "anonymous"
}
```

Returns a public-scope `identity_assertion` immediately. No user identity is asserted. Use for unauthenticated read access (public reviews, profiles, content).

## Step 4. Claim (service_auth and anonymous only)

When the user wants to claim an anonymous registration or complete a service_auth ceremony:

```http
POST https://api.signedreviews.com/v1/agent/identity/claim
Content-Type: application/json

{
  "claim_token": "<claim_token from registration>",
  "email": "user@example.com"
}
```

Response includes `user_code` and `verification_uri`. Surface these to the user. The user visits `verification_uri`, signs in via email magic link, and enters `user_code`.

Poll for completion:

```http
GET https://api.signedreviews.com/v1/agent/identity/claim/view?claim_token=<claim_token>
```

While pending, the response is `{ "status": "pending" }`. On completion, status is `"claimed"` with an updated `identity_assertion`.

## Step 5. Exchange for access_token

Once you have an `identity_assertion` from Step 3:

```http
POST https://api.signedreviews.com/v1/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer
&assertion=<your identity_assertion JWT>
```

Response:

```json
{
  "access_token": "sk_agent_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:reviews read:profile"
}
```

## Step 6. Use the API

```http
GET https://api.signedreviews.com/v1/public/{slug}/reviews
Authorization: Bearer sk_agent_...
```

For unauthenticated public access (anonymous agents), the Public API also accepts publishable keys (`pk_...`) and supports CORS for browser-based agents:

```http
GET https://api.signedreviews.com/v1/public/{slug}/reviews
Authorization: Bearer pk_live_...
```

## Step 7. Handle revocation

The authorization server may revoke tokens. If you receive a 401 with `error="invalid_token"`:

```http
POST https://api.signedreviews.com/v1/auth/revoke
Content-Type: application/x-www-form-urlencoded

token=<access_token>
```

Re-register from Step 3 to get a fresh token.

## Additional agent resources

- **Markdown for Agents:** `Accept: text/markdown` on any signedreviews.com page
- **LLMs.txt:** `https://signedreviews.com/llms.txt`
- **Agent Skills:** `https://signedreviews.com/.well-known/agent-skills/index.json`
- **OpenAPI spec:** `https://signedreviews.com/openapi.json`
- **Web Bot Auth JWKS:** `https://signedreviews.com/.well-known/http-message-signatures-directory`

## Stripe OAuth (merchant account connection)

Businesses connecting their Stripe account use Stripe's standard OAuth 2.0 flow at `https://connect.stripe.com/oauth/authorize`. This is a separate flow from agent authentication and is not relevant to agent access, agents connect to the Signed Reviews API, not to individual merchant Stripe accounts.

## Security

Email `security@signedreviews.com`. Do not disclose vulnerabilities publicly.
