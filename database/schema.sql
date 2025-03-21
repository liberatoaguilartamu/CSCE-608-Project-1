-- Notes
-- ids are serial becauese seeding depends on them being sequential
-- passwords are stored as plaintext for simplicity (not secure)
-- phone numbers are unique andstored as strings for simplicity

-- Supported cities
CREATE TABLE City (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL
);

-- Users (AppUser because user is a reserved word)
CREATE TABLE AppUser (
    user_id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,  -- Simple string for password
    city_id INTEGER NOT NULL,
    anonymous_flag BOOLEAN DEFAULT FALSE,
    -- So they can change upon sign up
    last_anonymous_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '7 days',
    FOREIGN KEY (city_id) REFERENCES City(city_id)
);

-- Bars
CREATE TABLE Bar (
    bar_id SERIAL PRIMARY KEY,
    bar_name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    FOREIGN KEY (city_id) REFERENCES City(city_id),
    UNIQUE (bar_name, city_id)
);

-- Groups (UserGroup because group is a reserved word)
CREATE TABLE UserGroup (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    admin_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES AppUser(user_id),
    FOREIGN KEY (city_id) REFERENCES City(city_id),
    UNIQUE (group_name, city_id)
);

-- Group memberships/invitations
CREATE TABLE GroupMembership (
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('pending', 'accepted', 'denied')), -- Must be one of these
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES UserGroup(group_id),
    FOREIGN KEY (user_id) REFERENCES AppUser(user_id)
);

-- Polls
CREATE TABLE Poll (
    poll_id SERIAL PRIMARY KEY,
    poll_date DATE NOT NULL,
    poll_type VARCHAR(5) NOT NULL CHECK (poll_type IN ('city', 'group')), -- Must be one of these
    city_id INTEGER NOT NULL,
    group_id INTEGER, -- For group polls; NULL for city polls
    FOREIGN KEY (city_id) REFERENCES City(city_id),
    FOREIGN KEY (group_id) REFERENCES UserGroup(group_id),
    -- Check that group_id is NULL for city polls and non-NULL for group polls
    CHECK (
         (poll_type = 'city' AND group_id IS NULL) OR
         (poll_type = 'group' AND group_id IS NOT NULL)
    )
);

-- Votes
CREATE TABLE Vote (
    vote_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    poll_id INTEGER NOT NULL,
    bar_id INTEGER NOT NULL,
    time_voted TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES AppUser(user_id),
    FOREIGN KEY (poll_id) REFERENCES Poll(poll_id),
    FOREIGN KEY (bar_id) REFERENCES Bar(bar_id)
);