# GitHub Secrets Configuration for Production Deployment

This document outlines the required GitHub repository secrets for the Temporal production deployment workflow.

## Security Approach

**✅ Secure Environment Variable Injection**: This deployment uses Docker Compose's native environment variable support instead of file-based secret replacement. Sensitive values are passed directly as environment variables during deployment, avoiding:

- File-based secret storage on the server
- Brittle string replacement that can break with special characters
- Temporary files containing secrets on disk
- Risk of secrets being logged or exposed in file operations

**🔒 How it works**: GitHub secrets are exported as environment variables in the deployment script and passed directly to Docker Compose commands, ensuring secrets never touch the filesystem in plain text.

## Required Secrets

### Server Access

These secrets are required for SSH access to the Hetzner server:

#### `HETZNER_SSH_PRIVATE_KEY`

- **Type**: SSH Private Key
- **Description**: Private SSH key for accessing the Hetzner server
- **Format**: Complete SSH private key including headers
- **Example**:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAlwAAAAdzc2gtcn
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```

#### `HETZNER_SSH_USER`

- **Type**: String
- **Description**: SSH username for the Hetzner server
- **Example**: `root` or `deploy`

#### `HETZNER_SERVER_HOST`

- **Type**: String
- **Description**: Hostname or IP address of the Hetzner server
- **Example**: `your-server.hetzner.cloud` or `192.168.1.100`

### Database Configuration

#### `POSTGRES_PASSWORD`

- **Type**: String
- **Description**: PostgreSQL database password for Temporal and application data
- **Requirements**: Strong password (12+ characters, mixed case, numbers, symbols)
- **Example**: `Temp0ral_Pr0d_DB_2024!`

### Temporal Configuration

#### `TEMPORAL_UI_PASSWORD`

- **Type**: String
- **Description**: Password for HTTP Basic Auth protection of Temporal Web UI
- **Requirements**: Strong password for web UI access
- **Example**: `T3mp0ral_UI_Access_2024!`

### External Service Integration

#### `INSTAGRAM_APP_ID`

- **Type**: String
- **Description**: Instagram API App ID
- **Source**: Instagram Developer Console
- **Example**: `1234567890123456`

#### `INSTAGRAM_APP_SECRET`

- **Type**: String
- **Description**: Instagram API App Secret
- **Source**: Instagram Developer Console
- **Security**: Keep secret, never expose in logs

#### `INSTAGRAM_ACCESS_TOKEN`

- **Type**: String
- **Description**: Instagram API Access Token
- **Source**: Instagram API authentication flow
- **Note**: May need periodic renewal

#### `FIREBASE_CONFIG`

- **Type**: JSON String
- **Description**: Firebase configuration JSON
- **Source**: Firebase Console → Project Settings → General → Your apps → Firebase SDK snippet
- **Example**:
  ```json
  {
    "apiKey": "AIzaSyExample...",
    "authDomain": "project.firebaseapp.com",
    "projectId": "project-id",
    "storageBucket": "project.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abcdef"
  }
  ```

#### `GCP_PROJECT_ID`

- **Type**: String
- **Description**: Google Cloud Platform Project ID
- **Source**: GCP Console
- **Example**: `my-temporal-project`

#### `GCP_SERVICE_ACCOUNT_KEY`

- **Type**: JSON String
- **Description**: GCP Service Account credentials in JSON format
- **Source**: GCP Console → IAM & Admin → Service Accounts → Create Key
- **Format**: Complete JSON service account key file content
- **Example**:
  ```json
  {"type":"service_account","project_id":"project","private_key_id":"key_id","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"service@project.iam.gserviceaccount.com"...}
  ```

## Setting Up Secrets in GitHub

### Step 1: Access Repository Settings

1. Navigate to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Repository Secrets

For each secret listed above:

1. Click **New repository secret**
2. Enter the secret name exactly as shown (case-sensitive)
3. Paste the secret value
4. Click **Add secret**

### Step 3: Verify Secrets

After adding all secrets, you should see:

- ✅ `HETZNER_SSH_PRIVATE_KEY`
- ✅ `HETZNER_SSH_USER`
- ✅ `HETZNER_SERVER_HOST`
- ✅ `POSTGRES_PASSWORD`
- ✅ `TEMPORAL_UI_PASSWORD`
- ✅ `INSTAGRAM_APP_ID`
- ✅ `INSTAGRAM_APP_SECRET`
- ✅ `INSTAGRAM_ACCESS_TOKEN`
- ✅ `FIREBASE_CONFIG`
- ✅ `GCP_PROJECT_ID`
- ✅ `GCP_SERVICE_ACCOUNT_KEY`

## SSH Key Generation

If you need to generate a new SSH key pair for the Hetzner server:

### Generate Key Pair

```bash
# Generate ED25519 key pair (recommended)
ssh-keygen -t ed25519 -f ~/.ssh/hetzner_deploy_key -C "github-actions-deploy"

# Or generate RSA key pair (if ED25519 not supported)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/hetzner_deploy_key -C "github-actions-deploy"
```

### Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/hetzner_deploy_key.pub user@your-server.hetzner.cloud

# Or manually add to authorized_keys
cat ~/.ssh/hetzner_deploy_key.pub >> ~/.ssh/authorized_keys
```

### Add Private Key to GitHub

```bash
# Display private key for copying to GitHub secret
cat ~/.ssh/hetzner_deploy_key
```

## Environment Configuration

### Production Environment Setup

The deployment workflow will automatically:

1. Copy `.env.production` template to the server
2. Replace placeholder values with actual secrets
3. Create `.env.production.local` with real configuration

### Environment Variables Mapping

| Placeholder in `.env.production`     | GitHub Secret            | Purpose                      |
| ------------------------------------ | ------------------------ | ---------------------------- |
| `your_secure_postgres_password_here` | `POSTGRES_PASSWORD`      | Database authentication      |
| `your_secure_ui_password_here`       | `TEMPORAL_UI_PASSWORD`   | Temporal UI protection       |
| `your_instagram_app_id`              | `INSTAGRAM_APP_ID`       | Instagram API access         |
| `your_instagram_app_secret`          | `INSTAGRAM_APP_SECRET`   | Instagram API authentication |
| `your_instagram_access_token`        | `INSTAGRAM_ACCESS_TOKEN` | Instagram API token          |
| `your_firebase_config_json`          | `FIREBASE_CONFIG`        | Firebase integration         |
| `your_gcp_project_id`                | `GCP_PROJECT_ID`         | Google Cloud Platform        |

## Security Best Practices

### Secret Management

- ✅ Use strong, unique passwords for all secrets
- ✅ Rotate secrets periodically (especially access tokens)
- ✅ Limit server SSH access to specific IP ranges if possible
- ✅ Use principle of least privilege for service accounts
- ❌ Never commit secrets to version control
- ❌ Never share secrets via insecure channels

### Server Security

- ✅ Keep Hetzner server OS updated
- ✅ Configure firewall (UFW) to limit port access
- ✅ Use SSH key authentication only (disable password auth)
- ✅ Consider using SSH jump host/bastion for additional security

### Monitoring

- ✅ Monitor deployment logs for suspicious activity
- ✅ Set up alerts for failed deployments
- ✅ Regularly audit server access logs
- ✅ Monitor resource usage and costs

## Troubleshooting

### Common Issues

#### SSH Connection Failed

```
ssh: connect to host server.hetzner.cloud port 22: Connection refused
```

**Solutions:**

- Verify `HETZNER_SERVER_HOST` is correct
- Ensure SSH service is running on server
- Check server firewall settings
- Verify SSH key is correctly formatted

#### Authentication Failed

```
ssh: Permission denied (publickey)
```

**Solutions:**

- Verify `HETZNER_SSH_PRIVATE_KEY` secret is complete and correctly formatted
- Ensure public key is in server's `~/.ssh/authorized_keys`
- Check SSH key permissions on server

#### Deployment Timeout

```
timeout: postgresql health check failed
```

**Solutions:**

- Verify `POSTGRES_PASSWORD` secret is set correctly
- Check server resources (memory, disk space)
- Review PostgreSQL container logs

### Getting Help

If you encounter issues:

1. Check GitHub Actions workflow logs
2. Review server logs: `ssh user@server 'cd /opt/instagram-video-downloader && docker compose logs'`
3. Verify all secrets are set correctly
4. Check server resource usage
5. Consult [deployment troubleshooting guide](deployment-troubleshooting.md)

## Next Steps

After configuring secrets:

1. ✅ Push code to `main` branch to trigger deployment
2. ✅ Monitor deployment progress in GitHub Actions
3. ✅ Verify services are running on the server
4. ✅ Test application endpoints
5. ✅ Set up monitoring and alerting
