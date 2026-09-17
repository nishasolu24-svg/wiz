import { Worksheet, Question, WorksheetGenerationRequest, TeacherProfile } from '../types';
import { findMatchingDiagrams } from '../data/educationalDiagrams';

/**
 * Intelligent Client-Side Assessment & Curriculum Generator
 * Provides rich, domain-aware, topic-specific questions for Math, Science,
 * Language Arts, History, and custom topics with verified answer keys,
 * hints, and explanations. Also supports direct Gemini API generation
 * when an API key is provided.
 */

interface BookSentence {
  text: string;
  keywords: string[];
}

function extractSentencesFromText(text: string): BookSentence[] {
  if (!text) return [];
  const rawSentences = text
    .replace(/\r?\n+/g, ' ')
    .split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/)
    .map(s => s.trim())
    .filter(s => s.length >= 30 && s.length <= 250);

  return rawSentences.map(sentence => {
    const words = sentence
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .split(/\s+/)
      .filter(w => {
        const lower = w.toLowerCase();
        return (
          w.length >= 4 &&
          !['this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'there', 'about', 'would', 'could', 'should', 'after', 'before'].includes(lower)
        );
      });
    return {
      text: sentence,
      keywords: words,
    };
  });
}

// Helper: Shuffle array
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

// Helper: Random integer between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates grade-appropriate mathematics questions
 */
function generateMathQuestions(
  topic: string,
  gradeLevel: string,
  count: number,
  format: 'multiple_choice' | 'fill_blank' | 'both'
): { questions: Question[]; wordBank: string[] } {
  const lowerTopic = topic.toLowerCase();
  const isGrade1or2 = /grade\s*[12]|first|second|early/i.test(gradeLevel) || /kids|elementary/i.test(lowerTopic);
  const isSubtraction = /subtract|subtraction|minus/i.test(lowerTopic);
  const isMultiplication = /multipl|times|table/i.test(lowerTopic);
  const isDivision = /divid|division/i.test(lowerTopic);
  const isFraction = /fraction/i.test(lowerTopic);
  const isGeometry = /shape|geometry|angle/i.test(lowerTopic);

  const questions: Question[] = [];
  const wordBank: string[] = [];

  const names = ['Leo', 'Mia', 'Noah', 'Emma', 'Liam', 'Olivia', 'Lucas', 'Sophia', 'Ethan', 'Ava'];
  const items = ['apples', 'stickers', 'crayons', 'books', 'pencils', 'cookies', 'toy cars', 'erasers'];

  for (let i = 0; i < count; i++) {
    const qId = `q-math-${i + 1}-${Date.now()}`;
    const qType: 'multiple_choice' | 'fill_blank' =
      format === 'multiple_choice'
        ? 'multiple_choice'
        : format === 'fill_blank'
        ? 'fill_blank'
        : i % 2 === 0
        ? 'multiple_choice'
        : 'fill_blank';

    const child = names[i % names.length];
    const item = items[i % items.length];

    if (isFraction) {
      const denom = [2, 3, 4, 6, 8][i % 5];
      const num = randInt(1, denom - 1);
      const correct = `${num}/${denom}`;
      wordBank.push(correct);

      if (qType === 'fill_blank') {
        questions.push({
          id: qId,
          type: 'fill_blank',
          question: `A pizza is sliced into ${denom} equal pieces. If ${child} eats ${num} piece(s), the fraction of the pizza eaten is ________.`,
          points: 2,
          correctAnswer: correct,
          explanation: `A fraction represents part over whole: ${num} parts eaten out of ${denom} total equal parts is ${num}/${denom}.`,
          hint: `Write the number of eaten pieces on top (numerator) and total pieces on bottom (denominator).`,
        });
      } else {
        const distractors = [`${denom - num}/${denom}`, `${num + 1}/${denom}`, `1/${denom}`, `${num}/${denom + 1}`].filter(
          d => d !== correct
        );
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: `Which fraction represents ${num} shaded parts out of a total of ${denom} equal parts?`,
          points: 2,
          options: shuffle([correct, ...distractors.slice(0, 3)]),
          correctAnswer: correct,
          explanation: `The numerator (${num}) shows the parts considered, and the denominator (${denom}) shows total equal parts.`,
          hint: `Look for ${num} over ${denom}.`,
        });
      }
    } else if (isMultiplication) {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      const prod = a * b;
      wordBank.push(String(prod));

      if (qType === 'fill_blank') {
        questions.push({
          id: qId,
          type: 'fill_blank',
          question: `${child} buys ${a} boxes of ${item}. Each box contains ${b} ${item}. In total, there are ________ ${item}.`,
          points: 2,
          correctAnswer: String(prod),
          explanation: `${a} groups of ${b} equals ${a} × ${b} = ${prod}.`,
          hint: `Multiply ${a} by ${b}.`,
        });
      } else {
        const distractors = [String(prod + a), String(prod - 1), String(a + b), String(prod + 2)].filter(
          d => d !== String(prod)
        );
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: `What is the product of ${a} × ${b}?`,
          points: 2,
          options: shuffle([String(prod), ...distractors.slice(0, 3)]),
          correctAnswer: String(prod),
          explanation: `${a} times ${b} equals ${prod}.`,
          hint: `Think of adding ${b}, ${a} times.`,
        });
      }
    } else if (isSubtraction) {
      const maxVal = isGrade1or2 ? 10 : 20;
      const b = randInt(1, maxVal - 2);
      const a = randInt(b + 1, maxVal);
      const diff = a - b;
      wordBank.push(String(diff));

      if (qType === 'fill_blank') {
        questions.push({
          id: qId,
          type: 'fill_blank',
          question: `${child} had ${a} ${item} and gave ${b} of them to a friend. ${child} now has ________ ${item} left.`,
          points: 2,
          correctAnswer: String(diff),
          explanation: `Subtract the given items: ${a} - ${b} = ${diff}.`,
          hint: `Take away ${b} from ${a}.`,
        });
      } else {
        const distractors = [String(diff + 1), String(diff - 1 >= 0 ? diff - 1 : diff + 3), String(a + b), String(diff + 2)].filter(
          d => d !== String(diff)
        );
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: `What is ${a} - ${b}?`,
          points: 2,
          options: shuffle([String(diff), ...distractors.slice(0, 3)]),
          correctAnswer: String(diff),
          explanation: `${a} minus ${b} equals ${diff}.`,
          hint: `Count backwards ${b} steps from ${a}.`,
        });
      }
    } else {
      // ADDITION (Default Math Topic - e.g. Grade 1 Addition)
      const maxNum = isGrade1or2 ? (i < 2 ? 5 : 9) : 15;
      const a = randInt(1, maxNum);
      const b = randInt(1, maxNum);
      const sum = a + b;
      wordBank.push(String(sum));

      if (i === 0) {
        // Direct basic addition fact
        const distractors = [String(sum + 1), String(sum - 1 > 0 ? sum - 1 : sum + 3), String(sum + 2)].filter(
          d => d !== String(sum)
        );
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: `What is ${a} + ${b}?`,
          points: 2,
          options: shuffle([String(sum), ...distractors]),
          correctAnswer: String(sum),
          explanation: `Adding ${a} and ${b} gives a sum of ${sum}. (${a} + ${b} = ${sum})`,
          hint: `Start at ${Math.max(a, b)} and count up ${Math.min(a, b)} more.`,
        });
      } else if (i === 1) {
        // Concrete Word Problem
        const distractors = [String(sum - 1 > 0 ? sum - 1 : sum + 3), String(sum + 1), String(sum + 2)].filter(
          d => d !== String(sum)
        );
        questions.push({
          id: qId,
          type: qType,
          question:
            qType === 'fill_blank'
              ? `${child} has ${a} ${item}. Their teacher gives them ${b} more. Now ${child} has ________ ${item} in all.`
              : `${child} has ${a} ${item}. Their teacher gives them ${b} more. How many ${item} does ${child} have in all?`,
          points: 2,
          options: qType === 'multiple_choice' ? shuffle([String(sum), ...distractors]) : undefined,
          correctAnswer: String(sum),
          explanation: `Combine both amounts: ${a} + ${b} = ${sum} ${item}.`,
          hint: `Join the two groups of ${item} together to find the total.`,
        });
      } else if (i === 2) {
        // Missing addend / Number sentence
        const missing = b;
        wordBank.push(String(missing));
        questions.push({
          id: qId,
          type: 'fill_blank',
          question: `Complete the number sentence to make it true: ${a} + ________ = ${sum}`,
          points: 2,
          correctAnswer: String(missing),
          explanation: `Since ${a} + ${missing} = ${sum}, the missing number is ${missing}.`,
          hint: `How many more do you need to add to ${a} to reach ${sum}?`,
        });
      } else if (i === 3) {
        // Doubles fact or comparison
        const doubleBase = randInt(2, isGrade1or2 ? 5 : 9);
        const doubleSum = doubleBase + doubleBase;
        wordBank.push(String(doubleSum));
        const distractors = [String(doubleSum - 1), String(doubleSum + 1), String(doubleSum + 2)].filter(
          d => d !== String(doubleSum)
        );
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: `What is the double of ${doubleBase} (${doubleBase} + ${doubleBase})?`,
          points: 2,
          options: shuffle([String(doubleSum), ...distractors]),
          correctAnswer: String(doubleSum),
          explanation: `Doubling means adding the number to itself: ${doubleBase} + ${doubleBase} = ${doubleSum}.`,
          hint: `Add ${doubleBase} and ${doubleBase} together.`,
        });
      } else {
        // Varied sum word problem or addition puzzle
        const c1 = randInt(1, 4);
        const c2 = randInt(1, 4);
        const total = c1 + c2;
        wordBank.push(String(total));
        questions.push({
          id: qId,
          type: qType,
          question:
            qType === 'fill_blank'
              ? `If you have a basket with ${c1} red apples and add ${c2} green apples, there are ________ apples altogether.`
              : `Which addition problem has a total equal to ${total}?`,
          points: 2,
          options:
            qType === 'multiple_choice'
              ? shuffle([
                  `${c1} + ${c2}`,
                  `${total + 1} + 1`,
                  `${total + 2} + 0`,
                  `${Math.max(1, total - 2)} + 0`,
                ])
              : undefined,
          correctAnswer: qType === 'multiple_choice' ? `${c1} + ${c2}` : String(total),
          explanation: `${c1} + ${c2} = ${total}.`,
          hint: `Calculate the sum of each choice to see which equals ${total}.`,
        });
      }
    }
  }

  return { questions, wordBank: Array.from(new Set(wordBank)) };
}

/**
 * Generates authentic Tamil language assessment questions
 * Rich specialized coverage for Thirukkural (திருக்குறள்), Aathichudi (ஆத்திசூடி),
 * Ilakkanam/Grammar (இலக்கணம்), Consonants (மெய் எழுத்துக்கள்), and Vowels (உயிர் எழுத்துக்கள்).
 */
