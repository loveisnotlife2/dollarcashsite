# DollarCash Local Investments

Create a modern, ultra-responsive, mobile-first Local Investment & Earning Web Application named "DollarCash" (Domain: dollarcash.site).



### 1. Branding, Theme & UI:

- Display a professional "DollarCash" logo with a sleek, premium Fintech/Local Banking theme (Forest Green, Gold, and Deep Navy palette). NO crypto icons, blockchain references, or coin graphics.

- Include a Dark / Light Mode Toggle Switch in the top navigation header.

- Clean cards, modern typography, and high-contrast readable text in both light and dark modes.



### 2. Investment Plans & Expiry Logic:

Display clear investment plan cards on the user dashboard:

- Plan 1: Cost $1.00 | Daily Return $0.15 | Validity 15 Days | Total Return $2.25

- Plan 2: Cost $2.00 | Daily Return $0.25 | Validity 15 Days | Total Return $3.75

- Plan 3: Cost $5.00 | Daily Return $0.50 | Validity 15 Days | Total Return $7.50

- Plan 4: Cost $10.00 | Daily Return $1.00 | Validity 15 Days | Total Return $15.00

- Plan Expiry Rules: Automatically mark plan as "EXPIRED" after exactly 15 days from activation time.

- Daily Profit Distribution: Automate a cron job logic / timer to credit daily returns to the user wallet balance every night at 12:00 AM (Midnight PKT).



### 3. Paid Member Restricted Daily Task System:

- Include a "Daily Tasks" tab/page in the user dashboard.

- TASK ACCESS RESTRICTION: Only PAID MEMBERS (users with at least 1 active investment plan) can perform daily tasks. Show a lock icon and "Upgrade/Buy Plan to Unlock Tasks" message for free users.

- Task Reward Logic: Performing a task gives ONLY the fixed cash reward ($0.15 credited directly to user main balance) and NOTHING else.

- Limit: 1 task completion per active plan/user per day.



### 4. Referral System ($0.10 Fixed Commission):

- Generate a unique Referral Link / Referral Code for every user.

- Fixed Bonus: When a referred user registers AND activates/purchases any plan, credit a fixed $0.10 Referral Bonus instantly to the referrer's main balance.

- Display total referrals and total referral earnings on the user dashboard.



### 5. Deposit & Withdraw System (Local PKR Gateways Only):

- Local Payment Gateways: EasyPaisa and JazzCash.

- Minimum Withdrawal Limit: $0.15.

- Deposit Flow: User enters USD amount -> App converts to PKR (Dynamic rate e.g., 1 USD = 280 PKR) -> Displays Admin's EasyPaisa/JazzCash Account Number, Account Title, and QR Code -> User submits Transaction ID (TID) and payment screenshot proof. Status becomes "PENDING".

- Withdraw Flow: User enters USD amount ($0.15 min) -> Selects EasyPaisa/JazzCash -> Provides account title & account number -> Submits request. Status becomes "PENDING".



### 6. Admin Panel (Separate Secure Control Panel):

- Security: Role-based access control (RBAC). Admin routes must be strictly protected (`/admin`). Non-admin users attempting to access `/admin` must be redirected to `/dashboard`.

- Dynamic Payment Methods Management: Admin can dynamically update/change EasyPaisa and JazzCash account numbers, account titles, and status (Active/Disabled) anytime from the panel.

- Deposit Approvals: View all pending deposits with attached screenshots and TIDs -> Action buttons: "Approve" (instantly adds funds to user balance) or "Reject" (with reason).

- Withdraw Approvals: View all pending withdrawals -> Action buttons: "Approve" or "Reject" (refunds balance on reject).

- User Management & Password Reset: Search users list -> Ability to reset/change any user's password directly if they forget it -> Edit user balances, active plans, or ban users.



### 7. Tech Stack & Integration:

- React / Next.js / Tailwind CSS for the frontend interface.

- Supabase for PostgreSQL Database, Authentication, Row-Level Security (RLS), and Supabase Edge Functions / Cron for

 12:00 AM daily profit distribution logic.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dollarcashsite.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1acae681-ab08-4918-a668-e236efbf44de).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
