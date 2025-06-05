# CSV File Management System

A modern web application for managing and analyzing CSV files, built with Next.js, Prisma, and PostgreSQL.

## Features

- 🔐 Secure user authentication and authorization
- 📤 CSV file upload and management
- 📊 Data visualization and analysis
- 🔍 Advanced search and filtering capabilities
- 📱 Responsive design for all devices
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🔄 Real-time data updates
- 📈 Activity tracking and logging

## Tech Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - React Query
  - React Hook Form
  - Zod validation

- **Backend:**
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL
  - NextAuth.js

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 12.x or later
- npm or yarn package manager

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/postgres"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit `http://localhost:3000`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/                  # Utility functions and configurations
├── prisma/              # Prisma schema and migrations
├── public/              # Static assets
└── styles/              # Global styles
```

## API Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/csv/upload` - CSV file upload
- `GET /api/csv` - Get CSV files
- `GET /api/csv/:id` - Get specific CSV file
- `DELETE /api/csv/:id` - Delete CSV file

## Database Schema

The application uses the following main models:
- User
- CSVFile
- UserActivity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email [your-email] or open an issue in the repository.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) 