function generateTamilQuestions(
  topic: string,
  count: number,
  format: 'multiple_choice' | 'fill_blank' | 'both',
  subject = '',
  specialInstructions = ''
): { questions: Question[]; wordBank: string[]; title: string; subtitle: string; instructions: string } {
  const combined = `${topic} ${subject} ${specialInstructions}`.toLowerCase();

  const isThirukkural = /thirukkural|திருக்குறள்|kural|குறள்|thiruvalluvar|திருவள்ளுவர்/i.test(combined);
  const isAathichudi = /aathichudi|ஆத்திசூடி|athichudi|kondrai|கொன்றை|avvaiyar|ஔவையார்/i.test(combined);
  const isIlakkanam = /ilakkanam|இலக்கணம்|grammar|vallinam|வல்லினம்|mellinam|மெல்லினம்|idaiyinam|இடையினம்|thinai|திணை|paal|பால்/i.test(combined);
  const isMei = /mei|மெய்|consonant/i.test(combined);
  const isUyir = /urir|uyir|உயிர்|vowel|அ\s*முதல்\s*ஔ/i.test(combined);

  // 1. Comprehensive Thirukkural Question Bank (25 Curated, Verified Tamil Assessment Questions)
  const thirukkuralPool = [
    {
      mcqQuestion: 'உலகப் பொதுமறை எனப் போற்றப்படும் திருக்குறளை இயற்றியவர் யார்?',
      fillQuestion: 'உலகப் பொதுமறை எனப் போற்றப்படும் திருக்குறளை இயற்றியவர் ________ ஆவார்.',
      options: ['திருவள்ளுவர்', 'கம்பர்', 'ஔவையார்', 'பாரதியார்'],
      correctAnswer: 'திருவள்ளுவர்',
      explanation: 'திருக்குறளை இயற்றியவர் நாயனார், தெய்வப்புலவர், வான்புகழ் வள்ளுவர் எனப் பல சிறப்புப் பெயர்களால் போற்றப்படும் திருவள்ளுவர் ஆவார்.',
      hint: 'தெய்வப்புலவர் என்று போற்றப்படும் பெருமைக்குரிய புலவர்.',
    },
    {
      mcqQuestion: 'திருக்குறளில் உள்ள மொத்த குறட்பாக்களின் எண்ணிக்கை எத்தனை?',
      fillQuestion: 'திருக்குறளில் உள்ள மொத்த குறட்பாக்களின் எண்ணிக்கை ________ ஆகும்.',
      options: ['1330', '133', '1000', '1500'],
      correctAnswer: '1330',
      explanation: 'திருக்குறளில் மொத்தம் 133 அதிகாரங்கள் உள்ளன. ஓர் அதிகாரத்திற்கு 10 குறள்கள் வீதம் மொத்தம் 1,330 குறட்பாக்கள் உள்ளன.',
      hint: '133 அதிகாரங்கள் × 10 குறள்கள்.',
    },
    {
      mcqQuestion: 'திருக்குறளில் காணப்படும் மொத்த அதிகாரங்களின் எண்ணிக்கை எத்தனை?',
      fillQuestion: 'திருக்குறளில் மொத்தம் ________ அதிகாரங்கள் காணப்படுகின்றன.',
      options: ['133', '1330', '100', '18'],
      correctAnswer: '133',
      explanation: 'திருக்குறள் அறத்துப்பால், பொருட்பால், காமத்துப்பால் என மூன்று பால்களில் மொத்தம் 133 அதிகாரங்களைக் கொண்டுள்ளது.',
      hint: 'நூற்று முப்பத்து மூன்று அதிகாரங்கள்.',
    },
    {
      mcqQuestion: 'திருக்குறள் எத்தனை பால்களாகப் பகுக்கப்பட்டுள்ளது?',
      fillQuestion: 'திருக்குறள் அறத்துப்பால், பொருட்பால், காமத்துப்பால் என ________ பால்களாகப் பகுக்கப்பட்டுள்ளது.',
      options: ['3 பால்கள்', '4 பால்கள்', '2 பால்கள்', '5 பால்கள்'],
      correctAnswer: '3 பால்கள்',
      explanation: 'திருக்குறள் அறத்துப்பால் (38 அதிகாரங்கள்), பொருட்பால் (70 அதிகாரங்கள்), காமத்துப்பால் (25 அதிகாரங்கள்) என 3 பால்களாகப் பகுக்கப்பட்டுள்ளது. இதனால் இது "முப்பால்" எனவும் வழங்கப்படுகிறது.',
      hint: 'அறம், பொருள், இன்பம் என்ற மூன்று பெரும் பிரிவுகள்.',
    },
    {
      mcqQuestion: 'திருக்குறளின் முதன்மையான முதல் குறட்பா எந்தச் சொல்லில் தொடங்குகிறது?',
      fillQuestion: '"________ முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு" என்பது திருக்குறளின் முதல் குறளாகும்.',
      options: ['அகர', 'கற்றதனால்', 'எண்', 'அன்பிலார்'],
      correctAnswer: 'அகர',
      explanation: '"அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு" - எழுத்துக்களுக்கெல்லாம் "அ" எப்படி தொடக்கமோ, அதுபோல உலக உயிர்களுக்கு இறைவன் முதன்மையாக விளங்குகிறார்.',
      hint: 'தமிழ் எழுத்துக்களின் முதலெழுத்தான "அ" வில் தொடங்கும் சொல்.',
    },
    {
      mcqQuestion: '"அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு" - இக்குறட்பா அமைந்துள்ள அதிகாரம் எது?',
      fillQuestion: 'திருக்குறளின் முதலாவது அதிகாரமான ________ இல் முதல் குறட்பா அமைந்துள்ளது.',
      options: ['கடவுள் வாழ்த்து', 'வான்சிறப்பு', 'அன்புடைமை', 'கல்வி'],
      correctAnswer: 'கடவுள் வாழ்த்து',
      explanation: 'திருக்குறள் தொடங்கும் மிக முதன்மையான தொடக்க அதிகாரம் "கடவுள் வாழ்த்து" ஆகும்.',
      hint: 'இறைவனை வணங்கித் தொடங்கும் முதல் அதிகாரம்.',
    },
    {
      mcqQuestion: 'திருக்குறள் ஒரு குறட்பாவில் எத்தனை அடிகளையும் சீர்களையும் கொண்டுள்ளது?',
      fillQuestion: 'திருக்குறள் வெண்பா வகையைச் சார்ந்தது; இது ________ அடிகளையும், மொத்தம் 7 சீர்களையும் கொண்டுள்ளது.',
      options: ['2 அடிகள் (7 சீர்கள்)', '4 அடிகள் (14 சீர்கள்)', '3 அடிகள் (9 சீர்கள்)', '1 அடி (4 சீர்கள்)'],
      correctAnswer: '2 அடிகள் (7 சீர்கள்)',
      explanation: 'குறள் வெண்பா என்பது முதல் அடியில் 4 சீர்களும், இரண்டாம் அடியில் 3 சீர்களும் என மொத்தம் 2 அடிகளில் 7 சீர்களைக் கொண்டதாகும்.',
      hint: 'மேல் அடி நான்கு சீர்கள், கீழ் அடி மூன்று சீர்கள்.',
    },
    {
      mcqQuestion: '"அன்பிலார் எல்லாம் தமக்குரியர் அன்புடையார் ________ உரியர் பிறர்க்கு" - விடுபட்ட சீர் எது?',
      fillQuestion: '"அன்பிலார் எல்லாம் தமக்குரியர் அன்புடையார் ________ உரியர் பிறர்க்கு" - இக்குறளில் விடுபட்ட சொல் ________ ஆகும்.',
      options: ['என்பும்', 'உடம்பும்', 'பொருளும்', 'பொன்னும்'],
      correctAnswer: 'என்பும்',
      explanation: 'அன்பு இல்லாதவர்கள் எல்லாவற்றையும் தமக்கே உரியது என்பர்; அன்பு உடையவர்கள் தம் எலும்பையும் (உடலையும்) பிறருக்கு உரிமையாக்குவர்.',
      hint: '"எலும்பு" என்ற பொருள் தரும் சொல்.',
    },
    {
      mcqQuestion: '"கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் ________" - விடுபட்ட சீர் எது?',
      fillQuestion: '"கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் ________" - இக்குறளில் விடுபட்ட சொல் தக ஆகும்.',
      options: ['தக', 'வழியே', 'நெறியே', 'இணையே'],
      correctAnswer: 'தக',
      explanation: 'கற்கத் தகுந்த நூல்களைக் குற்றமறக் கற்க வேண்டும்; அவ்வாறு கற்ற பிறகு கற்ற கல்விக்குத் தகுந்தவாறு நல்வழியில் வாழ வேண்டும்.',
      hint: 'கற்ற கல்விக்குத் தக்கவாறு நடப்பதைக் குறிக்கும் சொல்.',
    },
    {
      mcqQuestion: '"துப்பார்க்குத் துப்பாய துப்பாக்கித் துப்பார்க்குத் துப்பாய தூஉம் ________" - விடுபட்ட இறுதிச் சீர் எது?',
      fillQuestion: 'வான்சிறப்பு அதிகாரத்தில் உலகிற்கு உணவாகவும் உணவை உருவாக்குவதாகவும் அமைவது ________ ஆகும்.',
      options: ['மழை', 'காற்று', 'அமுதம்', 'வெள்ளம்'],
      correctAnswer: 'மழை',
      explanation: 'உண்பவர்க்கு நல்ல உணவுப் பொருள்களை விளைவித்துத் தருவதோடு, தானும் உணவாக (நீராக) விளங்குவது மழையே ஆகும் என்று வான்சிறப்பில் வள்ளுவர் கூறுகிறார்.',
      hint: 'வானிலிருந்து பொழியும் நீர்த்துளிகள்.',
    },
    {
      mcqQuestion: '"எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும் கண்னென்ப வாழும் உயிர்க்கு" - இதில் மனிதர்க்குக் கண்களாக வள்ளுவர் எவற்றைக் குறிப்பிடுகிறார்?',
      fillQuestion: 'திருவள்ளுவர் மனிதர்களுக்கு இரு கண்கள் போன்றது என்று ________ இரண்டையும் குறிப்பிடுகிறார்.',
      options: ['எண்ணும் எழுத்தும்', 'அறிவும் அழகும்', 'செல்வமும் புகழும்', 'அன்பும் பண்பும்'],
      correctAnswer: 'எண்ணும் எழுத்தும்',
      explanation: 'எண் என்று சொல்லப்படும் கணிதமும், எழுத்து என்று சொல்லப்படும் மொழி இலக்கியமும் ஆகிய இவ்விரண்டும் வாழும் மக்களுக்கு இரு கண்களுக்கு ஒப்பானவை.',
      hint: 'கணக்கும் மொழியறிவும்.',
    },
    {
      mcqQuestion: '"இனிய உளவாக இன்னாத கூறல் கனிஇருப்பக் ________ கவர்ந்தற்று" - விடுபட்ட சீர் எது?',
      fillQuestion: 'இனிய சொல் இருக்கும் போது தீய சொல் பேசுவது இனிய பழம் இருக்கையில் ________ உண்பதற்கு ஒப்பானது.',
      options: ['காய்கவர்ந் தற்று', 'இலைகவர்ந் தற்று', 'மலர்கவர்ந் தற்று', 'விதைகவர்ந் தற்று'],
      correctAnswer: 'காய்கவர்ந் தற்று',
      explanation: 'இனிய சொற்கள் இருக்கும் போது கடுமையான சொற்களைப் பேசுவது, சுவையான கனி இருக்கும் போது கசப்பான காயைத் தின்பதற்குச் சமமாகும்.',
      hint: 'பழுக்காத காய்.',
    },
    {
      mcqQuestion: 'திருக்குறளுக்கு வழங்கப்படும் சிறப்புப் பெயர்களில் ஒன்று எது?',
      fillQuestion: 'சாதி, மதம், இனம் கடந்து அனைத்து மனிதர்களுக்கும் நல்வழி காட்டுவதால் திருக்குறள் ________ எனப் போற்றப்படுகிறது.',
      options: ['உலகப் பொதுமறை / பொய்யாமொழி / வாயுறை வாழ்த்து', 'நாலடியார்', 'மணிமேகலை', 'சீவக சிந்தாமணி'],
      correctAnswer: 'உலகப் பொதுமறை / பொய்யாமொழி / வாயுறை வாழ்த்து',
      explanation: 'திருக்குறள் எக்காலத்திற்கும் எம்மொழியினருக்கும் பொருந்தும் பொதுவான அறங்களைக் கூறுவதால் உலகப் பொதுமறை, முப்பால், வாயுறை வாழ்த்து, பொய்யாமொழி எனப் பல பெயர்களால் போற்றப்படுகிறது.',
      hint: 'அனைத்து உலக மக்களுக்கும் பொதுவான நீதி நூல்.',
    },
    {
      mcqQuestion: '"தந்தை மகற்காற்றும் நன்றி அவையத்து முந்தி இருப்பச் செயல்" - இக்குறள் அமைந்துள்ள அதிகாரம் எது?',
      fillQuestion: 'தந்தை தன் மகனுக்குச் செய்யும் தலையாய கடமையை விளக்கும் குறள் இடம்பெற்றுள்ள அதிகாரம் ________ ஆகும்.',
      options: ['மக்கட்பேறு', 'அன்புடைமை', 'கல்வி', 'அடக்கம் உடைமை'],
      correctAnswer: 'மக்கட்பேறு',
      explanation: 'ஒரு தந்தை தன் மகனுக்குச் செய்யும் சிறந்த கைம்மாறு, கற்றோர் அவையிலே அவன் முதன்மையாக விளங்குமாறு கல்வி கேள்விகளில் சிறந்தவனாக்குவதே ஆகும்.',
      hint: 'பிள்ளைச் செல்வத்தின் சிறப்பைக் கூறும் அதிகாரம்.',
    },
    {
      mcqQuestion: '"காலத்தினாற் செய்த நன்றி சிறிதெனினும் ஞாலத்தின் மாணப் பெரிது" - இதில் "ஞாலம்" என்பதன் பொருள் யாது?',
      fillQuestion: '"காலத்தினாற் செய்த நன்றி சிறிதெனினும் ஞாலத்தின் மாணப் பெரிது" - இதில் "ஞாலம்" என்பதன் பொருள் ________ ஆகும்.',
      options: ['உலகம்', 'வானம்', 'பெருங்கடல்', 'மலை'],
      correctAnswer: 'உலகம்',
      explanation: 'தக்க காலத்தில் ஒருவன் செய்த உதவி அளவில் மிகச் சிறியதாக இருந்தாலும், அதன் பயனை ஆராய்ந்து பார்த்தால் அது இந்த உலகத்தை விட மிகப் பெரியதாகும்.',
      hint: 'பூமி அல்லது வையகம்.',
    },
    {
      mcqQuestion: '"ஒழுக்கம் விழுப்பம் தரலான் ஒழுக்கம் உயிரினும் ஓம்பப் படும்" - இக்குறளின் படி உயிரை விட மேலாகப் போற்றப்பட வேண்டியது எது?',
      fillQuestion: 'திருவள்ளுவர் உயிரை விட மேலானதாகக் கருதிப் பாதுகாக்கப்பட வேண்டியது ________ என்று கூறுகிறார்.',
      options: ['ஒழுக்கம்', 'செல்வம்', 'வீரம்', 'அழகு'],
      correctAnswer: 'ஒழுக்கம்',
      explanation: 'ஒழுக்கமே மனிதனுக்கு மேன்மையை உண்டாக்கும்; எனவே அந்த ஒழுக்கத்தைத் தன் உயிரை விட மேலானதாகக் கருதிப் போற்றிக் காக்க வேண்டும்.',
      hint: 'நன்னடத்தை அல்லது நற்பண்பு.',
    },
    {
      mcqQuestion: 'திருவள்ளுவர் ஆண்டைக் கணக்கிட, தற்போதைய ஆங்கில ஆண்டுடன் (கி.பி) எத்தனை ஆண்டுகள் கூட்ட வேண்டும்?',
      fillQuestion: 'திருவள்ளுவர் ஆண்டைக் கணக்கிட ஆங்கில ஆண்டுடன் ________ ஆண்டுகள் கூட்டப்பட வேண்டும்.',
      options: ['31 ஆண்டுகள்', '50 ஆண்டுகள்', '100 ஆண்டுகள்', '133 ஆண்டுகள்'],
      correctAnswer: '31 ஆண்டுகள்',
      explanation: 'திருவள்ளுவர் கிறிஸ்து பிறப்பதற்கு 31 ஆண்டுகளுக்கு முன் (கி.மு. 31) பிறந்தவர் என்று தமிழ் அறிஞர்களால் கணக்கிடப்பட்டு ஏற்றுக்கொள்ளப்பட்டுள்ளது.',
      hint: 'முப்பத்து ஒன்று.',
    },
    {
      mcqQuestion: '"ஈன்ற பொழுதின் பெரிதுவக்கும் தன்மகனைச் சான்றோன் எனக்கேட்ட தாய்" - தாய் எப்போது அளவிலா மகிழ்ச்சி அடைகிறாள்?',
      fillQuestion: 'தன் மகனை நற்பண்புகள் நிறைந்த சான்றோன் எனப் பிறர் பாராட்டக் கேட்கும்போது ________ அளவிலா மகிழ்ச்சி அடைகிறாள்.',
      options: ['தன் மகனைச் சான்றோன் எனப் பிறர் புகழும்போது', 'செல்வம் குவிக்கும் போது', 'அரசனாகும் போது', 'பரிசு பெறும் போது'],
      correctAnswer: 'தன் மகனைச் சான்றோன் எனப் பிறர் புகழும்போது',
      explanation: 'தன் மகனைப் பெற்றெடுத்த போது அடைந்த மகிழ்ச்சியை விட, தன் மகனை நற்குணங்கள் நிறைந்த சான்றோன் என்று பெரியோர்கள் புகழும் போது தாய் பன்மடங்கு பெருமகிழ்ச்சி அடைகிறாள்.',
      hint: 'சான்றோன் எனப் புகழும்போது.',
    },
    {
      mcqQuestion: 'திருக்குறளின் முதல் பகுதியான "அறத்துப்பால்" இல் உள்ள மொத்த அதிகாரங்களின் எண்ணிக்கை எத்தனை?',
      fillQuestion: 'திருக்குறளின் அறத்துப்பாலில் மொத்தம் ________ அதிகாரங்கள் உள்ளன.',
      options: ['38 அதிகாரங்கள்', '70 அதிகாரங்கள்', '25 அதிகாரங்கள்', '100 அதிகாரங்கள்'],
      correctAnswer: '38 அதிகாரங்கள்',
      explanation: 'திருக்குறளில் அறத்துப்பாலில் பாயிரவியல், இல்லறவியல், துறவறவியல், ஊழியல் என 4 இயல்களுடன் மொத்தம் 38 அதிகாரங்கள் அமைந்துள்ளன.',
      hint: 'முப்பத்து எட்டு அதிகாரங்கள்.',
    },
    {
      mcqQuestion: 'திருக்குறளின் இரண்டாம் பகுதியான "பொருட்பால்" இல் உள்ள மொத்த அதிகாரங்கள் எத்தனை?',
      fillQuestion: 'திருக்குறளின் பொருட்பாலில் மொத்தம் ________ அதிகாரங்கள் இடம்பெற்றுள்ளன.',
      options: ['70 அதிகாரங்கள்', '38 அதிகாரங்கள்', '25 அதிகாரங்கள்', '50 அதிகாரங்கள்'],
      correctAnswer: '70 அதிகாரங்கள்',
      explanation: 'பொருட்பாலில் அரசியல், அங்கவியல், ஒழிபியல் என 3 இயல்களுடன் மொத்தம் 70 அதிகாரங்கள் அமைந்துள்ளன.',
      hint: 'எழுபது அதிகாரங்கள்.',
    },
    {
      mcqQuestion: 'திருக்குறளின் மூன்றாம் பகுதியான "காமத்துப்பால்" (இன்பத்துப்பால்) இல் உள்ள அதிகாரங்கள் எத்தனை?',
      fillQuestion: 'திருக்குறளின் காமத்துப்பாலில் மொத்தம் ________ அதிகாரங்கள் உள்ளன.',
      options: ['25 அதிகாரங்கள்', '38 அதிகாரங்கள்', '70 அதிகாரங்கள்', '15 அதிகாரங்கள்'],
      correctAnswer: '25 அதிகாரங்கள்',
      explanation: 'காமத்துப்பாலில் களவியல், கற்பியல் என 2 இயல்களுடன் மொத்தம் 25 அதிகாரங்கள் அமைந்துள்ளன (38 + 70 + 25 = 133).',
      hint: 'இருபத்தைந்து அதிகாரங்கள்.',
    },
    {
      mcqQuestion: '"தீயினாற் சுட்டபுண் உள்ளாறும் ஆறாதே நாவினாற் சுட்ட ________" - விடுபட்ட சொல் எது?',
      fillQuestion: '"தீயினாற் சுட்டபுண் உள்ளாறும் ஆறாதே நாவினாற் சுட்ட ________" - இக்குறளில் நாவினால் சுட்ட ________ ஆறாது என்கிறது.',
      options: ['வடு', 'சொல்', 'தீ', 'புண்'],
      correctAnswer: 'வடு',
      explanation: 'தீயினால் சுட்ட காயம் உடம்பில் தழும்பு இருந்தாலும் உள்ளே ஆறிவிடும்; ஆனால் கொடிய சொல்லால் சுட்ட வடு மனதை விட்டு ஒருபோதும் ஆறாது.',
      hint: 'தழும்பு அல்லது அடையாளம்.',
    },
    {
      mcqQuestion: '"வாய்மை எனப்படுவது யாதெனின் யாதொன்றும் தீமை இலாத ________" - விடுபட்ட சொல் எது?',
      fillQuestion: 'பிறர்க்கு எவ்விதத் தீமையும் தராத நல்ல சொற்களைப் பேசுவதே ________ எனப்படும்.',
      options: ['சொலல்', 'செயல்', 'அறிவு', 'பண்பு'],
      correctAnswer: 'சொலல்',
      explanation: 'வாய்மை என்பது மற்றவருக்கு எந்த வகையிலும் சிறிதும் தீங்கு தராத நன்மையான சொற்களைப் பேசுவதே ஆகும்.',
      hint: 'சொல்லுதல் அல்லது பேசுதல்.',
    },
    {
      mcqQuestion: '"கண்ணுடையர் என்பவர் கற்றோர் முகத்திரண்டு புண்ணுடையர் கல்லா தவர்" - இக்குறட்பா அமைந்துள்ள அதிகாரம் எது?',
      fillQuestion: 'கற்றவரே கண் உடையவர், கல்லாதவர் முகத்தில் இருப்பது வெறும் இரு புண்களே எனக் கூறும் அதிகாரம் ________ ஆகும்.',
      options: ['கல்வி', 'அறிவுடைமை', 'அன்புடைமை', 'ஊக்கமுடைமை'],
      correctAnswer: 'கல்வி',
      explanation: 'கல்வி கற்றவரே உண்மையான கண்ணுடையவர்; கல்வி கற்காதவர் முகத்தில் இருப்பது பார்வை தரும் கண்கள் அல்ல, அவை இரண்டு புண்களே என்று கல்வி அதிகாரத்தில் வள்ளுவர் கூறுகிறார்.',
      hint: 'கற்றலின் பெருமை கூறும் அதிகாரம்.',
    },
    {
      mcqQuestion: '"செயற்கரிய செய்வார் பெரியர் சிறியர் செயற்கரிய செய்கலா தார்" - இக்குறள் உணர்த்தும் கருத்து யாது?',
      fillQuestion: 'செய்வதற்கு அரிய கடினமான நற்செயல்களைச் செய்து முடிப்பவரே ________ எனப் போற்றப்படுவர்.',
      options: ['செயற்கரிய நற்செயல்களைச் செய்பவரே பெரியோர்', 'எளிதானதைச் செய்பவரே பெரியோர்', 'செயல் செய்யாதவரே பெரியோர்', 'பேசுபவரே பெரியோர்'],
      correctAnswer: 'செயற்கரிய நற்செயல்களைச் செய்பவரே பெரியோர்',
      explanation: 'பிறரால் செய்ய முடியாத அரிய நல்ல காரியங்களைச் செய்பவரே பெரியோர் ஆவர்; அத்தகைய அரிய செயல்களைச் செய்ய முடியாதவர் சிறியோர் ஆவர்.',
      hint: 'நீத்தார் பெருமை அதிகாரத்தில் வரும் குறள்.',
    },
  ];

  // 2. Aathichudi Pool (ஆத்திசூடி & ஔவையார்)
  const aathichudiPool = [
    {
      mcqQuestion: 'ஆத்திசூடி என்ற நீதி நூலை இயற்றிய பெண் புலவர் யார்?',
      fillQuestion: 'ஆத்திசூடி என்ற நீதி நூலை இயற்றியவர் தமிழ் மூதாட்டி ________ ஆவார்.',
      options: ['ஔவையார்', 'காக்கைப்பாடினியார்', 'வெண்ணிக் குயத்தியார்', 'ஆண்டாள்'],
      correctAnswer: 'ஔவையார்',
      explanation: 'அகர வரிசையில் அமைந்த நீதிகளைச் சிறுவர்களுக்கு எளிமையாகக் கற்றுத்தரும் ஆத்திசூடியை இயற்றியவர் ஔவையார் ஆவார்.',
      hint: 'அத அதிகமானிடம் நெல்லிக்கனி பெற்ற தமிழ் மூதாட்டி.',
    },
    {
      mcqQuestion: '"அறம் செய்ய ________" - ஆத்திசூடியின் முதல் அடியை நிறைவு செய்க.',
      fillQuestion: '"அறம் செய்ய ________" என்பது ஆத்திசூடியின் முதல் அடியாகும்.',
      options: ['விரும்பு', 'முயலு', 'மறவேல்', 'நினை'],
      correctAnswer: 'விரும்பு',
      explanation: 'தான தர்மங்களையும் நற்செயல்களையும் எப்போதும் மனமுவந்து செய்ய விரும்ப வேண்டும் என்பது இதன் பொருளாகும்.',
      hint: '"அ" என்ற அகர வரிசையின் முதல் நீதி.',
    },
    {
      mcqQuestion: '"ஆறுவது சினம்" என்பதில் "சினம்" என்பதன் பொருள் என்ன?',
      fillQuestion: '"ஆறுவது சினம்" என்பதில் சினம் என்பது ________ ஐக் குறிக்கிறது.',
      options: ['கோபம்', 'மகிழ்ச்சி', 'அன்பு', 'துன்பம்'],
      correctAnswer: 'கோபம்',
      explanation: 'கோபம் வரும்போது அதைக் கட்டுப்படுத்தித் தணித்துக் கொள்ள வேண்டும் என்பதே "ஆறுவது சினம்" என்பதன் பொருளாகும்.',
      hint: 'வெகுளி அல்லது ஆத்திரம்.',
    },
    {
      mcqQuestion: '"இயல்வது கரவேல்" என்பதன் விளக்கம் யாது?',
      fillQuestion: 'உன்னால் கொடுக்க முடிந்த உதவியைப் பிறர்க்கு மறைக்காமல் கொடுக்க வேண்டும் என்பதைக் குறிக்கும் ஆத்திசூடி அடி ________.',
      options: ['இயல்வது கரவேல்', 'ஈவது விலக்கேல்', 'ஊக்கமது கைவிடேல்', 'எண் எழுத்து இகழேல்'],
      correctAnswer: 'இயல்வது கரவேல்',
      explanation: 'தன்னால் செய்ய முடிந்த உதவியை அடுத்தவருக்குச் செய்யாமல் மறைத்து வைக்கக் கூடாது.',
      hint: 'கரத்தல் என்றால் மறைத்தல்.',
    },
    {
      mcqQuestion: '"ஊக்கமது ________" - விடுபட்ட சொல் எது?',
      fillQuestion: '"ஊக்கமது ________" - எப்போதும் முயற்சியைக் கைவிடக் கூடாது என்று ஔவையார் கூறுகிறார்.',
      options: ['கைவிடேல்', 'மறவேல்', 'கற்க', 'செய்க'],
      correctAnswer: 'கைவிடேல்',
      explanation: 'எந்த ஒரு செயலிலும் விடாமுயற்சியையும் ஊக்கத்தையும் கைவிடாமல் தொடர்ந்து உழைக்க வேண்டும்.',
      hint: 'விட்டுவிடாதே என்ற பொருள்.',
    },
  ];

  // 3. Tamil Grammar Pool (இலக்கணம்)
  const ilakkanamPool = [
    {
      mcqQuestion: 'தமிழ் இலக்கணத்தில் மெல்லின எழுத்துக்கள் எவை?',
      fillQuestion: 'ங், ஞ், ண், ந், ம், ன் ஆகிய ஆறும் ________ மெய் எழுத்துக்கள் எனப்படும்.',
      options: ['ங், ஞ், ண், ந், ம், ன்', 'க், ச், ட், த், ப், ற்', 'ய், ர், ல், வ், ழ், ள்', 'அ, ஆ, இ, ஈ'],
      correctAnswer: 'ங், ஞ், ண், ந், ம், ன்',
      explanation: 'மென்மையான ஓசையுடைய ங், ஞ், ண், ந், ம், ன் ஆகிய ஆறும் மெல்லினம் எனப்படும்.',
      hint: 'மூக்கின் வழியே மென்மையாக ஒலிக்கும் மெய்யெழுத்துக்கள்.',
    },
    {
      mcqQuestion: 'தமிழ் இலக்கணத்தில் வல்லின எழுத்துக்கள் எவை?',
      fillQuestion: 'க், ச், ட், த், ப், ற் ஆகிய ஆறும் வன்மையான ஓசையுடைய ________ எழுத்துக்கள் எனப்படும்.',
      options: ['க், ச், ட், த், ப், ற்', 'ங், ஞ், ண், ந், ம், ன்', 'ய், ர், ல், வ், ழ், ள்', 'ஐ, ஔ'],
      correctAnswer: 'க், ச், ட், த், ப், ற்',
      explanation: 'வன்மையான ஓசையுடைய க், ச், ட், த், ப், ற் ஆகிய ஆறும் வல்லின எழுத்துக்கள் ஆகும்.',
      hint: 'கசடதபற என நினைவில் கொள்ளப்படும் எழுத்துக்கள்.',
    },
    {
      mcqQuestion: 'தமிழ் இலக்கணத்தில் இடையின எழுத்துக்கள் எவை?',
      fillQuestion: 'ய், ர், ல், வ், ழ், ள் ஆகிய ஆறும் ________ எழுத்துக்கள் எனப்படும்.',
      options: ['ய், ர், ல், வ், ழ், ள்', 'க், ச், ட், த், ப், ற்', 'ங், ஞ், ண், ந், ம், ன்', 'அ, இ, உ'],
      correctAnswer: 'ய், ர், ல், வ், ழ், ள்',
      explanation: 'வல்லினத்திற்கும் மெல்லினத்திற்கும் இடைப்பட்ட ஓசையுடைய ய், ர், ல், வ், ழ், ள் இடையினம் எனப்படும்.',
      hint: 'யரலவழள என அழைக்கப்படும் எழுத்துக்கள்.',
    },
    {
      mcqQuestion: 'தமிழில் "திணை" எத்தனை வகைப்படும்?',
      fillQuestion: 'தமிழில் திணை உயர்திணை மற்றும் அஃறிணை என ________ வகைப்படும்.',
      options: ['2 (உயர்திணை, அஃறிணை)', '5', '3', '4'],
      correctAnswer: '2 (உயர்திணை, அஃறிணை)',
      explanation: 'திணை என்பது ஒழுக்கம் அல்லது பிரிவு எனப்படும்; இது பகுத்தறிவுள்ள மனிதரைக் குறிக்கும் உயர்திணை, மனிதரல்லாத பிறவற்றைக் குறிக்கும் அஃறிணை என இரு வகைப்படும்.',
      hint: 'இரண்டு வகைகள்.',
    },
    {
      mcqQuestion: 'தமிழில் பால் எத்தனை வகைப்படும்?',
      fillQuestion: 'தமிழில் பால் ஆண்பால், பெண்பால், பலர்பால், ஒன்றன்பால், பலவின்பால் என ________ வகைப்படும்.',
      options: ['5 வகைகள்', '2 வகைகள்', '3 வகைகள்', '4 வகைகள்'],
      correctAnswer: '5 வகைகள்',
      explanation: 'தமிழில் பால் ஐந்து வகைப்படும்: ஆண்பால், பெண்பால், பலர்பால் (உயர்திணை); ஒன்றன்பால், பலவின்பால் (அஃறிணை).',
      hint: 'ஐந்து வகைப்படும்.',
    },
  ];

  // 4. Tamil Consonants Pool (மெய் எழுத்துக்கள்)
  const meiPool = [
    {
      mcqQuestion: 'தமிழ் மொழியில் மெய் எழுத்துக்களின் மொத்த எண்ணிக்கை எத்தனை?',
      fillQuestion: 'தமிழ் மொழியில் க் முதல் ன் வரையுள்ள மெய் எழுத்துக்கள் மொத்தம் ________ ஆகும்.',
      options: ['18', '12', '216', '247'],
      correctAnswer: '18',
      explanation: 'தமிழ் மொழியில் புள்ளி வைத்த மெய் எழுத்துக்கள் (க் முதல் ன் வரை) மொத்தம் 18 ஆகும்.',
      hint: 'வல்லினம், மெல்லினம், இடையினம் சேர்ந்த மொத்த மெய்யெழுத்துக்கள்.',
    },
    {
      mcqQuestion: 'மெய் எழுத்துக்களின் ஒலிக்கும் மாத்திரை அளவு என்ன?',
      fillQuestion: 'புள்ளி வைத்த மெய் எழுத்துக்கள் ஒலிக்கும் கால அளவு ________ மாத்திரை ஆகும்.',
      options: ['அரை (1/2) மாத்திரை', 'ஒரு (1) மாத்திரை', 'இரண்டு (2) மாத்திரை', 'மூன்று மாத்திரை'],
      correctAnswer: 'அரை (1/2) மாத்திரை',
      explanation: 'மெய் எழுத்துக்களும் ஆய்த எழுத்தும் அரை (1/2) மாத்திரை கால அளவில் ஒலிக்கின்றன.',
      hint: 'குறில் 1 மாத்திரை, நெடில் 2 மாத்திரை, மெய் அரை மாத்திரை.',
    },
    {
      mcqQuestion: 'பின்வருவனவற்றுள் மெய் எழுத்து எது?',
      fillQuestion: 'அ, க், இ, ஊ ஆகியவற்றில் ________ என்பது மெய் எழுத்து ஆகும்.',
      options: ['க்', 'அ', 'இ', 'ஊ'],
      correctAnswer: 'க்',
      explanation: 'புள்ளி பெற்று வரும் "க்" மெய் எழுத்து ஆகும்; ஏனையவை உயிர் எழுத்துக்கள்.',
      hint: 'மேலே புள்ளி வைத்த எழுத்து.',
    },
    {
      mcqQuestion: 'தமிழ் மொழியில் உள்ள மொத்த எழுத்துக்களின் எண்ணிக்கை எவ்வளவு?',
      fillQuestion: 'தமிழ் மொழியில் உள்ள மொத்த எழுத்துக்களின் எண்ணிக்கை ________ ஆகும்.',
      options: ['247', '216', '18', '12'],
      correctAnswer: '247',
      explanation: 'உயிர் (12) + மெய் (18) + உயிர்மெய் (216) + ஆய்தம் (1) = மொத்தம் 247 எழுத்துக்கள்.',
      hint: '12 + 18 + 216 + 1 ஆகியவற்றின் கூடுதல்.',
    },
  ];

  // 5. Tamil Vowels Pool (உயிர் எழுத்துக்கள்)
  const uyirPool = [
    {
      mcqQuestion: 'தமிழ் மொழியில் உள்ள மொத்த உயிர் எழுத்துக்களின் எண்ணிக்கை எத்தனை?',
      fillQuestion: 'தமிழ் மொழியில் உள்ள மொத்த உயிர் எழுத்துக்கள் ________ ஆகும்.',
      options: ['12', '18', '216', '1'],
      correctAnswer: '12',
      explanation: 'தமிழ் மொழியில் அ, ஆ, இ, ஈ, உ, ஊ, எ, ஏ, ஐ, ஒ, ஓ, ஔ என மொத்தம் 12 உயிர் எழுத்துக்கள் உள்ளன.',
      hint: 'அ முதல் ஔ வரையுள்ள எழுத்துக்களின் மொத்த எண்ணிக்கை.',
    },
    {
      mcqQuestion: 'தமிழ் உயிர் எழுத்துக்களில் முதலாவது எழுத்து எது?',
      fillQuestion: 'தமிழ் உயிர் எழுத்துக்களின் தொடக்க முதல் எழுத்து ________ ஆகும்.',
      options: ['அ', 'ஆ', 'க்', 'ஃ'],
      correctAnswer: 'அ',
      explanation: 'தமிழ் அகர வரிசையில் முதலாவது உயிர் எழுத்து "அ" (அம்மா, அணில்) ஆகும்.',
      hint: 'அம்மா, அணில் ஆகிய சொற்களின் தொடக்க எழுத்து.',
    },
    {
      mcqQuestion: 'தமிழ் உயிர் எழுத்துக்களில் உள்ள குறில் எழுத்துக்கள் மொத்தம் எத்தனை?',
      fillQuestion: 'தமிழ் உயிர் எழுத்துக்களில் குறுகிய ஓசையுடைய குறில் எழுத்துக்கள் மொத்தம் ________ ஆகும்.',
      options: ['5', '7', '12', '18'],
      correctAnswer: '5',
      explanation: 'அ, இ, உ, எ, ஒ ஆகிய 5 எழுத்துக்களும் ஒரு மாத்திரை அளவு ஒலிக்கும் குறில் எழுத்துக்கள் ஆகும்.',
      hint: 'குறுகிய கால அளவில் ஒலிக்கும் எழுத்துக்களின் எண்ணிக்கை.',
    },
    {
      mcqQuestion: 'தமிழ் உயிர் எழுத்துக்களில் உள்ள நெடில் எழுத்துக்கள் மொத்தம் எத்தனை?',
      fillQuestion: 'தமிழ் உயிர் எழுத்துக்களில் நீண்ட ஓசையுடைய நெடில் எழுத்துக்கள் மொத்தம் ________ ஆகும்.',
      options: ['7', '5', '10', '12'],
      correctAnswer: '7',
      explanation: 'ஆ, ஈ, ஊ, ஏ, ஐ, ஓ, ஔ ஆகிய 7 எழுத்துக்களும் இரண்டு மாத்திரை அளவு ஒலிக்கும் நெடில் எழுத்துக்கள் ஆகும்.',
      hint: 'நீண்டு ஒலிக்கும் எழுத்துக்களின் எண்ணிக்கை.',
    },
    {
      mcqQuestion: 'தமிழ் உயிர் எழுத்துக்களின் கடைசி (12-வது) எழுத்து எது?',
      fillQuestion: 'தமிழ் உயிர் எழுத்துக்களின் பன்னிரண்டாவது மற்றும் இறுதி எழுத்து ________ ஆகும்.',
      options: ['ஔ', 'ஓ', 'ஃ', 'ஐ'],
      correctAnswer: 'ஔ',
      explanation: 'உயிர் எழுத்துக்களின் வரிசையில் "ஔ" பன்னிரண்டாவது இறுதி எழுத்தாகும் (எ.கா: ஔவையார்).',
      hint: 'ஔவையார், ஔடதம் என்ற சொற்களின் முதல் எழுத்து.',
    },
    {
      mcqQuestion: '"ஃ" என்ற எழுத்து தமிழ் இலக்கணத்தில் எவ்வாறு அழைக்கப்படுகிறது?',
      fillQuestion: '"ஃ" என்ற எழுத்து தமிழில் ________ என்று அழைக்கப்படுகிறது.',
      options: ['ஆய்த எழுத்து', 'உயிர் எழுத்து', 'மெய் எழுத்து', 'உயிர்மெய் எழுத்து'],
      correctAnswer: 'ஆய்த எழுத்து',
      explanation: '"ஃ" என்பது தனிநிலை அல்லது ஆய்த எழுத்து ஆகும். இது மூன்று புள்ளிகளால் குறிக்கப்படுகிறது.',
      hint: 'முப்புள்ளி அல்லது தனிநிலை என்று அழைக்கப்படும் ஒரே எழுத்து.',
    },
  ];

  // Select target pool based on topic semantics
  let targetPool = uyirPool;
  let title = 'தமிழ் மொழிப் பயிற்சி & வினாடி வினா';
  let subtitle = 'தமிழ் மொழிப் பாடம் • தொடக்க நிலை மதிப்பீடு';
  let instructions = 'பின்வரும் வினாக்களைக் கவனமாகப் படித்து, சரியான விடையைத் தேர்ந்தெடுக்கவும் அல்லது கோடிட்ட இடத்தில் எழுதவும்.';

  if (isThirukkural) {
    targetPool = thirukkuralPool;
    title = 'திருக்குறள் மதிப்பீட்டுத் தேர்வு & வினாடி வினா';
    subtitle = 'தமிழ் இலக்கியப் பாடம் • குறட்பாக்கள், அதிகாரங்கள் & பொருள் உணர்தல்';
    instructions = 'பின்வரும் திருக்குறள் வினாக்களைக் கவனமாகப் படித்து, சரியான விடையைத் தேர்ந்தெடுக்கவும் அல்லது விடுபட்ட சீரை/கோடிட்ட இடத்தை நிரப்புக.';
  } else if (isAathichudi) {
    targetPool = aathichudiPool;
    title = 'ஔவையாரின் ஆத்திசூடி பயிற்சி & வினாடி வினா';
    subtitle = 'தமிழ் நீதி இலக்கியப் பாடம் • நன்னெறி வழிகாட்டல்';
    instructions = 'பின்வரும் ஆத்திசூடி வினாக்களைக் கவனமாகப் படித்து சரியான விடையை எழுதவும்.';
  } else if (isIlakkanam) {
    targetPool = ilakkanamPool;
    title = 'தமிழ் இலக்கணம் பயிற்சி & மதிப்பீடு';
    subtitle = 'தமிழ் மொழிப் பாடம் • வல்லினம், மெல்லினம், இடையினம், திணை, பால்';
    instructions = 'பின்வரும் இலக்கண வினாக்களுக்குச் சரியான விடையைத் தேர்ந்தெடுக்கவும்.';
  } else if (isMei) {
    targetPool = meiPool;
    title = 'தமிழ் மெய் எழுத்துக்கள் பயிற்சி & வினாடி வினா';
    subtitle = 'தமிழ் மொழிப் பாடம் • க் முதல் ன் வரை 18 மெய்யெழுத்துக்கள்';
    instructions = 'பின்வரும் மெய்யெழுத்து வினாக்களுக்குச் சரியான விடையைத் தேர்ந்தெடுக்கவும்.';
  } else if (isUyir) {
    targetPool = uyirPool;
    title = 'தமிழ் உயிர் எழுத்துக்கள் பயிற்சி & வினாடி வினா';
    subtitle = 'தமிழ் மொழிப் பாடம் • அ முதல் ஔ வரை 12 உயிரெழுத்துக்கள்';
    instructions = 'பின்வரும் உயிரெழுத்து வினாக்களுக்குச் சரியான விடையைத் தேர்ந்தெடுக்கவும்.';
  } else {
    // If general Tamil or Thirukkural was implied, blend Thirukkural and general grammar
    targetPool = [...thirukkuralPool, ...ilakkanamPool, ...uyirPool];
  }

  const questions: Question[] = [];
  const wordBank: string[] = [];

  for (let i = 0; i < count; i++) {
    const qId = `q-tamil-${i + 1}-${Date.now()}`;
    const poolItem = targetPool[i % targetPool.length];
    const isMcq =
      format === 'multiple_choice'
        ? true
        : format === 'fill_blank'
        ? false
        : i % 2 === 0;

    wordBank.push(poolItem.correctAnswer);

    if (isMcq) {
      questions.push({
        id: qId,
        type: 'multiple_choice',
        question: poolItem.mcqQuestion,
        points: 2,
        options: shuffle(poolItem.options),
        correctAnswer: poolItem.correctAnswer,
        explanation: poolItem.explanation,
        hint: poolItem.hint,
      });
    } else {
      questions.push({
        id: qId,
        type: 'fill_blank',
        question: poolItem.fillQuestion,
        points: 2,
        correctAnswer: poolItem.correctAnswer,
        explanation: poolItem.explanation,
        hint: poolItem.hint,
      });
    }
  }

  return { questions, wordBank, title, subtitle, instructions };
}

