export interface SampleBook {
  id: string;
  title: string;
  author: string;
  category: string;
  subject: string;
  gradeLevel: string;
  pageCount: number;
  wordCount: number;
  preview: string;
  fullText: string;
  chapters: { id: string; title: string; pageNumber: number }[];
}

export interface SampleQuestionPaper {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  pageCount: number;
  questionCount: number;
  totalMarks: number;
  preview: string;
  fullText: string;
  topicsCovered: string[];
}

export const SAMPLE_QUESTION_PAPERS: SampleQuestionPaper[] = [
  {
    id: 'grade-8-science-midterm',
    title: 'Grade 8 Physical Science Midterm Examination (Sample Paper)',
    subject: 'Science',
    gradeLevel: 'Grade 8 (Middle School)',
    pageCount: 3,
    questionCount: 8,
    totalMarks: 20,
    preview: 'SECTION A: Multiple Choice Questions (Newton\'s Laws, Chemical vs Physical Changes, Wave Energy)...',
    topicsCovered: ['Newton\'s Laws of Motion', 'Chemical vs Physical Changes', 'Kinetic & Potential Energy', 'Sound Waves'],
    fullText: `SUNNYDALE ACADEMY — MIDTERM ASSESSMENT
SUBJECT: GRADE 8 PHYSICAL SCIENCE
TIME ALLOWED: 45 MINUTES | MAXIMUM MARKS: 20

INSTRUCTIONS:
- Answer all questions carefully.
- Section A contains Multiple Choice Questions (1 mark each).
- Section B contains Fill-in-the-Blank and Problem-Solving items (2 marks each).

SECTION A: MULTIPLE CHOICE QUESTIONS (1 mark each)
1. A hockey puck slides across an icy surface with negligible friction. According to Newton's First Law of Motion, the puck will:
   A) Gradually accelerate forward on its own
   B) Continue moving at constant velocity in a straight line
   C) Abruptly stop once the initial contact force ends
   D) Turn in a circular trajectory due to inertia
   [Correct Answer: B]

2. Which of the following observations provides conclusive evidence of a chemical change rather than a physical change?
   A) Liquid water boils to form steam vapor
   B) Sodium chloride crystals dissolve into pure water
   C) A solid zinc strip placed in hydrochloric acid produces bubbles of hydrogen gas
   D) A block of wax melts upon heating on a hot plate
   [Correct Answer: C]

3. A 2.0 kg toy car is propelled by a constant net force of 6.0 Newtons. What is the acceleration of the car?
   A) 3.0 m/s²
   B) 12.0 m/s²
   C) 0.33 m/s²
   D) 8.0 m/s²
   [Correct Answer: A — Formula: a = F / m = 6.0 N / 2.0 kg = 3.0 m/s²]

4. As a roller coaster car ascends from the track base to the top of the highest peak, what transformation of mechanical energy takes place?
   A) Gravitational potential energy is transformed entirely into thermal energy
   B) Kinetic energy is transformed into gravitational potential energy
   C) Potential energy is converted directly into nuclear energy
   D) Total mechanical energy increases exponentially
   [Correct Answer: B]

SECTION B: STRUCTURED QUESTIONS & COMPLETION (2 marks each)
5. Fill in the blank: The rate at which an object changes its position over time in a specified directional vector is called ________.
   [Answer: velocity]

6. A sound wave traveling through air has a frequency of 250 Hz. Sound travels faster in solid steel than in ambient air because steel particles are more densely packed and have higher ________.
   [Answer: elasticity / density]

7. When magnesium ribbon is burned in oxygen, white magnesium oxide powder is formed. The chemical equation for this synthesis reaction is 2Mg + O₂ → ________.
   [Answer: 2MgO]

8. An electric circuit contains a 9-volt battery connected to a 3-ohm resistor. Using Ohm's Law (I = V / R), the current flowing through the circuit is ________ amperes.
   [Answer: 3]`,
  },
  {
    id: 'grade-6-math-unit-test',
    title: 'Grade 6 Mathematics Unit Assessment Paper (Sample)',
    subject: 'Mathematics',
    gradeLevel: 'Grade 6 (Middle School)',
    pageCount: 2,
    questionCount: 7,
    totalMarks: 18,
    preview: 'SECTION 1: Fractions, Decimals, Perimeter & Ratio Problems...',
    topicsCovered: ['Equivalent Fractions', 'Ratios & Proportions', 'Area of Rectangles', 'Unit Rates', 'Algebraic Expressions'],
    fullText: `PINEWOOD MIDDLE SCHOOL — MATHEMATICS UNIT TEST
GRADE 6 • RATIOS, FRACTIONS & MEASUREMENT
TOTAL MARKS: 18 | TIME: 40 MINUTES

1. Which pair of ratios are equivalent?
   A) 2:3 and 4:9
   B) 3:5 and 9:15
   C) 4:7 and 8:12
   D) 5:8 and 15:20
   [Correct: B]

2. A bakery uses 3 cups of flour for every 2 cups of sugar to make a batch of cookies. If the baker uses 12 cups of flour, how many cups of sugar are required?
   A) 6 cups
   B) 8 cups
   C) 9 cups
   D) 10 cups
   [Correct: B — 12 / 3 = 4 batches; 4 * 2 = 8 cups]

3. A rectangular community garden has a length of 8.5 meters and a width of 4.0 meters. What is the total area of the garden in square meters?
   A) 34.0 sq meters
   B) 25.0 sq meters
   C) 17.0 sq meters
   D) 32.5 sq meters
   [Correct: A — Area = 8.5 * 4.0 = 34.0]

4. Simplify the fraction 18/24 to its lowest irreducible form:
   A) 3/4
   B) 2/3
   C) 9/12
   D) 6/8
   [Correct: A]

5. Fill in the blank: A cyclist rides 24 miles in 2 hours at a steady pace. The cyclist's unit rate of speed is ________ miles per hour.
   [Answer: 12]

6. Fill in the blank: In the algebraic expression 5x + 7, the number 5 is known as the ________ of the variable x.
   [Answer: coefficient]

7. A store offers a 20% discount on a backpack originally priced at $35.00. The dollar amount saved by the discount is $________.
   [Answer: 7 or 7.00]`,
  },
  {
    id: 'grade-10-biology-exam',
    title: 'Grade 10 Biology Cellular Processes & Genetics Test Paper',
    subject: 'Science',
    gradeLevel: 'Grade 9 - 10 (High School)',
    pageCount: 3,
    questionCount: 8,
    totalMarks: 24,
    preview: 'CELL BIOLOGY & MOLECULAR GENETICS — Mitosis, Cellular Respiration, DNA Replication...',
    topicsCovered: ['Cellular Respiration', 'Mitosis vs Meiosis', 'DNA Structure', 'Mendelian Monohybrid Cross'],
    fullText: `OAKRIDGE HIGH SCHOOL • DEPARTMENT OF BIOLOGY
EXAMINATION PAPER: CELL BIOLOGY, ENERGETICS & GENETICS
GRADE 10 HONORS • DURATION: 50 MINUTES

SECTION 1: MULTIPLE CHOICE (2 marks each)
1. Which metabolic stage of aerobic cellular respiration takes place along the inner mitochondrial cristae and generates the largest quantity of ATP?
   A) Glycolysis in the cytosol
   B) The Citric Acid (Krebs) cycle
   C) Oxidative phosphorylation via the electron transport chain
   D) Lactic acid fermentation
   [Correct: C]

2. During which phase of mitosis do sister chromatids detach at the centromere and migrate toward opposite poles of the mitotic spindle?
   A) Prophase
   B) Metaphase
   C) Anaphase
   D) Telophase
   [Correct: C]

3. In pea plants, the allele for purple flowers (P) is completely dominant over white flowers (p). If two heterozygous plants (Pp × Pp) are crossed, what is the expected phenotypic ratio of purple to white offspring?
   A) 1 purple : 1 white
   B) 3 purple : 1 white
   C) 4 purple : 0 white
   D) 2 purple : 2 white
   [Correct: B]

4. Which enzyme is primarily responsible for unzipping and separating the double-stranded DNA helix during replication?
   A) DNA ligase
   B) DNA helicase
   C) RNA polymerase
   D) Amylase
   [Correct: B]

SECTION 2: FILL IN THE BLANK & SHORT ANSWER (2 marks each)
5. Cellular respiration produces carbon dioxide, water, and usable chemical energy stored primarily in molecules of ________.
   [Answer: ATP / adenosine triphosphate]

6. Plant cell walls are primarily composed of a tough, fibrous polysaccharide known as ________.
   [Answer: cellulose]

7. In human somatic cells, the diploid chromosome count is 46, whereas mature gametes (sperm and egg) contain a haploid count of ________ chromosomes.
   [Answer: 23]

8. The semi-fluid matrix that surrounds the thylakoid membranes inside a chloroplast, where the Calvin cycle occurs, is called the ________.
   [Answer: stroma]`,
  },
];

