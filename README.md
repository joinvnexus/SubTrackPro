# Subscription Master

A full-production ready SaaS application for tracking your subscriptions. Built with modern technologies including React, Express, PostgreSQL, and Drizzle ORM.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB)

## Features

- 📊 **Dashboard** - Beautiful charts showing your subscription spending
- 💳 **Subscription Management** - Add, edit, and track your subscriptions
- 📈 **Analytics** - Visualize your recurring expenses
- 🎨 **Modern UI** - Built with Radix UI and Tailwind CSS
- 🌙 **Dark Mode** - Default dark theme with smooth animations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI Components | Radix UI, Tailwind CSS |
| Charts | Recharts |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Passport.js, Express Session |
| Validation | Zod |

## ⚡ Quick Start

For detailed setup instructions, please read [SETUP.md](./SETUP.md)

### TL;DR

```
bash
# Clone the repository
git clone <repository-url>
cd subscription-master

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL

# Setup database
npm run db:push

# Start development server
npm run dev
```

Visit http://localhost:5000 to view the application.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   └── requirements.md    # Frontend dependencies
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data storage
├── shared/               # Shared code
│   └── schema.ts         # Database schema
├── script/               # Build scripts
├── SETUP.md              # Detailed setup guide
└── README.md             # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List all subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |
| GET | `/api/billing` | Get billing info |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/logout` | Logout |

## Important Notes

- **Price Format**: Prices are stored in cents in the database. The frontend converts dollars to cents before sending and cents to dollars when displaying.
- **Free Plan**: Limited to 5 subscriptions. The backend enforces this limit and returns a 403 error when exceeded.
- **Default Theme**: Dark mode is enabled by default.
- **Fonts**: Uses `Outfit` for display fonts and `DM Sans` for body fonts.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

For detailed setup instructions, please read [SETUP.md](./SETUP.md)
