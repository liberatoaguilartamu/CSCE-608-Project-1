# Local Bar Polling Application

A web application for users to participate in daily polls about local bars. Users can sign up, log in, vote for their favorite bars, manage their profiles, and create or join groups to hold group-specific polls.

## Features

- **User Authentication**: Simple sign-up and login using phone number and password.
- **Daily Polling**: Vote for your preferred bar at both city and group levels.
- **Voting Constraints**: One vote per day per user, with votes only accepted before 12 am local time.
- **User Profile Management**: Edit profile, view vote history, and toggle anonymous voting.
- **Group Management**: Create groups and invite others via phone number.

## Technology Stack

- **Frontend**: Vue.js with Nuxt
- **Backend**: Bun with server API routes
- **Database**: PostgreSQL
- **UI**: Tailwind CSS
- **Authentication**: Local storage for authentication (simplified for demo)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- Bun (latest version)
- PostgreSQL (version 12 or higher)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd local-bar-polling
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Set up the database:
   ```
   cd database
   createdb bar_polling
   psql -d bar_polling -U liberatoaguilar

   # In the database
   \i schema.sql;
   \q

   # Exit database
   cd ..
   ```

3.1 Re-seed database (Optional):
   ```
   cd database
   pip install faker
   python seed_gen.py

   psql -d bar_polling -U liberatoaguilar

   # In the database
   \i seed_cities.sql
   \i seed_bars.sql
   \i seed_appuser.sql
   \i seed_usergroup.sql
   \i seed_groupmembership.sql
   \i seed_poll.sql
   \i seed_vote.sql; 
   \q
   
   # Exit database
   cd ..
   ```

4. Start the development server:
   ```
   bun run dev
   ```

5. Open your browser and go to `http://localhost:3000`

## Project Structure
TODO: More detail
- **`/pages`**: Contains all application pages
- **`/server/api`**: API endpoints and database connection
- **`/database`**: Database seed scripts
- **`/assets`**: Static assets like CSS

## Database Schema
TODO: Relation format (mention BCNF?)
The application uses the following database tables:
- City: Stores information about supported cities
- AppUser: Stores user information
- Bar: Stores bar information for each city
- UserGroup: Manages groups created by users
- GroupMembership: Tracks group members and invitations
- Poll: Defines polls (city or group-specific)
- Vote: Records user votes

## Sample Data

The application comes pre-seeded with:
- 10 cities
- 100 bars
- 200 users
- 50 groups
- 645 group memberships
- 49,980 polls
- 16,695 votes

## License

This project is licensed under the MIT License. 