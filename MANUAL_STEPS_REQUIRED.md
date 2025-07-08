# Manual Steps Required for Deployment

## GitHub Secrets Setup

The following secret needs to be added manually to the GitHub repository:

### Required Action: Add APP_POSTGRES_PASSWORD Secret

**Status: ⏳ PENDING USER ACTION**

1. **Navigate to GitHub Repository Settings:**

   - Go to your GitHub repository
   - Click "Settings" tab
   - In left sidebar: "Secrets and variables" → "Actions"

2. **Add New Secret:**

   - Click "New repository secret"
   - **Name:** `APP_POSTGRES_PASSWORD`
   - **Value:** Generate a strong password (see guidelines below)
   - Click "Add secret"

3. **Password Requirements:**

   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - URL-safe (avoid `@`, `:`, `/`, `?`, `#`, `[`, `]`)
   - Different from existing `POSTGRES_PASSWORD`
   - **Example format:** `MyApp2025$ecure!Pass`

4. **Verification:**
   - After adding, the secret should appear in the list
   - The deployment workflow will use this for the `app_user` database account

**Why this is needed:**

- Creates secure database isolation between Temporal and application data
- The `app_user` will only have access to `app_db`, not Temporal databases
- Required for the deployment workflow password substitution step

**Next Steps:**
Once you've added this secret to GitHub, the deployment workflow will automatically:

- Substitute the password in `docker/postgres/init.sql`
- Create the `app_user` with this password
- Use it in `APP_DATABASE_URL` for application connections

---

_Last updated: January 2025_
