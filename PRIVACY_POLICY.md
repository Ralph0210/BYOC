# Privacy Policy 🛡️

**Last Updated:** December 27, 2025

At BYOC, we believe that your habits and personal challenges are yours alone. This document outlines exactly what data we collect, why we collect it, and how we protect it.

## 1. Our Privacy Philosophy

We operate on a **"Data Minimization"** principle. We only store the absolute minimum information required to make the application function (syncing your challenges across devices). We do not sell your data, we do not show ads, and we do not track your activity on other sites.

## 2. Data We Collect

### A. Authentication Data

When you sign in with Google, we receive basic profile information to create your account:

- **Email Address**: Used as your unique identifier.
- **Display Name**: Used to greet you in the app.
- **Profile Picture**: Used for your avatar.

_We use **Supabase Authentication** to handle this securely. We never see or store your Google password._

### B. User-Provided API Keys

If you choose to use the AI features, you may look to provide your own API key (OpenAI, Anthropic, or Gemini).

- **Encryption**: Your API key is **encrypted** before it is saved to our database.
- **Security**: We use industry-standard encryption algorithms (AES-256) to ensure your key is unreadable to anyone else, including our administrators.
- **Your Control**: You can delete or update your stored key at any time from the settings menu.

### C. App Content

To provide the habit-tracking service, we store the data you create:

- **Challenges**: Names, descriptions, dates, and rewards.
- **Tasks**: Frequencies, icons, and colors.
- **Completion History**: Which tasks you checked off and when.

## 3. How We Store Your Data

Your data is stored in a hosted PostgreSQL database managed by **Supabase**. We employ strict security measures:

- **Row Level Security (RLS)**: This is a database-level security policy that physically prevents any user from reading or writing data that doesn't belong to them. Even if someone queried the API directly, the database would reject the request if they are not authenticated as you.
- **Encryption**: Data is encrypted in transit (expect HTTPS) and at rest by our cloud provider.

## 4. How We Use Your Data

We use your data strictly for **functional purposes**:

1.  **Syncing**: To ensure your progress is the same on your phone and laptop.
2.  **Calculation**: To compute your "Score", "Journey Progress", and "Streaks".

## 5. Third-Party Services

We rely on trusted infrastructure providers:

- **Supabase**: Backend-as-a-Service (Database & Auth). [Read Supabase Privacy Policy](https://supabase.com/privacy)
- **Vercel**: Hosting provider for the application frontend.

## 6. Your Rights

You own your data. You have the right to:

- **Access**: View all data associated with your account within the app.
- **Delete**: You can request full account deletion. This will permanently wipe all your challenges, tasks, and history from our database.

## 7. Contact

If you have questions about this policy or your data, please contact the developer via the GitHub repository issues page.
