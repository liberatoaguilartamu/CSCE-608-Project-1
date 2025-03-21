from faker import Faker
import random
from datetime import datetime, timedelta, time

# Used for generating fake data
fake = Faker()

# Constants
num_cities = 10
bars_per_city = 10 # Leads to 100 bars total
num_appusers = 200
num_groups = 50
num_days = 833 # 833 days so that total polls ~ (10 + 50)*833 ~ 50K polls
vote_probability = 0.10 # Each user votes on a given day with 10% chance
# Realistically votes would be higher on weekends

# End date is April 1, 2025 and start_date is num_days before that
end_date = datetime(2025, 4, 1)
start_date = end_date - timedelta(days=num_days)

# City
with open("seed_cities.sql", "w") as f:
    cities = []
    for i in range(num_cities):
        city_name = fake.city().replace("'", "''")
        cities.append(city_name)
        f.write(f"INSERT INTO City (city_name) VALUES ('{city_name}');\n")

# Bar
with open("seed_bars.sql", "w") as f:
    # city_id starts at 1
    for city_id in range(1, num_cities + 1):
        # 10 per city
        for j in range(bars_per_city):
            bar_name = fake.company().replace("'", "''")
            f.write(f"INSERT INTO Bar (bar_name, city_id) VALUES ('{bar_name}', {city_id});\n")

# AppUser
with open("seed_appuser.sql", "w") as f:
    for i in range(num_appusers):
        # All fields
        phone_number = fake.phone_number().replace(" ", "").replace("-", "")
        name = fake.name().replace("'", "''")
        password = fake.password(length=10)
        city_id = random.randint(1, num_cities)
        anonymous_flag = random.choice(['FALSE', 'TRUE'])
        f.write(
            f"INSERT INTO AppUser (phone_number, name, password, city_id, anonymous_flag) VALUES "
            f"('{phone_number}', '{name}', '{password}', {city_id}, {anonymous_flag});\n"
        )

# UserGroup
groups_mapping = [] # list of (group_id, city_id)
with open("seed_usergroup.sql", "w") as f:
    for i in range(1, num_groups + 1):
        # Add group number for easy differentiation
        group_name = f"Group {i} " + fake.word().capitalize()
        group_name = group_name.replace("'", "''")
        admin_id = random.randint(1, num_appusers)
        city_id = random.randint(1, num_cities)
        groups_mapping.append((i, city_id))
        f.write(
            f"INSERT INTO UserGroup (group_name, admin_id, city_id) VALUES "
            f"('{group_name}', {admin_id}, {city_id});\n"
        )

# GroupMembership
# Dict for mapping user_id to the list of group_ids they are in
user_groups = {uid: [] for uid in range(1, num_appusers + 1)}
with open("seed_groupmembership.sql", "w") as f:
    for group_id in range(1, num_groups + 1):
        # 5-20 random members per group
        num_members = random.randint(5, 20)
        # No dupes
        members = set()
        # Random admin
        admin_id = random.randint(1, num_appusers)
        members.add(admin_id)
        while len(members) < num_members:
            members.add(random.randint(1, num_appusers))
        for user_id in members:
            user_groups[user_id].append(group_id)
            # Admin must be accepted
            if user_id == admin_id:
                status = 'accepted'
            else:
                # Randomly assign status
                r = random.random()
                if r < 0.75:
                    status = 'accepted'
                elif r < 0.95:
                    status = 'pending'
                else:
                    status = 'denied'
            f.write(
                f"INSERT INTO GroupMembership (group_id, user_id, status) VALUES "
                f"({group_id}, {user_id}, '{status}');\n"
            )

# Poll
# For each day, generate one poll per city and one poll per group
# This leads to num_cities + num_groups polls per day
with open("seed_poll.sql", "w") as f:
    for day in range(num_days):
        current_date = (start_date + timedelta(days=day)).date()
        # City polls
        for city_id in range(1, num_cities + 1):
            f.write(
                f"INSERT INTO Poll (poll_date, poll_type, city_id, group_id) VALUES "
                f"('{current_date}', 'city', {city_id}, NULL);\n"
            )
        # Group polls
        for (group_id, group_city_id) in sorted(groups_mapping, key=lambda x: x[0]):
            f.write(
                f"INSERT INTO Poll (poll_date, poll_type, city_id, group_id) VALUES "
                f"('{current_date}', 'group', {group_city_id}, {group_id});\n"
            )

# Vote
# For each user, for each day, with 10% probability, cast one vote
# The vote must be for a bar located in the same city as the poll
with open("seed_vote.sql", "w") as f:
    vote_count = 0
    for user_id in range(1, num_appusers + 1):
        # Assign a city for the user randomly
        user_city = random.randint(1, num_cities)
        groups_for_user = user_groups.get(user_id, [])
        for day in range(num_days):
            # 10% chance
            if random.random() < vote_probability:
                # If user has groups, 50/50 choose group vote or city poll vote
                if groups_for_user and random.choice([True, False]):
                    vote_type = 'group'
                    chosen_group = random.choice(groups_for_user)
                    # Get city_id from the chosen group
                    group_city_id = next((city for (gid, city) in groups_mapping if gid == chosen_group), None)
                    # Just in case
                    if group_city_id is None:
                        group_city_id = random.randint(1, num_cities)
                    # For group poll_ids
                    # Works because ids generated in order
                    poll_id = day * (num_cities + num_groups) + num_cities + chosen_group
                    vote_city = group_city_id
                else:
                    vote_type = 'city'
                    # For city poll_ids
                    # Works because ids generated in order
                    poll_id = day * (num_cities + num_groups) + user_city
                    vote_city = user_city
                # Calculate the bar range for the city
                # Works because bar_ids are generated in order
                min_bar_id = (vote_city - 1) * bars_per_city + 1
                max_bar_id = vote_city * bars_per_city
                # Choose bar in city
                bar_id = random.randint(min_bar_id, max_bar_id)
                base = datetime.combine(start_date + timedelta(days=day), time.min)
                # Random vote time
                vote_time = base + timedelta(
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                f.write(
                    f"INSERT INTO Vote (user_id, poll_id, bar_id, time_voted) VALUES "
                    f"({user_id}, {poll_id}, {bar_id}, '{vote_time}');\n"
                )
                vote_count += 1
