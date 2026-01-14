# OIDC Authentication Implementation Plan

## Overview
Add OIDC login with **Google** and **Apple** providers. OIDC logins will link to existing users by email matching, or create new users if no match exists. The existing dropdown-based user selection remains functional.

## Providers
- **Google** - Standard OIDC, straightforward setup
- **Apple** - Standard OIDC, requires Apple Developer account and HTTPS
- ~~Facebook~~ - Skipped (no OIDC support, can add later with custom OAuth)

---

## Implementation Steps

### 1. Database Schema

**Add new table `oidc_identities`** in `backend/data/db_schema.py`:
```python
class OIDCIdentity(Base):
    __tablename__ = "oidc_identities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"))
    provider: Mapped[str] = mapped_column(String(50))  # "google", "apple"
    subject_id: Mapped[str] = mapped_column(String(255))  # 'sub' claim
    email: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("provider", "subject_id"),)
```

**Update User model** - add relationship back to OIDCIdentity

**Create Alembic migration**: `alembic revision --autogenerate -m "add_oidc_identities"`

### 2. Environment Variables

Add to `.env`:
```bash
# Google OAuth (from Google Cloud Console)
SSO_GOOGLE_ID=your-client-id.apps.googleusercontent.com
SSO_GOOGLE_SECRET=your-client-secret

# Apple OAuth (from Apple Developer Portal)
SSO_APPLE_ID=your-service-id
SSO_APPLE_SECRET=your-private-key
```

### 3. Backend Auth Service

**Create `backend/auth/oidc_service.py`**:
- `handle_oidc_login(openid: OpenID) -> UserID` function that:
  1. Checks if OIDC identity exists → return linked user_id
  2. Checks if email matches existing user → link identity, return user_id
  3. Creates new user with generated username → link identity, return user_id

### 4. Backend Routes

**Update `backend/devserver.py`**:
```python
from fastapi_simple_oidc import OIDC

oidc = OIDC(secret_key=env.FLASK_SECRET_KEY, redirect_url='/api/auth/post-login')

@oidc.on_login
async def on_login(openid: OpenID):
    await handle_oidc_login(openid)

app.include_router(oidc.router, prefix="/api/auth")
```

**Create `backend/routes/auth_routes.py`**:
- `GET /api/auth/post-login` - Called after OIDC callback, sets `activeUserId` cookie
- `POST /api/auth/logout` - Clears both OIDC session and app cookies

### 5. Frontend Changes

**Update `src/features/app_header/LoginMenu.tsx`**:
- Add "Sign in with Google" and "Sign in with Apple" buttons
- Buttons link to `/api/auth/google/login` and `/api/auth/apple/login`
- Add provider icons (MUI or custom SVG)

**Update `src/features/userModal/UserProfile.tsx`**:
- Show linked OIDC providers (optional enhancement)
- Update logout to call `/api/auth/logout`

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `backend/data/db_schema.py` | Add OIDCIdentity model |
| `backend/devserver.py` | Initialize OIDC, include router |
| `backend/auth/oidc_service.py` | New file - login handling logic |
| `backend/routes/auth_routes.py` | New file - post-login redirect, logout |
| `src/features/app_header/LoginMenu.tsx` | Add OIDC login buttons |
| `.env` / `.env.example` | Add SSO_GOOGLE_*, SSO_APPLE_* vars |
| `alembic/versions/` | New migration for oidc_identities table |

---

## OAuth Flow

```
User clicks "Sign in with Google"
    → /api/auth/google/login
    → Google authorization
    → /api/auth/google/callback (handled by library)
    → on_login callback saves OIDC identity
    → Redirect to /api/auth/post-login
    → Set activeUserId cookie from session
    → Redirect to / (home page)
```

---

## Session Handling

- `fastapi_simple_oidc` uses cookie name `sso_session` (no conflict with existing `session`)
- After OIDC login, we read user from `sso_session` and set our `activeUserId` cookie
- Existing dropdown login continues to work unchanged

---

## Verification

1. **Database**: Run migration, verify `oidc_identities` table created
2. **Backend**: Start dev server, visit `/api/auth/.test` to see provider list
3. **Google login**:
   - Click Google button → redirects to Google
   - After auth → redirects back with cookie set
   - Check database for new OIDC identity record
4. **Email linking**: Login with OIDC using email that matches existing user → verify linking
5. **New user**: Login with new email → verify user created
6. **Logout**: Click logout → verify both sessions cleared
7. **Backward compat**: Verify dropdown user selection still works

---

## Provider Setup Requirements

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application type)
3. Add redirect URI: `http://localhost:8000/api/auth/google/callback` (dev)
4. Copy Client ID and Secret to `.env`

### Apple
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a Service ID (not App ID)
3. Enable "Sign in with Apple"
4. Add redirect URI (requires HTTPS, even for testing)
5. Generate private key for client secret
6. Note: Can defer Apple until production HTTPS is available
