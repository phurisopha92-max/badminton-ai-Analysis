# Auth Testing Playbook

## Step 1: Create Test User & Session
```bash
cd /app/backend && python3 -c "
from pymongo import MongoClient
import os
from datetime import datetime, timezone, timedelta
import uuid

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'badminton_ai')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

user_id = f'test-user-{uuid.uuid4().hex[:12]}'
session_token = f'test_session_{uuid.uuid4().hex}'

db.users.insert_one({
    'user_id': user_id,
    'email': f'test.user.{uuid.uuid4().hex[:8]}@example.com',
    'name': 'Test User',
    'picture': 'https://via.placeholder.com/150',
    'created_at': datetime.now(timezone.utc)
})

db.user_sessions.insert_one({
    'user_id': user_id,
    'session_token': session_token,
    'expires_at': datetime.now(timezone.utc) + timedelta(days=7),
    'created_at': datetime.now(timezone.utc)
})

print(f'Session token: {session_token}')
print(f'User ID: {user_id}')
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```python
# Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://your-app.preview.emergentagent.com")
```

## Checklist
- [ ] User document has user_id field
- [ ] Session user_id matches user's user_id
- [ ] All queries use `{"_id": 0}` projection
- [ ] /api/auth/me returns user data
- [ ] Dashboard loads without redirect
- [ ] CRUD operations work with user filtering