export const SAMPLE_BOOKS: SampleBook[] = [
  {
    id: 'little-prince',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    category: 'Literature & Philosophy',
    subject: 'English Language Arts',
    gradeLevel: 'Grade 6 (Middle School)',
    pageCount: 6,
    wordCount: 1450,
    preview: 'Once when I was six years old I saw a magnificent picture in a book, called True Stories from Nature, about the primeval forest. It was a picture of a boa constrictor in the act of swallowing an animal...',
    chapters: [
      { id: 'ch-1', title: 'Chapter 1: The Drawing of the Boa Constrictor', pageNumber: 1 },
      { id: 'ch-2', title: 'Chapter 2: The Sahara Desert & The Sheep', pageNumber: 3 },
      { id: 'ch-3', title: 'Chapter 3: The Little Prince’s Asteroid B-612', pageNumber: 5 },
    ],
    fullText: `THE LITTLE PRINCE
By Antoine de Saint-Exupéry

CHAPTER 1: The Drawing of the Boa Constrictor
Once when I was six years old I saw a magnificent picture in a book, called True Stories from Nature, about the primeval forest. It was a picture of a boa constrictor in the act of swallowing an animal. Here is a copy of the drawing.
In the book it said: "Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion."
I pondered deeply, then, over the adventures of the jungle. And after some work with a colored pencil I succeeded in making my first drawing. My Drawing Number One. It looked something like this: a hat-shaped outline.
I showed my masterpiece to the grown-ups, and asked them whether the drawing frightened them. But they answered: "Frighten? Why should any one be frightened by a hat?"
My drawing was not a picture of a hat. It was a picture of a boa constrictor digesting an elephant. But since the grown-ups were not able to understand it, I made another drawing: I drew the inside of a boa constrictor, so that the grown-ups could see it clearly. They always need to have things explained.
The grown-ups' response, this time, was to advise me to lay aside my drawings of boa constrictors, whether from the inside or the outside, and devote myself instead to geography, history, arithmetic, and grammar. That is why, at the age of six, I gave up what might have been a magnificent career as a painter. I had been disheartened by the failure of my Drawing Number One and my Drawing Number Two. Grown-ups never understand anything by themselves, and it is tiresome for children to be always and forever explaining things to them.

CHAPTER 2: The Sahara Desert & The Sheep
So then I chose another profession, and learned to pilot airplanes. I have flown a little over all parts of the world; and it is true that geography has been very useful to me. At a glance I can distinguish China from Arizona. If one gets lost in the night, such knowledge is valuable.
In the course of this life I have had a great many encounters with a great many people who have been concerned with matters of consequence. I have lived a great deal among grown-ups. I have seen them intimately, close at hand. And that hasn't much improved my opinion of them.
Whenever I met one of them who seemed to me at all clear-sighted, I tried the experiment of showing him my Drawing Number One, which I have always kept. I would try to find out, so, if this was a person of true understanding. But whoever it was, he, or she, would always say: "That is a hat." Then I would never talk to that person about boa constrictors, or primeval forests, or stars. I would bring myself down to his level. I would talk to him about bridge, and golf, and politics, and neckties. And the grown-up would be greatly pleased to have met such a sensible man.
Six years ago I had an accident with my plane in the Desert of Sahara. Something was broken in my engine. And as I had with me neither a mechanic nor any passengers, I set myself to attempt the difficult repairs all alone. It was a question of life or death for me: I had scarcely enough drinking water to last a week.
The first night, then, I went to sleep on the sand, a thousand miles from any human habitation. I was more isolated than a shipwrecked sailor on a raft in the middle of the ocean. Thus you can imagine my amazement, at sunrise, when I was awakened by an odd little voice. It said: "If you please—draw me a sheep!"
"What!"
"Draw me a sheep!"
I jumped to my feet, completely thunderstruck. I blinked my eyes hard. I looked carefully all around me. And I saw a most extraordinary small person, who stood there examining me with great seriousness.

CHAPTER 3: The Little Prince’s Asteroid B-612
It took me a long time to learn where he came from. The little prince, who asked me so many questions, never seemed to hear the ones I asked him. It was from words dropped by chance that, little by little, everything was revealed to me.
The little prince explained that his home was scarcely larger than a house! That did not really surprise me much. I knew very well that in addition to the great planets—such as the Earth, Jupiter, Mars, Venus, to which we have given names—there are also hundreds of others, some of which are so small that one has a hard time seeing them through the telescope. When an astronomer discovers one of these, he does not give it a name, but only a number. He might call it, for example, "Asteroid 325."
I have serious reason to believe that the planet from which the little prince came is the asteroid known as B-612. This asteroid has only once been seen through the telescope. That was by a Turkish astronomer, in 1909. On making his discovery, the astronomer had presented it to the International Astronomical Congress, in a great demonstration. But he was in Turkish dress, and so nobody would believe what he said. Grown-ups are like that... Fortunately, however, for the reputation of Asteroid B-612, a Turkish dictator made a law that his subjects, under pain of death, should change to European costume. So in 1920 the astronomer gave his demonstration all over again, dressed with great elegance in an American suit. And this time everybody accepted his report.`,
  },
  {
    id: 'brief-history-of-time',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Physics & Cosmology',
    subject: 'Science',
    gradeLevel: 'Grade 9 - 10 (High School)',
    pageCount: 8,
    wordCount: 1620,
    preview: 'To understand the nature of the universe and have discussions on whether it has a beginning or an end, you have to be clear about what a scientific theory is. A theory is a good theory if it satisfies two requirements: It must accurately describe a large class of observations...',
    chapters: [
      { id: 'ch-1', title: 'Chapter 1: Our Picture of the Universe', pageNumber: 1 },
      { id: 'ch-2', title: 'Chapter 2: Space and Time', pageNumber: 3 },
      { id: 'ch-3', title: 'Chapter 3: Black Holes & Quantum Spacetime', pageNumber: 6 },
    ],
    fullText: `A BRIEF HISTORY OF TIME
By Stephen Hawking

CHAPTER 1: Our Picture of the Universe
A well-known scientist (some say it was Bertrand Russell) once gave a public lecture on astronomy. He described how the earth orbits around the sun and how the sun, in turn, orbits around the center of a vast collection of stars called our galaxy.
At the end of the lecture, a little old lady at the back of the room got up and said: "What you have told us is rubbish. The world is really a flat plate supported on the back of a giant tortoise."
The scientist gave a superior smile before replying, "What is the tortoise standing on?"
"You're very clever, young man, very clever," said the old lady. "But it's turtles all the way down!"
Most people nowadays would find the picture of our universe as an infinite tower of tortoises rather ridiculous, but why do we think we know better? What do we know about the universe, and how do we know it? Where did the universe come from, and where is it going? Did the universe have a beginning, and if so, what happened before then? What is the nature of time? Will it ever come to an end?
Any physical theory is always provisional, in the sense that it is only a hypothesis: you can never prove it. No matter how many times the results of experiments agree with some theory, you can never be sure that the next time the result will not contradict the theory. On the other hand, you can disprove a theory by finding even a single observation that disagrees with the predictions of the theory.

CHAPTER 2: Space and Time
Before 1915, space and time were thought of as a fixed arena in which events took place, but which was not affected by what happened in it. Even in special relativity, space and time were still independent of the matter in the universe.
However, in general relativity, Albert Einstein proposed that gravity is not a force like other forces, but is a consequence of the fact that space-time is not flat, as had been previously assumed: it is curved, or "warped," by the distribution of mass and energy in it.
Bodies like the earth are not made to move on curved orbits by a force called gravity; instead, they follow the nearest thing to a straight path in a curved space, which is called a geodesic. A geodesic is the shortest (or longest) path between two nearby points.
The curvature of space-time causes light rays to bend near massive bodies such as the sun. This was triumphantly confirmed during the solar eclipse of 1919 by Sir Arthur Eddington, who photographed stars whose light passed close to the sun during the eclipse and showed their apparent positions were shifted just as Einstein had predicted.

CHAPTER 3: Black Holes & Quantum Spacetime
The term black hole is of very recent origin. It was coined in 1969 by the American scientist John Wheeler as a graphic description of an idea that goes back at least two hundred years, to a time when there were two theories about light: one, which Newton favored, that it was composed of particles; the other, that it was made of waves.
If a star has a mass greater than the Chandrasekhar limit (about 1.4 times the mass of our sun), its internal nuclear reactions will eventually cease and gravity will compress it without limit until it collapses into a point of infinite density called a gravitational singularity.
Around this singularity is a boundary called the event horizon. The event horizon acts as a one-way membrane: particles and light can fall into the black hole through the horizon, but nothing, not even light, can ever escape from within it.
Hawking radiation: In 1974, by combining general relativity with quantum mechanics, I discovered that black holes are not completely black! Due to quantum fluctuations near the event horizon, virtual particle-antiparticle pairs are constantly created. One particle can fall into the hole while the other escapes into space, appearing as thermal radiation emitted by the black hole.`,
  },
  {
    id: 'constitution-reader',
    title: 'The US Constitution & Bill of Rights',
    author: 'Founding Documents of American Democracy',
    category: 'Civics & Historical Documents',
    subject: 'Social Studies / History',
    gradeLevel: 'Grade 8 (Middle School)',
    pageCount: 5,
    wordCount: 1380,
    preview: 'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty...',
    chapters: [
      { id: 'ch-1', title: 'Preamble & Article I: The Legislative Branch', pageNumber: 1 },
      { id: 'ch-2', title: 'Article II & III: Executive & Judicial Branches', pageNumber: 2 },
      { id: 'ch-3', title: 'The Bill of Rights: Amendments 1 through 10', pageNumber: 4 },
    ],
    fullText: `THE UNITED STATES CONSTITUTION & BILL OF RIGHTS
Historical Primary Source Reader for Middle and High School

PREAMBLE & ARTICLE I: The Legislative Branch
We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.

Section 1: All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives.
Section 2: The House of Representatives shall be composed of Members chosen every second Year by the People of the several States. Representatives must be at least twenty-five years of age and seven years a citizen of the United States.
Section 3: The Senate of the United States shall be composed of two Senators from each State, chosen for six Years; and each Senator shall have one Vote. A Senator must be at least thirty years of age and nine years a citizen. The Vice President of the United States shall be President of the Senate, but shall have no Vote, unless they be equally divided.
Section 7: All Bills for raising Revenue shall originate in the House of Representatives. Every Bill which shall have passed the House of Representatives and the Senate, shall, before it become a Law, be presented to the President of the United States; if he approve he shall sign it, but if not he shall return it with his Objections. A two-thirds vote in both houses can override a presidential veto.

ARTICLE II & III: The Executive & Judicial Branches
Article II, Section 1: The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years, and, together with the Vice President, chosen for the same Term.
Section 2: The President shall be Commander in Chief of the Army and Navy of the United States. He shall have Power, by and with the Advice and Consent of the Senate, to make Treaties, provided two thirds of the Senators present concur; and he shall nominate, and by and with the Advice and Consent of the Senate, shall appoint Ambassadors and Judges of the supreme Court.
Article III, Section 1: The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish. The Judges, both of the supreme and inferior Courts, shall hold their Offices during good Behaviour.

THE BILL OF RIGHTS (1791)
Amendment I: Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.
Amendment II: A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.
Amendment IV: The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation.
Amendment V: No person shall be held to answer for a capital crime unless on a presentment or indictment of a Grand Jury; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.
Amendment VI: In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed.
Amendment VIII: Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.
Amendment X: The powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people.`,
  },
];
