# Event Management API

Backend REST API for creating and managing events, and allowing users to reserve tickets for them.

Built with **Node.js, Express, MongoDB, Mongoose, JWT, and Gemini API**.

The system supports three types of users:

* **Attendees:** Browse events, reserve tickets, and manage their reservations.
* **Organizers:** Create and manage their own events and view their attendees.
* **Admins:** Manage users and monitor all events and reservations.

The project also includes an **AI-powered event summarization feature using Gemini**.

## Features

* **Authentication & Authorization:** User registration, login, logout, JWT authentication, and role-based access control.
* **Password Security:** Passwords are securely hashed using bcryptjs.
* **Event Management:** Organizers can create, update, delete, and manage their own events, while users can browse and view events.
* **Ticket Reservations:** Users can reserve and cancel tickets with validation for availability, event status, ticket quantity, and duplicate reservations.
* **Reservation Management:** Users can view their reservations, while organizers can view attendees registered for their events.
* **Admin Management:** Admins can manage users and view, filter, and monitor all events and reservations.
* **AI Event Summary:** Generates a short summary of an event using the Gemini API based on its title and description.
* **Validation & Business Rules:** Prevents invalid operations such as unauthorized actions, duplicate reservations, invalid quantities, and unavailable events.

## Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Gemini API
* nodemon

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/RahmaYahiaa/event-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

Create a `.env` file in the root directory and add:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret

JWT_REFRESH_SECRET=your_refresh_secret

JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the project

For development:

```bash
npm run dev
```

Or:

```bash
npm start
```

The server runs by default on:

```text
http://localhost:5000
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description                  |
| ------ | -------------------- | ---------------------------- |
| POST   | `/api/auth/register` | Register a new account       |
| POST   | `/api/auth/login`    | Login and receive JWT tokens |
| POST   | `/api/auth/logout`   | Logout                       |
| GET    | `/api/auth/me`       | Get current user information |

### Events

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| POST   | `/api/events`     | Create an event |
| GET    | `/api/events`     | Get all events  |
| GET    | `/api/events/:id` | Get one event   |
| PATCH  | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |

### Reservations

| Method | Endpoint                       | Description          |
| ------ | ------------------------------ | -------------------- |
| POST   | `/api/events/:id/reserve`      | Reserve tickets      |
| GET    | `/api/reservations/my`         | Get my reservations  |
| GET    | `/api/reservations/:id`        | Get one reservation  |
| POST   | `/api/reservations/:id/cancel` | Cancel a reservation |
| GET    | `/api/events/:id/attendees`    | Get event attendees  |

### Admin

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/admin/users`        | Get all users        |
| GET    | `/api/admin/users/:id`    | Get one user         |
| PATCH  | `/api/admin/users/:id`    | Update a user        |
| DELETE | `/api/admin/users/:id`    | Delete a user        |
| GET    | `/api/admin/events`       | Get all events       |
| GET    | `/api/admin/reservations` | Get all reservations |

### AI

| Method | Endpoint                  | Description                         |
| ------ | ------------------------- | ----------------------------------- |
| POST   | `/api/ai/summarize-event` | Generate an AI summary for an event |


## API Documentation

The project includes [Swagger API documentation](http://localhost:5000/api-docs) for exploring and testing the available endpoints.

## Team 4

* [Rahma Yahia]
* [Amira Shenouda Nayer]
* [Ahmed Ali Eletlawy]
* [Abdullah Harb]
* [Ibrahim saif]
* [Heba]