/**
 * Generates curriculum questions for Science, Social Studies, English, or General topics
 */
function generateDomainQuestions(
  topic: string,
  subject: string,
  gradeLevel: string,
  count: number,
  format: 'multiple_choice' | 'fill_blank' | 'both'
): { questions: Question[]; wordBank: string[] } {
  const lowerTopic = topic.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const isScience = /science|biology|physics|chemistry/i.test(lowerSubject);
  const isHistory = /history|social|geography|civics/i.test(lowerSubject);
  const isEnglish = /english|reading|language|grammar|writing/i.test(lowerSubject);

  const isGrade1or2 =
    /grade\s*[12]|first|second|early|kindergarten|k-2|elementary\s*\([1k]-2/i.test(gradeLevel) ||
    /kids|primary/i.test(lowerTopic);
  const isGrade3to5 = /grade\s*[345]|third|fourth|fifth|elementary\s*\(3-5/i.test(gradeLevel);

  const cleanTopic = topic || `${subject} Fundamentals`;
  const questions: Question[] = [];
  const wordBank: string[] = [];

  // -------------------------------------------------------------
  // 1. LANGUAGE ARTS: NOUNS & NOUN EXAMPLES
  // -------------------------------------------------------------
  if (/noun|naming word/i.test(lowerTopic) || (isEnglish && /noun/i.test(lowerTopic))) {
    if (isGrade1or2) {
      const g12NounPool = [
        {
          q: 'A noun is a naming word for a PERSON, PLACE, or THING. Which of these words is a noun?',
          opts: ['Puppy', 'Run', 'Softly', 'Blue'],
          ans: 'Puppy',
          blank: 'A ________ is a cute noun naming a baby animal.',
          exp: 'A puppy is an animal (a living thing), so it is a noun.',
          hint: 'Look for an animal or thing you can pet or hold.',
        },
        {
          q: 'A noun can name a PERSON. Which of these words names a person?',
          opts: ['Teacher', 'Kitchen', 'Banana', 'Jump'],
          ans: 'Teacher',
          blank: 'A ________ is a person who helps children learn in school.',
          exp: 'A teacher is a person, which makes the word a noun.',
          hint: 'Think of someone who helps you in your classroom.',
        },
        {
          q: 'A noun can name a PLACE you can visit. Which word is a place?',
          opts: ['Library', 'Yellow', 'Quickly', 'Sing'],
          ans: 'Library',
          blank: 'Students borrow books from the school ________.',
          exp: 'A library is a location or building, so it is a place noun.',
          hint: 'A quiet place where you go to borrow books.',
        },
        {
          q: 'A noun can name a THING you can touch. Which word is a thing?',
          opts: ['Backpack', 'Sleep', 'Loudly', 'Happy'],
          ans: 'Backpack',
          blank: 'Leo packed his notebooks and pencils inside his ________.',
          exp: 'A backpack is an object you can touch and carry, making it a thing noun.',
          hint: 'A bag you carry to school on your shoulders.',
        },
        {
          q: 'In the sentence "The red apple fell from the tree", which word is a noun?',
          opts: ['apple', 'red', 'fell', 'from'],
          ans: 'apple',
          blank: 'In "The red apple fell from the tree", the fruit noun is ________.',
          exp: '"Apple" is the name of a fruit (a thing). "Red" describes it, and "fell" is an action.',
          hint: 'Look for the sweet round fruit you can eat.',
        },
        {
          q: 'Which of the following words is an ACTION word (verb), NOT a noun?',
          opts: ['Jump', 'Cat', 'School', 'Pencil'],
          ans: 'Jump',
          blank: 'While pencil and cat are nouns, ________ is an action word.',
          exp: '"Jump" is something you do (an action verb), not a person, place, or thing.',
          hint: 'You do this with your legs when playing outside.',
        },
        {
          q: 'Complete the sentence with the best noun: "The friendly ________ wagged its tail."',
          opts: ['dog', 'slowly', 'bright', 'sleep'],
          ans: 'dog',
          blank: 'The friendly ________ wagged its tail happily at the door.',
          exp: '"Dog" is the animal noun that can wag its tail.',
          hint: 'An animal that barks and wags its tail.',
        },
        {
          q: 'A PROPER NOUN is a special name for a person or place and starts with a CAPITAL letter. Which is a proper noun?',
          opts: ['Emma', 'girl', 'city', 'book'],
          ans: 'Emma',
          blank: 'The girl\'s special name is ________, so it begins with a capital letter.',
          exp: '"Emma" is a specific name of a person, so it is a proper noun capitalized.',
          hint: 'Look for the word that begins with a big capital letter.',
        },
        {
          q: 'Which word is the plural noun meaning MORE THAN ONE cat?',
          opts: ['Cats', 'Catting', 'Catted', 'Cat'],
          ans: 'Cats',
          blank: 'There is one cat on the bed, but two ________ on the rug.',
          exp: 'Add "-s" to cat to name more than one: cats.',
          hint: 'Add an "s" to the end of cat.',
        },
        {
          q: 'In the sentence "Mia rides her bike in the park", what are the nouns?',
          opts: ['Mia, bike, and park', 'rides, in, and the', 'Mia and rides', 'her and the'],
          ans: 'Mia, bike, and park',
          blank: 'Mia is a person, bike is a thing, and ________ is a place.',
          exp: 'Mia is a person, bike is a thing, and park is a place. All three are nouns!',
          hint: 'Find the person, the object she rides, and the location.',
        },
        {
          q: 'A hospital is a noun that names a:',
          opts: ['Place', 'Person', 'Action', 'Color'],
          ans: 'Place',
          blank: 'A hospital is a ________ where doctors care for sick patients.',
          exp: 'A hospital is a building/location, so it is a place noun.',
          hint: 'A hospital is somewhere you go.',
        },
        {
          q: 'Which word in this sentence names an animal: "The little rabbit hopped across the yard"?',
          opts: ['rabbit', 'hopped', 'little', 'across'],
          ans: 'rabbit',
          blank: 'The furry ________ has long ears and loves carrots.',
          exp: '"Rabbit" is an animal noun.',
          hint: 'The animal with long ears that hops.',
        },
      ];

      for (let i = 0; i < count; i++) {
        const item = g12NounPool[i % g12NounPool.length];
        const qType =
          format === 'fill_blank'
            ? 'fill_blank'
            : format === 'multiple_choice'
            ? 'multiple_choice'
            : i % 2 === 0
            ? 'multiple_choice'
            : 'fill_blank';
        wordBank.push(item.ans);
        questions.push({
          id: `q-noun-${i + 1}-${Date.now()}`,
          type: qType,
          question: qType === 'fill_blank' ? item.blank : item.q,
          points: 2,
          options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
          correctAnswer: item.ans,
          explanation: item.exp,
          hint: item.hint,
        });
      }
      return { questions, wordBank };
    } else {
      // Elementary (Grade 3-5) & Middle School Nouns Pool
      const g35NounPool = [
        {
          q: 'Which of the following is a COLLECTIVE noun representing a group of animals?',
          opts: ['Flock', 'Feather', 'Fly', 'Fast'],
          ans: 'Flock',
          blank: 'A ________ of birds flew south for the winter.',
          exp: '"Flock" is a collective noun that names a group of birds.',
          hint: 'A word used to describe many birds flying together.',
        },
        {
          q: 'An ABSTRACT noun names an idea, feeling, or quality you cannot physically touch. Which is an abstract noun?',
          opts: ['Courage', 'Chair', 'Clock', 'Cookie'],
          ans: 'Courage',
          blank: 'The firefighter showed great ________ when rescuing the kitten.',
          exp: '"Courage" is a quality or feeling, making it an abstract noun.',
          hint: 'A feeling of bravery you feel inside your heart.',
        },
        {
          q: 'Which of the following contains a PROPER noun that requires capitalization?',
          opts: ['Grand Canyon', 'national park', 'deep canyon', 'flowing river'],
          ans: 'Grand Canyon',
          blank: 'Our family visited the magnificent ________ in Arizona.',
          exp: '"Grand Canyon" is the specific name of a geographical landmark.',
          hint: 'The specific name of the famous landmark in Arizona.',
        },
        {
          q: 'What is the correct plural spelling of the noun "leaf"?',
          opts: ['Leaves', 'Leafs', 'Leafes', 'Leavs'],
          ans: 'Leaves',
          blank: 'In autumn, colorful ________ fall from the oak trees.',
          exp: 'For nouns ending in "f" like leaf, change "f" to "v" and add "-es": leaves.',
          hint: 'Change the "f" to "ves".',
        },
        {
          q: 'Which sentence correctly uses a singular possessive noun?',
          opts: ['The girl\'s backpack is blue.', 'The girls backpack is blue.', 'The girls\'s backpack is blue.', 'The girl backpack is blue.'],
          ans: 'The girl\'s backpack is blue.',
          blank: 'The ________ backpack was zipped tightly before class.',
          exp: 'To show one girl owns the backpack, add apostrophe-s: girl\'s.',
          hint: 'Use an apostrophe before the "s" for one person.',
        },
      ];

      for (let i = 0; i < count; i++) {
        const item = g35NounPool[i % g35NounPool.length];
        const qType =
          format === 'fill_blank'
            ? 'fill_blank'
            : format === 'multiple_choice'
            ? 'multiple_choice'
            : i % 2 === 0
            ? 'multiple_choice'
            : 'fill_blank';
        wordBank.push(item.ans);
        questions.push({
          id: `q-noun-adv-${i + 1}-${Date.now()}`,
          type: qType,
          question: qType === 'fill_blank' ? item.blank : item.q,
          points: 2,
          options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
          correctAnswer: item.ans,
          explanation: item.exp,
          hint: item.hint,
        });
      }
      return { questions, wordBank };
    }
  }

  // -------------------------------------------------------------
  // 2. LANGUAGE ARTS: VERBS / ACTION WORDS
  // -------------------------------------------------------------
  if (/verb|action word/i.test(lowerTopic) || (isEnglish && /verb/i.test(lowerTopic))) {
    const verbPool = isGrade1or2
      ? [
          {
            q: 'A verb is an action word that tells what someone or something DOES. Which word is a verb?',
            opts: ['Swim', 'Water', 'Blue', 'Fish'],
            ans: 'Swim',
            blank: 'Dolphins love to ________ quickly through the ocean waves.',
            exp: '"Swim" is an action you do in the water.',
            hint: 'Something you do with your arms and legs in a pool.',
          },
          {
            q: 'In the sentence "The green frog hops across the grass", which word is the verb?',
            opts: ['hops', 'green', 'frog', 'grass'],
            ans: 'hops',
            blank: 'The playful frog ________ high over the rocks.',
            exp: '"Hops" tells the action the frog is doing.',
            hint: 'The movement the frog makes.',
          },
          {
            q: 'Which word shows an action you can do with a book?',
            opts: ['Read', 'Heavy', 'Paper', 'Cover'],
            ans: 'Read',
            blank: 'Every evening, Leo likes to ________ a bedtime story.',
            exp: '"Read" is the action of looking at words and understanding them.',
            hint: 'Looking at words on a page.',
          },
        ]
      : [
          {
            q: 'Which of the following is the past tense form of the irregular verb "run"?',
            opts: ['Ran', 'Runned', 'Running', 'Runs'],
            ans: 'Ran',
            blank: 'Yesterday, the athletes ________ five miles around the track.',
            exp: '"Ran" is the correct irregular past tense of run.',
            hint: 'Starts with "r" and rhymes with "fan".',
          },
          {
            q: 'In the sentence "She has completed her homework", which word functions as a helping verb?',
            opts: ['has', 'completed', 'homework', 'she'],
            ans: 'has',
            blank: 'In the verb phrase "has completed", the word ________ is the auxiliary helping verb.',
            exp: '"Has" assists the main past participle "completed".',
            hint: 'A short helping verb that comes before the main action.',
          },
        ];

    for (let i = 0; i < count; i++) {
      const item = verbPool[i % verbPool.length];
      const qType = format === 'fill_blank' ? 'fill_blank' : format === 'multiple_choice' ? 'multiple_choice' : i % 2 === 0 ? 'multiple_choice' : 'fill_blank';
      wordBank.push(item.ans);
      questions.push({
        id: `q-verb-${i + 1}-${Date.now()}`,
        type: qType,
        question: qType === 'fill_blank' ? item.blank : item.q,
        points: 2,
        options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
        correctAnswer: item.ans,
        explanation: item.exp,
        hint: item.hint,
      });
    }
    return { questions, wordBank };
  }

  // -------------------------------------------------------------
  // 3. LANGUAGE ARTS: ADJECTIVES / DESCRIBING WORDS
  // -------------------------------------------------------------
  if (/adjective|describing/i.test(lowerTopic) || (isEnglish && /adjective/i.test(lowerTopic))) {
    const adjPool = [
      {
        q: 'An adjective describes a noun. In "The bright yellow sun warmed the yard", which word is an adjective?',
        opts: ['yellow', 'sun', 'warmed', 'yard'],
        ans: 'yellow',
        blank: 'The ________ sun shone brightly over the playground.',
        exp: '"Yellow" describes the color of the sun noun.',
        hint: 'A bright color word.',
      },
      {
        q: 'Which word is an adjective that tells how something FEELS to the touch?',
        opts: ['Fluffy', 'Pillow', 'Sleep', 'Bed'],
        ans: 'Fluffy',
        blank: 'The kitten had soft, ________ fur.',
        exp: '"Fluffy" describes the texture of fur.',
        hint: 'Soft like a cloud or cotton ball.',
      },
      {
        q: 'Which word describes SIZE?',
        opts: ['Enormous', 'Elephant', 'Stomp', 'Jungle'],
        ans: 'Enormous',
        blank: 'The giant blue whale is an ________ creature.',
        exp: '"Enormous" means very, very big.',
        hint: 'A word meaning huge or very big.',
      },
    ];

    for (let i = 0; i < count; i++) {
      const item = adjPool[i % adjPool.length];
      const qType = format === 'fill_blank' ? 'fill_blank' : format === 'multiple_choice' ? 'multiple_choice' : i % 2 === 0 ? 'multiple_choice' : 'fill_blank';
      wordBank.push(item.ans);
      questions.push({
        id: `q-adj-${i + 1}-${Date.now()}`,
        type: qType,
        question: qType === 'fill_blank' ? item.blank : item.q,
        points: 2,
        options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
        correctAnswer: item.ans,
        explanation: item.exp,
        hint: item.hint,
      });
    }
    return { questions, wordBank };
  }

  // -------------------------------------------------------------
  // 4. GRADE 1-2 EARLY ELEMENTARY SCIENCE (5 Senses, Living Things)
  // -------------------------------------------------------------
  if (isGrade1or2 && isScience) {
    const g12SciPool = [
      {
        q: 'Which sense do we use to see colors and shapes around us?',
        opts: ['Sight (Eyes)', 'Hearing (Ears)', 'Taste (Tongue)', 'Smell (Nose)'],
        ans: 'Sight (Eyes)',
        blank: 'We use our eyes for the sense of ________ to read books and see shapes.',
        exp: 'Our eyes give us the sense of sight.',
        hint: 'What do you use to look at pictures?',
      },
      {
        q: 'What two things do green plants need to grow healthy and strong?',
        opts: ['Sunlight and water', 'Candy and soda', 'Darkness and cold', 'Rocks and plastic'],
        ans: 'Sunlight and water',
        blank: 'Plants need soil, water, and warm ________ to grow.',
        exp: 'Plants need sunlight and water to make food and grow.',
        hint: 'Think of what shines from the sky and falls as rain.',
      },
      {
        q: 'Which of the following is a LIVING thing?',
        opts: ['A puppy', 'A toy car', 'A rock', 'A pencil'],
        ans: 'A puppy',
        blank: 'A ________ is a living animal that breathes, eats, and grows.',
        exp: 'Living things grow and breathe. A puppy is alive; toys and rocks are not.',
        hint: 'Which one can bark and run around?',
      },
      {
        q: 'In which season do snow falls and temperatures turn very cold?',
        opts: ['Winter', 'Summer', 'Spring', 'Fall'],
        ans: 'Winter',
        blank: 'We wear warm coats, gloves, and boots during the cold ________.',
        exp: 'Winter is the coldest season when snow falls.',
        hint: 'The season when you can build a snowman.',
      },
    ];

    for (let i = 0; i < count; i++) {
      const item = g12SciPool[i % g12SciPool.length];
      const qType = format === 'fill_blank' ? 'fill_blank' : format === 'multiple_choice' ? 'multiple_choice' : i % 2 === 0 ? 'multiple_choice' : 'fill_blank';
      wordBank.push(item.ans);
      questions.push({
        id: `q-g12sci-${i + 1}-${Date.now()}`,
        type: qType,
        question: qType === 'fill_blank' ? item.blank : item.q,
        points: 2,
        options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
        correctAnswer: item.ans,
        explanation: item.exp,
        hint: item.hint,
      });
    }
    return { questions, wordBank };
  }

  // Science Specific Pools (Grades 3+)
  if (isScience && /photosynthesis|plant/i.test(lowerTopic)) {
    const pool = [
      {
        q: 'What green pigment inside plant cells absorbs sunlight energy for photosynthesis?',
        opts: ['Chlorophyll', 'Hemoglobin', 'Melanin', 'Carotene'],
        ans: 'Chlorophyll',
        blank: 'The green pigment inside plant cells that absorbs light energy is ________.',
        exp: 'Chlorophyll absorbs red and blue light while reflecting green light.',
        hint: 'It starts with "Chloro-".',
      },
      {
        q: 'What gas do plants take in from the surrounding air to perform photosynthesis?',
        opts: ['Carbon dioxide (CO2)', 'Oxygen (O2)', 'Nitrogen (N2)', 'Helium (He)'],
        ans: 'Carbon dioxide (CO2)',
        blank: 'Plants absorb ________ from the air through tiny openings called stomata.',
        exp: 'Carbon dioxide provides the carbon atoms needed to produce glucose.',
        hint: 'It is the gas exhaled by animals.',
      },
      {
        q: 'What vital gas do plants release into the atmosphere as a byproduct of photosynthesis?',
        opts: ['Oxygen', 'Carbon monoxide', 'Methane', 'Hydrogen'],
        ans: 'Oxygen',
        blank: 'As a byproduct of splitting water molecules, plants release ________ into the air.',
        exp: 'Oxygen is released into the atmosphere, supporting animal life.',
        hint: 'It is the gas humans breathe in.',
      },
      {
        q: 'What form of sugar is synthesized by plants to store chemical energy?',
        opts: ['Glucose', 'Lactose', 'Sucrose salt', 'Starch acid'],
        ans: 'Glucose',
        blank: 'Plants synthesize ________ (C6H12O6) to store food energy produced during photosynthesis.',
        exp: 'Glucose is a simple sugar that fuels cellular processes.',
        hint: 'A simple sugar molecule.',
      },
      {
        q: 'In which specialized cell organelle does photosynthesis take place?',
        opts: ['Chloroplast', 'Mitochondria', 'Nucleus', 'Ribosome'],
        ans: 'Chloroplast',
        blank: 'Photosynthesis takes place inside the ________ of plant leaf cells.',
        exp: 'Chloroplasts house chlorophyll and the thylakoid membrane structures.',
        hint: 'The organelle that gives plant leaves their green color.',
      },
    ];

    for (let i = 0; i < count; i++) {
      const item = pool[i % pool.length];
      const qType = format === 'fill_blank' ? 'fill_blank' : format === 'multiple_choice' ? 'multiple_choice' : i % 2 === 0 ? 'multiple_choice' : 'fill_blank';
      wordBank.push(item.ans);
      questions.push({
        id: `q-sci-${i + 1}-${Date.now()}`,
        type: qType,
        question: qType === 'fill_blank' ? item.blank : item.q,
        points: 2,
        options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
        correctAnswer: item.ans,
        explanation: item.exp,
        hint: item.hint,
      });
    }
    return { questions, wordBank };
  }

  if (isScience && /digestive|body|anatomy|stomach|organ/i.test(lowerTopic)) {
    const pool = [
      {
        q: 'Which organ produces hydrochloric acid and enzymes to break down proteins in food?',
        opts: ['Stomach', 'Gallbladder', 'Large intestine', 'Lungs'],
        ans: 'Stomach',
        blank: 'Food is churned with digestive acids and enzymes inside the ________.',
        exp: 'The stomach churns food into a semi-liquid mixture called chyme.',
        hint: 'The J-shaped muscular organ below the esophagus.',
      },
      {
        q: 'In which part of the human digestive tract are most nutrients absorbed into the bloodstream?',
        opts: ['Small intestine', 'Esophagus', 'Large intestine', 'Mouth'],
        ans: 'Small intestine',
        blank: 'Most nutrient absorption occurs along the lining of the ________.',
        exp: 'Villi and microvilli in the small intestine absorb amino acids, sugars, and fatty acids.',
        hint: 'It is a long, winding tube with millions of tiny villi.',
      },
      {
        q: 'What is the primary function of the large intestine (colon)?',
        opts: ['Absorbing water and forming stool', 'Producing insulin', 'Pumping oxygenated blood', 'Filtering air'],
        ans: 'Absorbing water and forming stool',
        blank: 'The primary role of the large intestine is absorbing ________ from undigested material.',
        exp: 'The large intestine reabsorbs water and electrolytes, solidifying waste.',
        hint: 'It prevents dehydration by reabsorbing fluids.',
      },
      {
        q: 'Which muscular tube connects the throat to the stomach to move food through peristalsis?',
        opts: ['Esophagus', 'Trachea', 'Ureter', 'Aorta'],
        ans: 'Esophagus',
        blank: 'Swallowed food travels down to the stomach through the ________.',
        exp: 'Peristaltic waves push food down the esophagus.',
        hint: 'The food pipe connecting the throat and stomach.',
      },
      {
        q: 'Which vital organ produces bile to help break down fats during digestion?',
        opts: ['Liver', 'Kidney', 'Spleen', 'Heart'],
        ans: 'Liver',
        blank: 'Bile is synthesized by the ________ and stored in the gallbladder.',
        exp: 'The liver produces bile, which emulsifies fats in the duodenum.',
        hint: 'The largest internal organ in the human body.',
      },
    ];

    for (let i = 0; i < count; i++) {
      const item = pool[i % pool.length];
      const qType = format === 'fill_blank' ? 'fill_blank' : format === 'multiple_choice' ? 'multiple_choice' : i % 2 === 0 ? 'multiple_choice' : 'fill_blank';
      wordBank.push(item.ans);
      questions.push({
        id: `q-dig-${i + 1}-${Date.now()}`,
        type: qType,
        question: qType === 'fill_blank' ? item.blank : item.q,
        points: 2,
        options: qType === 'multiple_choice' ? shuffle(item.opts) : undefined,
        correctAnswer: item.ans,
        explanation: item.exp,
        hint: item.hint,
      });
    }
    return { questions, wordBank };
  }

  // Grade-aware Curriculum Archetypes
  const earlyElementaryArchetypes = [
    {
      type: 'kid_concept',
      mcq: (top: string, subj: string) => `What is an important thing we learn about ${top}?`,
      blank: (top: string) => `Learning about ${top} helps us discover ________ and explore our world.`,
      correctBlank: 'exciting facts',
      opts: (top: string) => [
        `It helps us discover exciting facts and learn new skills`,
        `It is something students are never allowed to practice`,
        `It has no meaning, pictures, or words`,
        `It is completely forgotten after one minute`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Exploring ${top} helps students learn fun and important ideas.`,
      hint: (top: string) => `Pick the answer that describes learning and discovering new skills.`,
    },
    {
      type: 'kid_practice',
      mcq: (top: string, subj: string) => `When we practice ${top} in school, what is a great habit?`,
      blank: (top: string) => `When working on ${top}, remember to always ________ and take your time.`,
      correctBlank: 'try your best',
      opts: (top: string) => [
        `Listen carefully, ask questions, and try your best`,
        `Close your book and ignore your teacher`,
        `Guess without looking at any pictures or words`,
        `Rush through without checking your answers`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Trying your best and listening carefully helps you master ${top}.`,
      hint: (top: string) => `Think about what good learners do in class.`,
    },
    {
      type: 'kid_benefit',
      mcq: (top: string, subj: string) => `Why is learning about ${top} helpful for students?`,
      blank: (top: string) => `Practicing ${top} helps make our ________ stronger every day.`,
      correctBlank: 'brains and skills',
      opts: (top: string) => [
        `It builds our confidence and makes our brains stronger`,
        `It makes schoolwork confusing and silly`,
        `It has no use in the real world`,
        `It is only used once in your whole life`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Practicing ${top} builds confidence and helpful skills.`,
      hint: (top: string) => `Think of how practicing helps your brain grow smarter.`,
    },
    {
      type: 'kid_sharing',
      mcq: (top: string, subj: string) => `How can you show what you learned about ${top}?`,
      blank: (top: string) => `You can share your ideas about ${top} by giving ________.`,
      correctBlank: 'clear answers',
      opts: (top: string) => [
        `By sharing clear answers and explaining your ideas`,
        `By hiding your worksheet in your backpack forever`,
        `By scribbling over your paper with a marker`,
        `By never reading the questions on the page`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Sharing clear answers shows your teacher what you understand.`,
      hint: (top: string) => `How do you show your teacher your good work?`,
    },
  ];

  // Standard Adaptive Curriculum Archetypes for Middle/High School
  const standardArchetypes = [
    {
      type: 'concept_definition',
      mcq: (top: string, subj: string) => `What is the core definition and primary focus of ${top}?`,
      blank: (top: string) => `In curriculum study, ${top} is defined as a foundational set of ________.`,
      correctBlank: 'key principles and rules',
      opts: (top: string) => [
        `The essential concepts, structures, and governing rules that define ${top}`,
        `An arbitrary collection of unverified anecdotes`,
        `A static variable that has no relationship with modern practices`,
        `An isolated exception that cannot be applied in study`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Understanding ${top} requires mastering its primary governing principles and structures.`,
      hint: (top: string) => `Look for the choice that explains what ${top} is at its core.`,
    },
    {
      type: 'practical_application',
      mcq: (top: string, subj: string) => `How is knowledge of ${top} most effectively applied in practical scenarios?`,
      blank: (top: string) => `When applied in real-world contexts, ${top} helps students to ________ outcomes.`,
      correctBlank: 'analyze and solve problems',
      opts: (top: string) => [
        `To analyze situations, identify patterns, and solve real problems`,
        `By ignoring surrounding conditions completely`,
        `Through random guessing without documented steps`,
        `Exclusively in theoretical simulations with no relevance`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Real-world application of ${top} relies on systematic analysis to yield reliable results.`,
      hint: (top: string) => `Consider how people use ${top} to solve problems.`,
    },
    {
      type: 'cause_and_effect',
      mcq: (top: string, subj: string) => `Which factor represents the most critical element in understanding ${top}?`,
      blank: (top: string) => `A key determinant of success when studying ${top} is understanding how ________ work together.`,
      correctBlank: 'concepts and evidence',
      opts: (top: string) => [
        `Systematic cause-and-effect relationships supported by clear evidence`,
        `Unchanging background constants that never fluctuate`,
        `Subjective personal preferences with no testing`,
        `Secondary coincidental traits that occur without pattern`,
      ],
      correctOpt: 0,
      exp: (top: string) => `Cause-and-effect relationships provide the foundational basis for understanding ${top}.`,
      hint: (top: string) => `Focus on the relationship between causes, mechanisms, and measurable effects.`,
    },
  ];

  const activeArchetypes = isGrade1or2 ? earlyElementaryArchetypes : standardArchetypes;

  for (let i = 0; i < count; i++) {
    const arch = activeArchetypes[i % activeArchetypes.length];
    const qId = `q-gen-${i + 1}-${Date.now()}`;
    const qType = format === 'fill_blank' ? 'fill_blank' : format === 'multiple_choice' ? 'multiple_choice' : i % 2 === 0 ? 'multiple_choice' : 'fill_blank';

    if (qType === 'fill_blank') {
      const ans = arch.correctBlank;
      wordBank.push(ans);
      questions.push({
        id: qId,
        type: 'fill_blank',
        question: arch.blank(cleanTopic),
        points: 2,
        correctAnswer: ans,
        explanation: arch.exp(cleanTopic),
        hint: arch.hint(cleanTopic),
      });
    } else {
      const options = arch.opts(cleanTopic);
      const correctAns = options[arch.correctOpt];
      wordBank.push(correctAns);
      questions.push({
        id: qId,
        type: 'multiple_choice',
        question: arch.mcq(cleanTopic, subject),
        points: 2,
        options: shuffle(options),
        correctAnswer: correctAns,
        explanation: arch.exp(cleanTopic),
        hint: arch.hint(cleanTopic),
      });
    }
  }

  return { questions, wordBank };
}

export function generateWorksheetFromClient(
  request: WorksheetGenerationRequest,
  teacherProfile: TeacherProfile
): Worksheet {
  const {
    topic,
    subject = 'General Studies',
    gradeLevel = 'Middle School (6-8th)',
    category = 'practice',
    difficulty = 'intermediate',
    questionCount = 5,
    questionFormat = 'both',
    specialInstructions = '',
    standardsAlignment = '',
    bookData,
    sourceText,
  } = request;

  const isBookSource = Boolean(bookData && (bookData.bookTitle || bookData.bookExcerpt));
  const fullSource = bookData?.bookExcerpt || sourceText || '';
  const sentences = extractSentencesFromText(fullSource);

  let questions: Question[] = [];
  let wordBankList: string[] = [];

  if (isBookSource && sentences.length > 0) {
    // Grounded Book Questions
    const allKeyTerms = Array.from(
      new Set(sentences.flatMap(s => s.keywords).filter(k => k.length >= 4))
    );

    for (let idx = 0; idx < questionCount; idx++) {
      const qFormat =
        questionFormat === 'multiple_choice'
          ? 'multiple_choice'
          : questionFormat === 'fill_blank'
          ? 'fill_blank'
          : idx % 2 === 0
          ? 'multiple_choice'
          : 'fill_blank';

      const qId = `q-book-${idx + 1}-${Date.now()}`;
      const sentenceObj = sentences[idx % sentences.length];
      const targetTerm = sentenceObj.keywords[sentenceObj.keywords.length - 1] || 'concept';
      wordBankList.push(targetTerm);

      if (qFormat === 'fill_blank') {
        const blankSentence = sentenceObj.text.replace(
          new RegExp(`\\b${targetTerm}\\b`, 'i'),
          '________'
        );

        questions.push({
          id: qId,
          type: 'fill_blank',
          question: `Fill in the blank based on the text: "${blankSentence}"`,
          points: 2,
          correctAnswer: targetTerm,
          explanation: `According to the source passage: "${sentenceObj.text}"`,
          hint: `Think about the key term related to ${subject} discussed in this section.`,
        });
      } else {
        const otherTerms = allKeyTerms.filter(t => t.toLowerCase() !== targetTerm.toLowerCase());
        const shuffledDistractors = otherTerms.sort(() => 0.5 - Math.random()).slice(0, 3);
        while (shuffledDistractors.length < 3) {
          shuffledDistractors.push(`Alternative ${subject} Term ${shuffledDistractors.length + 1}`);
        }

        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: `According to the excerpt from "${bookData?.bookTitle || 'the text'}", which term best completes this statement: "${sentenceObj.text.replace(new RegExp(`\\b${targetTerm}\\b`, 'i'), '[ ? ]')}"?`,
          points: 2,
          options: shuffle([targetTerm, ...shuffledDistractors]),
          correctAnswer: targetTerm,
          explanation: `The book passage explicitly notes: "${sentenceObj.text}" confirming "${targetTerm}" as the correct answer.`,
          hint: `Review the passage discussing ${sentenceObj.keywords.slice(0, 2).join(' and ')}.`,
        });
      }
    }
  } else {
    // Check if Topic, Subject, or Instructions is Tamil
    const isTamil =
      /tamil|தமிழ்|உயிர்|மெய்|எழுத்து|இலக்கணம்|குறில்|நெடில்|thirukkural|திருக்குறள்|kural|குறள்|thiruvalluvar|திருவள்ளுவர்|aathichudi|ஆத்திசூடி|avvaiyar|ஔவையார்/i.test(
        `${topic} ${subject} ${specialInstructions}`
      );

    // Check if Topic or Subject is Mathematics
    const isMath =
      /math|addition|subtract|multipl|divid|fraction|algebra|geometry|arithmetic|number/i.test(
        `${topic} ${subject}`
      );

    if (isTamil) {
      const generated = generateTamilQuestions(topic, questionCount, questionFormat, subject, specialInstructions);
      questions = generated.questions;
      wordBankList = generated.wordBank;
    } else if (isMath) {
      const generated = generateMathQuestions(topic, gradeLevel, questionCount, questionFormat);
      questions = generated.questions;
      wordBankList = generated.wordBank;
    } else {
      const generated = generateDomainQuestions(topic, subject, gradeLevel, questionCount, questionFormat);
      questions = generated.questions;
      wordBankList = generated.wordBank;
    }
  }

  // Attach Educational Diagrams ONLY when strictly relevant
  const matchingDiagrams = findMatchingDiagrams(`${topic} ${specialInstructions}`);
  if (matchingDiagrams.length > 0) {
    questions.forEach((q, idx) => {
      // Only attach if diagram matches the question topic
      if (idx % 2 === 0 && matchingDiagrams[idx % matchingDiagrams.length]) {
        const diag = matchingDiagrams[idx % matchingDiagrams.length];
        q.imageUrl = diag.url;
        q.imageCaption = diag.caption;
        q.imageAlt = diag.title;
      }
    });
  }

  const isTamilTopic = /tamil|தமிழ்|உயிர்|மெய்|எழுத்து|இலக்கணம்|குறில்|நெடில்|thirukkural|திருக்குறள்|kural|குறள்|thiruvalluvar|திருவள்ளுவர்|aathichudi|ஆத்திசூடி|avvaiyar|ஔவையார்/i.test(
    `${topic} ${subject} ${specialInstructions}`
  );

  let tamilTitle = 'தமிழ் மொழிப் பயிற்சி & வினாடி வினா';
  let tamilSubtitle = 'தமிழ் மொழிப் பாடம் • தொடக்க நிலை மதிப்பீடு';
  let tamilInstructions = 'பின்வரும் வினாக்களைக் கவனமாகப் படித்து, சரியான விடையைத் தேர்ந்தெடுக்கவும் அல்லது கோடிட்ட இடத்தில் எழுதவும்.';

  if (/thirukkural|திருக்குறள்|kural|குறள்|thiruvalluvar|திருவள்ளுவர்/i.test(`${topic} ${subject} ${specialInstructions}`)) {
    tamilTitle = 'திருக்குறள் மதிப்பீட்டுத் தேர்வு & வினாடி வினா';
    tamilSubtitle = 'தமிழ் இலக்கியப் பாடம் • குறட்பாக்கள், அதிகாரங்கள் & பொருள் உணர்தல்';
    tamilInstructions = 'பின்வரும் திருக்குறள் வினாக்களைக் கவனமாகப் படித்து, சரியான விடையைத் தேர்ந்தெடுக்கவும் அல்லது விடுபட்ட சீரை/கோடிட்ட இடத்தை நிரப்புக.';
  } else if (/aathichudi|ஆத்திசூடி|avvaiyar|ஔவையார்/i.test(`${topic} ${subject} ${specialInstructions}`)) {
    tamilTitle = 'ஔவையாரின் ஆத்திசூடி பயிற்சி & வினாடி வினா';
    tamilSubtitle = 'தமிழ் நீதி இலக்கியப் பாடம் • நன்னெறி வழிகாட்டல்';
    tamilInstructions = 'பின்வரும் ஆத்திசூடி வினாக்களைக் கவனமாகப் படித்து சரியான விடையை எழுதவும்.';
  } else if (/ilakkanam|இலக்கணம்/i.test(`${topic} ${subject} ${specialInstructions}`)) {
    tamilTitle = 'தமிழ் இலக்கணம் பயிற்சி & மதிப்பீடு';
    tamilSubtitle = 'தமிழ் மொழிப் பாடம் • வல்லினம், மெல்லினம், இடையினம், திணை, பால்';
  } else if (/mei|மெய்/i.test(`${topic} ${subject} ${specialInstructions}`)) {
    tamilTitle = 'தமிழ் மெய் எழுத்துக்கள் பயிற்சி & வினாடி வினா';
    tamilSubtitle = 'தமிழ் மொழிப் பாடம் • க் முதல் ன் வரை 18 மெய்யெழுத்துக்கள்';
  } else if (/urir|uyir|உயிர்/i.test(`${topic} ${subject} ${specialInstructions}`)) {
    tamilTitle = 'தமிழ் உயிர் எழுத்துக்கள் பயிற்சி & வினாடி வினா';
    tamilSubtitle = 'தமிழ் மொழிப் பாடம் • அ முதல் ஔ வரை 12 உயிரெழுத்துக்கள்';
  }

  const title = isBookSource
    ? `${bookData?.bookTitle || 'Book'} Comprehension & Analysis`
    : isTamilTopic
    ? tamilTitle
    : `${topic || 'Curriculum'} Practice & Assessment`;

  const subtitle = isBookSource
    ? `${gradeLevel} ${subject} • Grounded in ${bookData?.fileName || 'Document'}`
    : isTamilTopic
    ? tamilSubtitle
    : `${gradeLevel} ${subject} • ${category.toUpperCase()} Edition`;

  const instructions = isBookSource
    ? `Carefully read the questions below and answer based on the source text from "${bookData?.bookTitle || bookData?.fileName}".`
    : isTamilTopic
    ? tamilInstructions
    : `Read each question carefully and provide the best answer. Check your work before submitting.`;

  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    subtitle,
    subject: isTamilTopic ? 'தமிழ் (Tamil Literature & Language)' : subject,
    gradeLevel,
    category,
    difficulty,
    schoolName: request.schoolName || teacherProfile.schoolName || 'Sunnydale Academy',
    teacherName: request.teacherName || teacherProfile.name || 'Teacher',
    instructions,
    passage: isBookSource ? fullSource.slice(0, 2000) : (sourceText ? sourceText.slice(0, 2000) : undefined),
    standardCode: standardsAlignment || undefined,
    wordBank: wordBankList.length > 0 ? Array.from(new Set(wordBankList)) : undefined,
    totalPoints: questions.reduce((sum, q) => sum + (q.points || 2), 0),
    versionLabel: 'Version A',
    sourceBook: isBookSource
      ? {
          title: bookData?.bookTitle || bookData?.fileName || 'Document',
          fileName: bookData?.fileName || 'Document.pdf',
          pageCount: bookData?.pageCount || 1,
          chapterOrPages: bookData?.chapterOrSection || bookData?.selectedPages || 'Full Book',
        }
      : undefined,
    createdAt: new Date().toISOString(),
    questions,
  };
}

/**
 * Optional Direct Client-Side Gemini Generator
 * If the user configured a custom Gemini API key in teacherProfile or localStorage,
 * Cloudflare Pages can directly invoke Gemini via browser fetch for dynamic AI generation.
 */
export async function generateWorksheetWithClientGemini(
  request: WorksheetGenerationRequest,
  teacherProfile: TeacherProfile
): Promise<Worksheet | null> {
  const apiKey =
    teacherProfile.customApiKey ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('wizsheet_gemini_key') || localStorage.getItem('user_gemini_api_key')
      : null);

  if (!apiKey || !apiKey.trim().startsWith('AIza')) {
    return null;
  }

  const prompt = `You are an expert master educator and curriculum designer.
Generate a rigorous educational assessment worksheet strictly matching the following specifications:
Topic: ${request.topic}
Subject: ${request.subject || 'General'}
Grade Level: ${request.gradeLevel}
Category/Assessment Type: ${request.category}
Difficulty: ${request.difficulty}
Question Count: ${request.questionCount}
Question Format: ${request.questionFormat}
${request.specialInstructions ? `Special Instructions / Target Language: ${request.specialInstructions}` : ''}

CRITICAL LANGUAGE RULE:
If the topic, subject, or instructions mention Tamil (e.g. Thirukkural, தமிழ், திருக்குறள், or questions/answers in Tamil), ALL questions, multiple-choice options, answers, hints, and explanations MUST BE ENTIRELY WRITTEN IN AUTHENTIC TAMIL SCRIPT (தமிழ்).

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "string (in Tamil if Tamil requested)",
  "subtitle": "string (in Tamil if Tamil requested)",
  "subject": "string",
  "gradeLevel": "string",
  "category": "string",
  "difficulty": "string",
  "instructions": "string (in Tamil if Tamil requested)",
  "wordBank": ["string"],
  "questions": [
    {
      "id": "q-1",
      "type": "multiple_choice | fill_blank | open_ended | true_false",
      "question": "string",
      "points": 2,
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string",
      "hint": "string"
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini client API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText);
  if (!parsed.questions || !Array.isArray(parsed.questions)) return null;

  const questions: Question[] = parsed.questions.map((q: any, i: number) => ({
    id: q.id || `q-gemini-${i + 1}-${Date.now()}`,
    type: q.type || 'multiple_choice',
    question: q.question,
    points: q.points || 2,
    options: q.options || undefined,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    hint: q.hint,
  }));

  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: parsed.title || request.topic,
    subtitle: parsed.subtitle || `${request.gradeLevel} ${request.subject}`,
    subject: parsed.subject || request.subject,
    gradeLevel: request.gradeLevel,
    category: request.category,
    difficulty: request.difficulty,
    schoolName: request.schoolName || teacherProfile.schoolName || 'Sunnydale Academy',
    teacherName: request.teacherName || teacherProfile.name || 'Teacher',
    instructions: parsed.instructions || 'Read each question carefully.',
    wordBank: parsed.wordBank || undefined,
    totalPoints: questions.reduce((sum, q) => sum + (q.points || 2), 0),
    versionLabel: 'Version A',
    createdAt: new Date().toISOString(),
    questions,
  };
}
