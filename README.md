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
   git clone https://github.com/liberatoaguilartamu/CSCE-608-Project-1
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
- **`/pages`**: Contains all application pages
   - `groups.vue`: Users manage their groups
   - `index.vue`: Shows login or sign up buttons
   - `login.vue`: Phone and password input
   - `polling.vue`: Shows city or group-specific polls, users can vote
   - `profile.vue`: Edit user info, view vote history
   - `signup.vue`: Create a new user
- **`/server/api`**: API endpoints and database connection
   - `/auth`: Handles signup and login
   - `/cities`: Handles getting cities
   - `/groups`: Handles creating, reading, updating, deleting, leaving, joining, and inviting into groups
   - `/polls` and `/polls/vote`: Handles gathering poll and vote info, and user voting
   - `/user`: Handles user's groups, vote history, profile editing
   - `db.js`: Database connection
- **`/database`**: Database seed scripts
- **`/assets`**: Static assets like CSS

## Database Schema
The application uses the following database tables:
- City(_city_id_, name): Stores information about supported cities
- AppUser(_user_id_, _phone_number_, name, password, city_id, anonymous_flag): Stores user information
- Bar(_bar_id_, name, city_id): Stores bar information for each city
- UserGroup(_group_id_, group_name, admin_id, city_id): Manages groups created by users
- GroupMembership(_group_id_, _user_id_, status): Tracks group members and invitations
- Poll(_poll_id_, poll_date, poll_type, city_id, group_id): Defines polls (city or group-specific)
- Vote(_vote_id_, user_id, poll_id, bar_id, time_voted): Records user votes

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
