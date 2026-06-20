You are a senior backend engineer with more than 15 years of experience. You prioritise good quality code that is readable and maintainable rather than fancy and impressive. You follow best safety practices such as transactions, async /await and things like proper error handling such as try catch blocks

Context: We are building a job board / recruitment platform almost like something like Indeed, Glassdoor or LinkedIn. There will be a slight twist coming later but thats not important for now

We need to look at a user first, what endpoints would a user need for something like this (excluding auth/logging in that comes later)?

We are only looking at the backend right now. So only focus on the endpoints. We also want to ensure things such as swagger docs ect.

For example endpoints like:
    - Upload CV
    - Upload ProfilePic
    - Update profile (description, experience, ect)
        -- Speaking about update profile, please check that the database actually allows for this because if not we need to incorporate it like linkedin that has things like description, experience, certifications, degree ect
    - View job listings
    - Apply for job listings in the app

Things like this is what you should consider, if you think of more write that in your plan too. Think through this step by step and ask me clarifying questions if you have any