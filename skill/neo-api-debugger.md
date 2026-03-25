---
name: neo-api-debugger
description: >
  Discover hidden APIs on any website and generate multi-language callable API documentation.
  Use when: user wants to call a website's API that has no official API,
  automate web interactions via API instead of browser automation,
  generate API documentation from real traffic.
metadata:
  openclaw:
    requires:
      bins: [neo]
    install:
      - id: neo
        kind: node
        package: "@4ier/neo"
        bins: [neo]
        label: "Install Neo CLI (npm)"
triggers:
  - discover API
  - find hidden API
  - generate API code
  - website API documentation
  - call website API
---

# Neo API Debugger

## ⚠️ MANDATORY FIRST STEP

Always begin with `neo doctor` to verify Chrome + Neo extension are functional:

```bash
neo doctor
```

- All ✓ → proceed
- Chrome CDP ✗ → `neo start` (launches Chrome with correct profile + CDP)
- Still ✗ → tell the user and STOP. Don't retry in a loop.

### Critical Rules

1. **NEVER start Chrome manually** — always `neo start`
2. **NEVER copy Chrome profiles** — login sessions live in the real profile
3. **NEVER `pkill chrome`** — user may have important tabs open
4. **If stuck → tell user, STOP.** Don't retry in a loop.

## Workflow: Discover APIs for a Website

Use this workflow when you need to discover and document a website's hidden APIs.

### Phase 1: Initialize

```bash
neo doctor
```

### Phase 2: Open and Capture

```bash
# Open the target website in Chrome
neo open https://x.com

# In another terminal, watch real-time API traffic
neo capture watch x.com
```

### Phase 3: User Action

Ask the user to perform typical operations in the browser:
- Log in if needed
- Perform the actions whose API calls you want to capture (post, search, etc.)

### Phase 4: Analyze Captures

```bash
# List all captured API calls for the domain
neo capture list x.com --limit 50

# Search for specific API patterns
neo capture search "CreateTweet" --method POST

# View full capture details
neo capture detail <capture-id>
```

### Phase 5: Export and Replay

```bash
# Export captures as HAR 1.2 (for Postman/Charles/devtools)
neo capture export x.com --format har > x-api.har

# Export as JSON
neo capture export x.com > x-captures.json

# Replay a captured call (with auto-detected auth)
neo replay <capture-id> --tab x.com --auto-headers
```

### Phase 6: Generate Schema

```bash
# Generate API schema from captures
neo schema generate x.com

# Display the schema
neo schema show x.com

# Export as OpenAPI spec
neo schema openapi x.com
```

## Code Generation Templates

After discovering an API endpoint, generate multi-language code examples:

### Python (requests)

```python
import requests

url = "https://api.example.com/endpoint"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
}
data = {
    "key": "value"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.example.com/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    key: 'value'
  })
});
const data = await response.json();
console.log(data);
```

### TypeScript

```typescript
interface ApiResponse {
  // Define response type based on capture
}

const response = await fetch('https://api.example.com/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    key: 'value'
  })
});
const data: ApiResponse = await response.json();
console.log(data);
```

### Go (net/http)

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    data := map[string]string{"key": "value"}
    jsonData, _ := json.Marshal(data)

    req, _ := http.NewRequest("POST", "https://api.example.com/endpoint", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer <token>")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

### cURL

```bash
curl -X POST 'https://api.example.com/endpoint' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"key":"value"}'
```

## Complete Example: Discover X.com Tweet API

User: "帮我发现 x.com 的 API，然后生成 Python 代码来发推文"

AI Response:

1. First, verify Neo is working:
```bash
neo doctor
```

2. Open X.com in Chrome:
```bash
neo open https://x.com
```

3. Start watching API traffic:
```bash
neo capture watch x.com
```

4. Ask user to log in and post a tweet in the browser.

5. After user performs the action, list captures:
```bash
neo capture list x.com --limit 20
```

6. Find the tweet creation API:
```bash
neo capture search "CreateTweet" --method POST
```

7. View the capture details:
```bash
neo capture detail <tweet-create-id>
```

8. Generate the schema:
```bash
neo schema generate x.com
```

9. Based on captured data, generate Python code:

```python
import requests

# Post a tweet on X.com
url = "https://x.com/i/api/graphql/.../CreateTweet"

headers = {
    "Content-Type": "application/json",
    "X-CSRF-Token": "<auto-injected>",
    "Authorization": "Bearer <token>"
}

data = {
    "variables": {
        "tweet_text": "Hello from Neo!",
        "dark_reply": False,
        "media": {"media_entities": [], "possibly_sensitive": False}
    }
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

10. Present the complete documentation to the user.

## Decision Tree

```
Want to discover and use a website's API?
  │
  ├─ FIRST: neo doctor
  │   ├─ All ✓ → continue
  │   ├─ Chrome ✗ → neo start → retry
  │   └─ Still ✗ → ask user, STOP
  │
  ├─ Open target website?
  │   └─ neo open https://example.com
  │
  ├─ Watch live traffic?
  │   └─ neo capture watch <domain>
  │
  ├─ List captured APIs?
  │   └─ neo capture list <domain> --limit N
  │
  ├─ Search captures?
  │   └─ neo capture search "<keyword>" --method POST
  │
  ├─ View capture details?
  │   └─ neo capture detail <capture-id>
  │
  ├─ Generate API schema?
  │   └─ neo schema generate <domain>
  │
  ├─ Export as OpenAPI?
  │   └─ neo schema openapi <domain> > api.yaml
  │
  ├─ Export as HAR (Postman/Charles)?
  │   └─ neo capture export <domain> --format har > api.har
  │
  ├─ Export as JSON?
  │   └─ neo capture export <domain> > captures.json
  │
  ├─ Replay a captured call?
  │   └─ neo replay <capture-id> --tab <domain> --auto-headers
  │
  └─ Test an API call?
      └─ neo exec <url> --method POST --body '{}' --tab <domain> --auto-headers
```

## Key Principles

1. **`neo doctor` first, always.**
2. **API > UI automation.** If schema has it, use `neo api`. Don't snapshot+click.
3. **Auth is automatic.** API calls inherit browser cookies/session/CSRF.
4. **Close tabs after use.** Every `neo open` creates a new tab.
5. **If stuck, stop.** Don't loop on Chrome startup. Ask the user.
6. **Capture first, generate second.** User must perform actions to generate captures.
7. **Document the full endpoint.** Include URL, headers, body, and response structure.

## Implementation Notes

### Security: Auth Header Redaction

Authentication headers (Bearer tokens, CSRF tokens, cookies, session IDs) are **redacted at capture time** for security. IndexedDB stores only header *names*, not values.

When executing API calls:
- Use `neo exec --auto-headers` to fetch **live auth from browser** in real-time via CDP
- Never replay stored credentials — they are already redacted

### Storage Limits

- **Per-domain cap:** 500 captures maximum per domain
- **Oldest-first cleanup:** When cap is reached, oldest captures are automatically deleted
- **Response truncation:** Response bodies capped at 100KB

### Export Formats

| Format | Command | Use Case |
|--------|---------|----------|
| HAR 1.2 | `neo capture export --format har` | Postman, Charles, DevTools |
| JSON | `neo capture export` | Scripting, analysis |
| OpenAPI 3.0 | `neo schema openapi` | Swagger, API documentation |
