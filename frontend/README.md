# Attendance System Frontend

A modern web application for managing student attendance using QR codes.

## Features

- **Admin Dashboard**: View attendance statistics and system overview
- **QR Code Scanner**: Scan student QR codes to mark attendance
- **Student Management**: Add, edit, and delete student records
- **Reports**: Generate attendance reports by date
- **User Authentication**: Secure login and registration for admin users
- **Settings**: Update profile information and application preferences

## Tech Stack

- **React**: UI library for building the user interface
- **React Router**: For navigation and routing
- **Tailwind CSS**: For styling and responsive design
- **Axios**: For API requests
- **React Webcam**: For QR code scanning functionality
- **React Toastify**: For notifications
- **JWT Decode**: For handling authentication tokens


## Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/         # Static assets like images
│   │   ├── common/     # Common UI elements
│   │   ├── dashboard/  # Dashboard-specific components
│   │   └── scanner/    # QR scanner components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Page layout components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main application component
│   ├── index.css       # Global styles
│   └── main.jsx        # Entry point
├── .eslintrc.cjs       # ESLint configuration
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── vite.config.js      # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

### Development

Start the development server:

```
npm run dev
```

or

```
yarn dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

Build the application for production:

```
npm run build
```

or

```
yarn build
```

The built files will be in the `dist` directory.

## API Integration

The frontend communicates with the backend API for all data operations. The API service is configured in `src/services/api.js`.

## Authentication

The application uses JWT (JSON Web Tokens) for authentication. The authentication logic is handled by the AuthContext provider in `src/context/AuthContext.jsx`.

## License

This project is licensed under the MIT License.
