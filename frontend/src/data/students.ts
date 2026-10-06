import { promptQuestions } from '@/lib/profile.ts'

export type CampusStudent = {
  id: string
  name: string
  age: number
  gender: 'Woman' | 'Man' | 'Non-binary'
  department: string
  year: string
  bio: string
  interests: string[]
  prompts: { question: string; answer: string }[]
  background: string
  hello: string
  likedYou: boolean
  likesBack: boolean
}

function prompts(first: string, second: string, third: string) {
  return [
    { question: promptQuestions[0], answer: first },
    { question: promptQuestions[1], answer: second },
    { question: promptQuestions[2], answer: third },
  ]
}

/** Fictional classmates for the local demo. Real profiles arrive with Firebase. */
export const campusStudents: CampusStudent[] = [
  {
    id: 'sana',
    name: 'Sana Iqbal',
    age: 23,
    gender: 'Woman',
    department: 'Business Administration',
    year: 'Postgraduate',
    bio: 'I plan campus fests and then disappear to the canteen. Looking for someone who texts back and likes long walks after class.',
    interests: ['Food', 'Travel', 'Movies'],
    prompts: prompts(
      'Chai, a bad movie, and no group project talk.',
      'Laughs at my jokes and still shows up on time.',
      'Anything Arijit. I will not be taking questions.',
    ),
    background: 'linear-gradient(180deg, #ffd0dc 0%, #ff8fab 48%, #e25b78 100%)',
    hello: 'Hi. If you are free after class, I know a good canteen table.',
    likedYou: false,
    likesBack: false,
  },
  {
    id: 'meher',
    name: 'Meher Kaur',
    age: 20,
    gender: 'Woman',
    department: 'Electronics',
    year: '2nd Year',
    bio: 'Lab partner by day, playlist curator by night. I will steal the aux and also help you debug the circuit.',
    interests: ['Music', 'Photography', 'Coding'],
    prompts: prompts(
      'The studio after hours, with the good speakers on.',
      'Sends voice notes and means them.',
      'A 2010s indie song I refuse to retire.',
    ),
    background: 'linear-gradient(180deg, #ffd6c8 0%, #ff8f9a 46%, #d4536e 100%)',
    hello: 'Hey. I just matched and I already have a song for this.',
    likedYou: false,
    likesBack: true,
  },
  {
    id: 'riya',
    name: 'Riya Sen',
    age: 21,
    gender: 'Woman',
    department: 'Computer Science',
    year: '3rd Year',
    bio: 'I write more comments than code and I am at peace with that. Sundays are for the library and a very slow breakfast.',
    interests: ['Reading', 'Coding', 'Art'],
    prompts: prompts(
      'A quiet corner of the library and shared earphones.',
      'Can talk about a book without making it a contest.',
      'An old Hindi film song my dad still plays.',
    ),
    background: 'linear-gradient(180deg, #ffe0ea 0%, #ff9eb5 50%, #c94b6a 100%)',
    hello: 'Hi. Library or breakfast, your pick.',
    likedYou: true,
    likesBack: false,
  },
  {
    id: 'kabir',
    name: 'Kabir Ghosh',
    age: 19,
    gender: 'Man',
    department: 'Mechanical Engineering',
    year: '1st Year',
    bio: 'New on campus and already lost between blocks. I play football badly and make excellent midnight Maggi.',
    interests: ['Sports', 'Food', 'Movies'],
    prompts: prompts(
      'A football match we both pretend to understand.',
      'Is kind to juniors and shares their notes.',
      'The title track of whatever just dropped.',
    ),
    background: 'linear-gradient(180deg, #ffd9c7 0%, #ff9a86 48%, #e06a62 100%)',
    hello: 'Hey. I am new here, so you will have to pick the place.',
    likedYou: false,
    likesBack: true,
  },
  {
    id: 'arjun',
    name: 'Arjun Das',
    age: 22,
    gender: 'Man',
    department: 'Information Technology',
    year: '4th Year',
    bio: 'Final year, still figuring out the thesis and dinner. I like rooftop conversations more than loud parties.',
    interests: ['Coding', 'Travel', 'Music'],
    prompts: prompts(
      'The hostel roof once the labs finally close.',
      'Has a plan for the weekend and a backup plan.',
      'A lo-fi mix I put on while the code compiles.',
    ),
    background: 'linear-gradient(180deg, #f8d5e4 0%, #f08aaa 46%, #c4476c 100%)',
    hello: 'Hi. Rooftop this week, if you are around.',
    likedYou: true,
    likesBack: false,
  },
  {
    id: 'dev',
    name: 'Dev Malhotra',
    age: 21,
    gender: 'Man',
    department: 'Civil Engineering',
    year: '3rd Year',
    bio: 'I sketch buildings I will never build and take the long way across campus. Tell me your favourite street food.',
    interests: ['Art', 'Travel', 'Photography'],
    prompts: prompts(
      'A camera, golden hour, and no deadline.',
      'Gets excited about ordinary things.',
      'An old Rahman song, always.',
    ),
    background: 'linear-gradient(180deg, #ffe7d6 0%, #ffb199 42%, #e36b78 100%)',
    hello: 'Hey. Tell me the best thing you have eaten near campus.',
    likedYou: false,
    likesBack: false,
  },
  {
    id: 'nisha',
    name: 'Nisha Rao',
    age: 20,
    gender: 'Non-binary',
    department: 'Design',
    year: '2nd Year',
    bio: 'I redesign every poster I see. If your notes are color-coded, we will get along. Coffee orders taken seriously.',
    interests: ['Art', 'Photography', 'Dancing'],
    prompts: prompts(
      'A gallery hop, then dancing in someone’s room.',
      'Has opinions about fonts and is gentle about them.',
      'A song that makes the studio feel less fluorescent.',
    ),
    background: 'linear-gradient(180deg, #ffd4ea 0%, #f48cb8 48%, #d45486 100%)',
    hello: 'Hi. I already redesigned this conversation in my head.',
    likedYou: true,
    likesBack: false,
  },
  {
    id: 'farhan',
    name: 'Farhan Ali',
    age: 22,
    gender: 'Man',
    department: 'Computer Applications',
    year: 'Postgraduate',
    bio: 'I gym before class and fall asleep in the last lecture. Looking for someone to split a biryani and a weekend plan.',
    interests: ['Gym', 'Food', 'Gaming'],
    prompts: prompts(
      'A late dinner and one honest conversation.',
      'Can be quiet together without it feeling awkward.',
      'Whatever is on in the background of a game lobby.',
    ),
    background: 'linear-gradient(180deg, #ffd8cc 0%, #ff8d7a 46%, #d85a68 100%)',
    hello: 'Hey. Biryani this weekend is a serious offer.',
    likedYou: false,
    likesBack: false,
  },
]

export function studentById(id: string) {
  return campusStudents.find((student) => student.id === id) ?? null
}
