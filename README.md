# Karobar360

A comprehensive business management solution for Pakistani small businesses. This ERP/POS system helps manage sales, purchases, inventory, payments, expenses, and more with an intuitive web interface.

## Features

- **Dashboard**: Overview of business metrics and recent activities
- **Sales Management**: Create and manage sales invoices
- **Purchase Management**: Track purchases and suppliers
- **Inventory Management**: Manage items, stock levels, and categories
- **Party Management**: Handle customers and suppliers
- **Payment Tracking**: Record and monitor payments
- **Expense Management**: Track business expenses
- **Ledger**: Maintain financial records
- **Reports**: Generate business reports
- **Returns**: Manage sales and purchase returns
- **Settings**: Configure business settings and user management

## Project Info

**URL**: [Live Demo](https://karobar360.vercel.app) (if deployed)

## Getting Started

### Prerequisites

- Node.js (v18 or higher) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd karobar360
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials.

4. Start the development server:
```sh
npm run dev
```

### Development

- Run tests: `npm test`
- Run linting: `npm run lint`
- Build for production: `npm run build`

## Technologies Used

This project is built with:

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: shadcn-ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **QR Code**: qrcode
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel

## Deployment

This project is configured for deployment on Vercel. To deploy:

1. Connect your GitHub repository to Vercel
2. Set up environment variables for Supabase
3. Deploy automatically on push

## Environment Variables

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
