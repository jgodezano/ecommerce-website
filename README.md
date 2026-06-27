# BuildMate Construction Supply - E-Commerce Platform

A modern B2B/B2C e-commerce website for a construction materials supplier built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Homepage**: Hero section, featured categories, best sellers, testimonials, CTA
- **Product Catalog**: 20+ sample products across 10 categories
- **Shopping Cart**: Add/remove items, quantity management, cart sidebar
- **Checkout**: Multi-step checkout, delivery methods, payment options
- **Quotation System**: Request bulk pricing with custom requirements
- **Admin Dashboard**: Product, order, inventory, quote, and delivery management
- **SEO Optimized**: Sitemap, robots.txt, JSON-LD schemas, meta tags
- **Responsive Design**: Fully mobile-responsive layout

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State Management**: React Context + useReducer
- **Authentication**: NextAuth.js with JWT
- **Payments**: Stripe, PayPal, Bank Transfer, GCash
- **Database**: MySQL (schema included in `/database/schema.sql`)
- **Icons**: Heroicons, Lucide React
- **Animation**: Framer Motion, CSS animations

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm or yarn

### Installation

```bash
# Clone the repository
cd construction-materials

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials and API keys

# Set up database
mysql -u root -p < database/schema.sql

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── cart/              # Shopping cart
│   ├── categories/        # Category listing
│   ├── checkout/          # Checkout flow
│   ├── products/          # Product detail
│   ├── quote/             # Quotation system
│   ├── account/           # User account
│   └── api/               # API routes
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Header, Footer
│   ├── products/          # Product cards
│   ├── cart/              # Cart sidebar
│   ├── home/              # Homepage sections
│   └── admin/             # Admin components
├── context/               # React context providers
├── data/                  # Sample/mock data
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## Admin Access

- URL: `/admin`
- Default credentials are set up in the database seed

## API Routes

- `GET /api/products` - List products (supports category, search, sort params)
- `POST /api/payments/stripe/create-intent` - Create Stripe payment
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/local/process` - Process local payments

## Deployment

The project is ready for deployment on:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Docker** (Dockerfile included)
- **VPS** with Node.js + MySQL
