# CPSC 310 Project Repository

UBC is a big place, and involves a large number of people doing a variety of tasks. The goal of this project is to provide a way to perform some of the tasks required to run the university and to enable effective querying of the metadata from around campus. This will involve working with courses, prerequisites, past course averages, room scheduling, and timetable creation.

The backend of this program supports various types of queries. However, the frontend only supports average grade query for a course in a specific year. The backend queries ARE implemented based on the EBNF described below.

QUERY ::='{'BODY ', ' OPTIONS (', ' TRANSFORMATIONS)? '}'  
BODY ::= 'WHERE:{' (FILTER)? '}'  
OPTIONS ::= 'OPTIONS:{' COLUMNS (', ' SORT)? '}'  
TRANSFORMATIONS ::= 'TRANSFORMATIONS: {' GROUP ', ' APPLY '}'  
FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION  
LOGICCOMPARISON ::= LOGIC ':[{' FILTER ('}, {' FILTER )* '}]'   
MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'   
SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards. Optional.  
NEGATION ::= 'NOT :{' FILTER '}'  
LOGIC ::= 'AND' | 'OR'  
MCOMPARATOR ::= 'LT' | 'GT' | 'EQ'  
COLUMNS ::= 'COLUMNS:[' ANYKEY (',' ANYKEY)* ']'  
SORT ::= 'ORDER: ' ('{ dir:'  DIRECTION ', keys: [ ' ANYKEY (',' ANYKEY)* ']}') | ANYKEY  
DIRECTION ::= 'UP' | 'DOWN'   
ANYKEY ::= key | applykey  
GROUP ::= 'GROUP: [' (key ',')* key ']'                                                           
APPLY ::= 'APPLY: [' (APPLYRULE (', ' APPLYRULE )* )? ']'   
APPLYRULE ::= '{' applykey ': {' APPLYTOKEN ':' key '}}'  
APPLYTOKEN ::= 'MAX' | 'MIN' | 'AVG' | 'COUNT' | 'SUM'  
key ::= mkey | skey  
mkey ::= idstring '_' mfield  
skey ::= idstring '_' sfield  
mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year' | 'lat' | 'lon' | 'seats'  
sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid' | 'fullname' | 'shortname' | 'number' | 'name' | 'address' | 'type' | 'furniture' | 'href'   
idstring ::= [^_]+ // One or more of any character, except underscore.  
inputstring ::= [^*]* // zero or more of any character except asterisk.  
applykey ::= [^_]+ // one or more of any character except underscore.  

- **WHERE** defines which sections should be included in the results.
- **COLUMNS** defines which keys should be included in each result.
- **ORDER** defines what order the results should be in.
- **GROUP**: Group the list of results into sets by some matching criteria.
- **APPLY**: Perform calculations across a set of results (i.e., across a **GROUP**).
  - **MAX**: Find the maximum value of a field. For numeric fields only.
  - **MIN**: Find the minimum value of a field. For numeric fields only.
  - **AVG**: Find the average value of a field. For numeric fields only.
  - **SUM**: Find the sum of a field. For numeric fields only.
  - **COUNT**: Count the number of unique occurrences of a field. For both numeric *and* string fields.

- **SORT**: Order results on one or more columns.
  - You can sort by a single column as in C1, e.g., `"ORDER": "sections_avg"`;
  - You can sort by multiple columns on either ascending/descending order by specifying these options in an object (see example query below):
    - `"dir": "UP"`: Sort results ascending.
    - `"dir": "DOWN"`: Sort results descending.
    - `"keys": ["sections_avg"]`: Sorts by a single key.
    - `"keys": ["sections_year", "sections_avg"]`: Sorts by multiple keys. In this example, the course average should be used to resolve ties for courses in the same year.


## Configuring your environment

To start using this project, you need to get your computer configured so you can build and execute the code.
To do this, follow these steps; the specifics of each step (especially the first two) will vary based on which operating system your computer has:

1. [Install git](https://git-scm.com/downloads) (v2.X). After installing you should be able to execute `git --version` on the command line.

1. [Install Node LTS](https://nodejs.org/en/download/), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (v1.22+). You should be able to execute `yarn --version` afterwards.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub. Note that due to new department changes you can no longer access private git resources using https and a username and password. You will need to use either [an access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) or [SSH](https://help.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files.

1. `yarn test` to run the test suite.

1. `yarn pretty` to prettify your project code.
   
1. `yarn start` to start the server.



## Running 

Go to the project directory, run `yarn install`, then run `yarn start` to start the server and use localhost:4321 to access. To perform query, you need to add dataset first by selecting one of the zip file under test/resources/archives.

### License

While the readings for this course are licensed using [CC-by-SA](https://creativecommons.org/licenses/by-sa/3.0/), **checkpoint descriptions and implementations are considered private materials**. Please do not post or share your project solutions. We go to considerable lengths to make the project an interesting and useful learning experience for this course. This is a great deal of work, and while future students may be tempted by your solutions, posting them does not do them any real favours. Please be considerate with these private materials and not pass them along to others, make your repos public, or post them to other sites online.

