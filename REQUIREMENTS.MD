# Goal is to make a form-like website for quick quiz that will sent out answers to questions from supabase db to supabase db


## Setup
- NextJs + React
- SupabaseJs
- I don't care how you write styles or anything just make fetching/sending data from db work

## Requirements
### Ui
Should be a 3 component one:
- Anonymous Account/Profile creation
- Quiz solving
- Thank you screen
Looks and feels like one from reference screenshot [Reference.png] :
- cozy style with that creamy color
- !! Dotted background !!
- Light orange and blue as primary colors
- Drawn Diagram like style
- Mobile and pc optimized more importantly mobile

### Infra
#### Db
Proper data fetching from database tables. [database/]
You have useful question view defined there also.
All you need to know is that you will use `questions_with_options` view to get the questions and then just insert data
directly to `user_answers` table and that is it for quiz logic.
For user creation logic you will insert row into `profiles` right after AnonymousSignIn works.
#### User handling
Not making seperate supabase users. In beginning of quiz add a form to enter nickname and make entry 
from it in designated table. It is important that you store (if possible) as much metadata as possible about device so if possible to get from cookies phone name etc because I don't want participants to do quiz for sb else and metadata will help in verification of who actually submited it.

#### Flow
1. Make user profile entry after AnonymousSignIn: nickname, metadata
2. Fetch questions
3. Insert answers with participant id.
4. Finish


### Important
- supabase-js is installed and envs are in .env already setup
- For your reference questions are also in json [questions.json] BUT DON'T USE THOSE IN APP YOU NEED TO FETCH THEM FROM DB 


