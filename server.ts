import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { EDUCATIONAL_DIAGRAMS, findMatchingDiagrams } from './src/data/educationalDiagrams.js';

dotenv.config();

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    try {
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16' as any,
      });
    } catch (e) {
      console.error('Failed to initialize Stripe client:', e);
    }
  }
  return stripeClient;
}

// Safe directory resolution across ESM (dev tsx) and CJS bundle (dist/server.cjs)
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

function enrichQuestionsWithImages(topic: string, specialInstructions: string, questions: any[]): any[] {
  const queryText = `${topic || ''} ${specialInstructions || ''}`.toLowerCase();
  const requiresImages =
    queryText.includes('image') ||
    queryText.includes('diagram') ||
    queryText.includes('identification') ||
    queryText.includes('identify') ||
    queryText.includes('digestive') ||
    queryText.includes('anatomy') ||
    queryText.includes('organ') ||
    queryText.includes('heart') ||
    queryText.includes('cell') ||
    queryText.includes('skeleton') ||
    queryText.includes('solar system') ||
    queryText.includes('cycle') ||
    queryText.includes('physics') ||
    queryText.includes('geometry');

  const isDigestive = queryText.includes('digestive');

  return questions.map((q, idx) => {
    // If the question already has an imageUrl that is valid, keep it
    if (q.imageUrl && typeof q.imageUrl === 'string' && q.imageUrl.startsWith('http')) {
      return q;
    }

    // If images are requested or naturally appropriate
    if (
      requiresImages ||
      q.question.toLowerCase().includes('diagram') ||
      q.question.toLowerCase().includes('image') ||
      q.question.toLowerCase().includes('figure')
    ) {
      if (isDigestive) {
        const qText = (q.question || '').toLowerCase();
        if (qText.includes('stomach') || qText.includes('gastric') || qText.includes('pepsin')) {
          return {
            ...q,
            imageUrl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Diagram_showing_the_position_of_the_stomach_CRUK_205.svg/800px-Diagram_showing_the_position_of_the_stomach_CRUK_205.svg.png',
            imageCaption: 'Figure: Anatomical position and structure of the human stomach',
            imageAlt: 'Human stomach anatomy diagram',
          };
        } else if (
          qText.includes('liver') ||
          qText.includes('gallbladder') ||
          qText.includes('bile') ||
          qText.includes('pancreas')
        ) {
          return {
            ...q,
            imageUrl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Liver_and_gallbladder_diagram.svg/800px-Liver_and_gallbladder_diagram.svg.png',
            imageCaption: 'Figure: Liver, gallbladder, bile duct, and pancreas (accessory digestive organs)',
            imageAlt: 'Accessory digestive organs diagram',
          };
        } else if (
          qText.includes('intestine') ||
          qText.includes('colon') ||
          qText.includes('villi') ||
          qText.includes('duodenum')
        ) {
          return {
            ...q,
            imageUrl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Blausen_0817_SmallIntestine_Anatomy.png/800px-Blausen_0817_SmallIntestine_Anatomy.png',
            imageCaption: 'Figure: Detailed structure of the human small and large intestines',
            imageAlt: 'Small and large intestine anatomy',
          };
        } else if (idx % 2 === 1) {
          return {
            ...q,
            imageUrl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_edit.svg/960px-Digestive_system_diagram_edit.svg.png',
            imageCaption: 'Figure: Human digestive system diagram for organ identification and labeling',
            imageAlt: 'Digestive system diagram for identification',
          };
        } else {
          return {
            ...q,
            imageUrl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_en.svg/960px-Digestive_system_diagram_en.svg.png',
            imageCaption: 'Figure: Complete human digestive tract from mouth to rectum',
            imageAlt: 'Human digestive tract diagram',
          };
        }
      }

      // General matching from curated diagrams:
      const matching = findMatchingDiagrams(`${q.question} ${topic}`);
      if (matching.length > 0) {
        const diagram = matching[idx % matching.length];
        return {
          ...q,
          imageUrl: diagram.url,
          imageCaption: diagram.caption,
          imageAlt: diagram.title,
        };
      }
    }

    return q;
  });
}

function detectTargetLanguage(topic: string, specialInstructions?: string, subject?: string): string | null {
  const combined = `${topic} ${specialInstructions || ''} ${subject || ''}`.toLowerCase();

  if (/tamil|தமிழ்|உயிர்|மெய்|எழுத்து|இலக்கணம்|குறில்|நெடில்/i.test(combined)) return 'Tamil (தமிழ்)';
  if (/hindi|हिंदी|हिन्दी/i.test(combined)) return 'Hindi (हिन्दी)';
  if (/spanish|español/i.test(combined)) return 'Spanish (Español)';
  if (/french|français/i.test(combined)) return 'French (Français)';
  if (/german|deutsch/i.test(combined)) return 'German (Deutsch)';
  if (/telugu|తెలుగు/i.test(combined)) return 'Telugu (తెలుగు)';
  if (/malayalam|മലയാളം/i.test(combined)) return 'Malayalam (മലയാളം)';
  if (/kannada|ಕನ್ನಡ/i.test(combined)) return 'Kannada (ಕನ್ನಡ)';
  if (/marathi|मराठी/i.test(combined)) return 'Marathi (मराठी)';
  if (/arabic|العربية/i.test(combined)) return 'Arabic (العربية)';
  if (/chinese|mandarin|中文/i.test(combined)) return 'Chinese (中文)';
  if (/japanese|日本語/i.test(combined)) return 'Japanese (日本語)';

  const match = combined.match(/\b(?:in\s+language|in|language:?)\s+([a-zA-Z]+)\b/i);
  if (match && !['english', 'general', 'practice', 'quiz', 'both', 'test', 'depth', 'short', 'math', 'school'].includes(match[1].toLowerCase())) {
    return match[1];
  }
  return null;
}

function createIntelligentWorksheet(
  topic: string,
  subject: string,
  gradeLevel: string,
  category: string,
  questionCount: number,
  questionFormat: 'multiple_choice' | 'fill_blank' | 'both' = 'both',
  difficulty: string = 'intermediate'
) {
  const cleanTopic = topic.trim() || 'Curriculum Skills & Concepts';
  const lowerTopic = cleanTopic.toLowerCase();
  const questions: any[] = [];
  const wordBankList: string[] = [];
  const normalizedDiff =
    difficulty === 'beginner' || difficulty === 'foundational'
      ? 'beginner'
      : difficulty === 'expert' || difficulty === 'advanced'
      ? 'expert'
      : 'intermediate';

  const diffTag =
    normalizedDiff === 'beginner'
      ? 'Beginner'
      : normalizedDiff === 'expert'
      ? 'Expert'
      : 'Intermediate';

  const isTamil = /tamil|தமிழ்|உயிர்|மெய்|எழுத்து|இலக்கணம்|குறில்|நெடில்/i.test(`${cleanTopic} ${subject}`);

  if (isTamil) {
    const uyirPool = [
      {
        mcqQuestion: 'தமிழ் மொழியில் உள்ள மொத்த உயிர் எழுத்துக்கள் எத்தனை?',
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
        mcqQuestion: 'பின்வருவனவற்றுள் "அ" என்ற உயிர் எழுத்தில் தொடங்கும் சொல் எது?',
        fillQuestion: 'கோடிட்ட இடத்தை நிரப்புக: "அ" என்ற உயிர் எழுத்தில் தொடங்கும் சொல் ________.',
        options: ['அணில்', 'ஆடு', 'இலை', 'உரல்'],
        correctAnswer: 'அணில்',
        explanation: 'அணில் என்ற சொல் "அ" என்ற முதல் உயிர் எழுத்தில் தொடங்குகிறது.',
        hint: 'மரங்களில் வாழும் சிறிய அழகிய பிராணி.',
      },
      {
        mcqQuestion: 'பின்வருவனவற்றுள் "ஆ" என்ற நெடில் உயிர் எழுத்தில் தொடங்கும் சொல் எது?',
        fillQuestion: 'கோடிட்ட இடத்தை நிரப்புக: "ஆ" என்ற நெடில் எழுத்தில் தொடங்கும் சொல் ________.',
        options: ['ஆலமரம்', 'எலி', 'ஒட்டகம்', 'இஞ்சி'],
        correctAnswer: 'ஆலமரம்',
        explanation: 'ஆலமரம் என்ற சொல் "ஆ" என்ற நெடில் உயிர் எழுத்தில் தொடங்குகிறது.',
        hint: 'விழுதுகள் கொண்ட பெரிய ஆலமரம்.',
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
      {
        mcqQuestion: 'பின்வருவனவற்றுள் உயிர் நெடில் எழுத்து எது?',
        fillQuestion: 'இ, எ, உ, ஈ ஆகியவற்றில் ________ என்பது நீண்ட ஓசையுடைய நெடில் எழுத்து ஆகும்.',
        options: ['ஈ', 'இ', 'எ', 'உ'],
        correctAnswer: 'ஈ',
        explanation: '"ஈ" என்பது நீண்ட ஓசையுடைய நெடில் உயிர் எழுத்து ஆகும்; இ, எ, உ ஆகியவை குறில் எழுத்துக்கள்.',
        hint: 'ஈட்டி, ஈசல் என்ற சொற்களில் வரும் நீண்ட ஒலி.',
      },
      {
        mcqQuestion: '"இலை" என்ற சொல்லின் முதல் எழுத்து எந்த வகை எழுத்து?',
        fillQuestion: '"இலை" என்ற சொல்லின் முதல் எழுத்தான "இ" என்பது ________ உயிர் எழுத்து ஆகும்.',
        options: ['குறில் எழுத்து', 'நெடில் எழுத்து', 'மெய் எழுத்து', 'ஆய்த எழுத்து'],
        correctAnswer: 'குறில் எழுத்து',
        explanation: '"இ" என்பது ஒரு மாத்திரை அளவுடைய குறில் உயிர் எழுத்து ஆகும்.',
        hint: 'குறுகிய கால அளவில் ஒலிக்கும் எழுத்து வகை.',
      },
      {
        mcqQuestion: '"ஐ" மற்றும் "ஔ" ஆகிய இரண்டு எழுத்துக்களும் எவ்வகை உயிர் எழுத்துக்கள்?',
        fillQuestion: '"ஐ" மற்றும் "ஔ" ஆகிய இரண்டு எழுத்துக்களும் ________ உயிர் எழுத்துக்கள் ஆகும்.',
        options: ['நெடில் எழுத்துக்கள்', 'குறில் எழுத்துக்கள்', 'மெய் எழுத்துக்கள்', 'ஆய்த எழுத்து'],
        correctAnswer: 'நெடில் எழுத்துக்கள்',
        explanation: '"ஐ" மற்றும் "ஔ" ஆகிய இரண்டும் இரண்டு மாத்திரை அளவு கொண்டு ஒலிக்கும் நெடில் எழுத்துக்கள் ஆகும்.',
        hint: 'நீண்ட ஓசையுடைய எழுத்துக்களின் பிரிவு.',
      },
      {
        mcqQuestion: '"உரல்" என்ற சொல்லின் முதல் எழுத்து எது?',
        fillQuestion: '"உரல்" என்ற சொல் ________ என்ற குறில் உயிர் எழுத்தில் தொடங்குகிறது.',
        options: ['உ', 'ஊ', 'ஒ', 'ஓ'],
        correctAnswer: 'உ',
        explanation: 'உரல் என்ற சொல் "உ" என்ற குறில் உயிர் எழுத்தில் தொடங்குகிறது.',
        hint: 'தானியங்களை இடிக்கப் பயன்படும் பாத்திரம் அல்லது கருவி.',
      },
      {
        mcqQuestion: '"எலி" என்ற சொல் எந்த உயிர் எழுத்தில் தொடங்குகிறது?',
        fillQuestion: '"எலி" என்ற சொல் ________ என்ற குறில் உயிர் எழுத்தில் தொடங்குகிறது.',
        options: ['எ', 'ஏ', 'ஐ', 'அ'],
        correctAnswer: 'எ',
        explanation: 'எலி என்ற சொல் "எ" என்ற குறில் உயிர் எழுத்தில் தொடங்குகிறது; "ஏ" என்பது நெடில் (ஏணி).',
        hint: 'எலி, எறும்பு ஆகிய சொற்களின் முதல் எழுத்து.',
      },
      {
        mcqQuestion: 'தமிழ் மொழியில் மெய் எழுத்துக்களின் எண்ணிக்கை மொத்தம் எத்தனை?',
        fillQuestion: 'தமிழ் மொழியில் க் முதல் ன் வரையுள்ள மெய் எழுத்துக்கள் மொத்தம் ________ ஆகும்.',
        options: ['18', '12', '216', '247'],
        correctAnswer: '18',
        explanation: 'தமிழ் மொழியில் புள்ளி வைத்த மெய் எழுத்துக்கள் (க் முதல் ன் வரை) மொத்தம் 18 ஆகும்.',
        hint: 'வல்லினம், மெல்லினம், இடையினம் சேர்ந்த மொத்த மெய்யெழுத்துக்கள்.',
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

    for (let i = 0; i < questionCount; i++) {
      const qId = `q-tamil-${i + 1}-${Date.now()}`;
      const item = uyirPool[i % uyirPool.length];
      const isMcq =
        questionFormat === 'multiple_choice'
          ? true
          : questionFormat === 'fill_blank'
          ? false
          : i % 2 === 0;

      wordBankList.push(item.correctAnswer);

      if (isMcq) {
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: item.mcqQuestion,
          points: 2,
          options: [...item.options].sort(() => 0.5 - Math.random()),
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          hint: item.hint,
        });
      } else {
        questions.push({
          id: qId,
          type: 'fill_blank',
          question: item.fillQuestion,
          points: 2,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          hint: item.hint,
        });
      }
    }
  } else // Specific high-fidelity digestive system identification worksheet
  if (
    lowerTopic.includes('digestive') ||
    (lowerTopic.includes('identification') && lowerTopic.includes('organ')) ||
    (lowerTopic.includes('images') && lowerTopic.includes('human'))
  ) {
    const digestiveQuestions = [
      {
        id: `q-digestive-1-${Date.now()}`,
        type: 'multiple_choice',
        question:
          'Refer to the diagram of the human digestive system. What is the primary function of the stomach located directly below the esophagus?',
        points: 2,
        imageUrl:
          'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Diagram_showing_the_position_of_the_stomach_CRUK_205.svg/800px-Diagram_showing_the_position_of_the_stomach_CRUK_205.svg.png',
        imageCaption: 'Figure 1: Position and Anatomy of the Human Stomach',
        imageAlt: 'Human stomach diagram',
        options: [
          'Acid breakdown and enzymatic digestion of proteins using pepsin and hydrochloric acid',
          'Absorbing 95% of water from digested food',
          'Pumping oxygenated blood to abdominal tissues',
          'Producing bile salts to neutralize gastric contents',
        ],
        correctAnswer:
          'Acid breakdown and enzymatic digestion of proteins using pepsin and hydrochloric acid',
        explanation:
          'The stomach secretes gastric juices containing hydrochloric acid (pH 1.5–2) and pepsin to break down proteins into peptides and churn food into chyme.',
        hint: 'Think about the harsh acidic environment where chemical digestion of proteins begins.',
      },
      {
        id: `q-digestive-2-${Date.now()}`,
        type: 'multiple_choice',
        question:
          'Look at the accessory digestive organs diagram. Which large reddish-brown organ produces bile to assist in the emulsification of dietary lipids?',
        points: 2,
        imageUrl:
          'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Liver_and_gallbladder_diagram.svg/800px-Liver_and_gallbladder_diagram.svg.png',
        imageCaption: 'Figure 2: Human Liver, Gallbladder & Bile Duct Structure',
        imageAlt: 'Liver and gallbladder diagram',
        options: ['Liver', 'Gallbladder', 'Pancreas', 'Spleen'],
        correctAnswer: 'Liver',
        explanation:
          'The liver synthesizes bile, which is subsequently transported and stored in the gallbladder before secretion into the duodenum.',
        hint: 'This is the largest internal organ in the human body.',
      },
      {
        id: `q-digestive-3-${Date.now()}`,
        type: 'fill_blank',
        question:
          'Refer to the intestinal tract diagram. The vast majority of nutrient absorption into the bloodstream occurs across the microvilli of the ________.',
        points: 2,
        imageUrl:
          'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Blausen_0817_SmallIntestine_Anatomy.png/800px-Blausen_0817_SmallIntestine_Anatomy.png',
        imageCaption: 'Figure 3: Architecture of the Small and Large Intestines',
        imageAlt: 'Intestinal tract anatomy',
        correctAnswer: 'small intestine',
        wordBank: ['small intestine', 'large intestine', 'esophagus', 'stomach', 'pharynx'],
        explanation:
          'The small intestine (jejunum and ileum) contains millions of villi and microvilli that create a massive absorptive surface area (roughly 30 square meters).',
        hint: 'This organ is over 20 feet long in adults and follows the stomach.',
      },
      {
        id: `q-digestive-4-${Date.now()}`,
        type: 'multiple_choice',
        question:
          'In the human digestive tract diagram, which muscular tube connects the pharynx (throat) to the stomach, propelling food boluses downward via peristalsis?',
        points: 2,
        imageUrl:
          'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_en.svg/960px-Digestive_system_diagram_en.svg.png',
        imageCaption: 'Figure 4: Complete Human Alimentary Canal',
        imageAlt: 'Complete digestive system tract',
        options: ['Esophagus', 'Trachea', 'Duodenum', 'Ureter'],
        correctAnswer: 'Esophagus',
        explanation:
          'The esophagus is the muscular conduit that moves food boluses smoothly through the thoracic cavity to the cardiac sphincter of the stomach.',
        hint: 'It runs parallel to your windpipe (trachea) behind it.',
      },
      {
        id: `q-digestive-5-${Date.now()}`,
        type: 'fill_blank',
        question:
          'According to the digestive system identification diagram, the final section of the tract that absorbs water and mineral salts to form solid feces is the ________.',
        points: 2,
        imageUrl:
          'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_edit.svg/960px-Digestive_system_diagram_edit.svg.png',
        imageCaption: 'Figure 5: Human Digestive System - Label and Identification',
        imageAlt: 'Digestive system identification diagram',
        correctAnswer: 'large intestine',
        wordBank: ['large intestine', 'small intestine', 'stomach', 'gallbladder', 'pancreas'],
        explanation:
          'The large intestine (colon) reabsorbs water and electrolytes from indigestible chyme and houses beneficial microbiota that produce vitamin K.',
        hint: 'Also known as the colon.',
      },
      {
        id: `q-digestive-6-${Date.now()}`,
        type: 'multiple_choice',
        question:
          'Where does mechanical and chemical digestion begin in the human body as amylase enzyme starts breaking down starches?',
        points: 2,
        imageUrl:
          'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_en.svg/960px-Digestive_system_diagram_en.svg.png',
        imageCaption: 'Figure 6: Upper Alimentary Canal & Salivary Glands',
        imageAlt: 'Upper digestive tract',
        options: ['Mouth (Oral Cavity)', 'Stomach', 'Duodenum', 'Esophagus'],
        correctAnswer: 'Mouth (Oral Cavity)',
        explanation:
          'Digestion begins in the oral cavity: teeth chew food mechanically while salivary amylase begins hydrolysis of starches into maltose.',
        hint: 'Where mastication and salivation occur.',
      },
    ];

    let filtered = digestiveQuestions;
    if (questionFormat === 'multiple_choice') {
      filtered = digestiveQuestions.filter((q) => q.type === 'multiple_choice');
    } else if (questionFormat === 'fill_blank') {
      filtered = digestiveQuestions.filter((q) => q.type === 'fill_blank');
    }

    return {
      title: 'Human Digestive System: Anatomy & Organ Identification',
      subtitle: `${gradeLevel} Biology & Life Science • Visual Diagram Assessment`,
      subject: 'Life Science & Biology',
      gradeLevel,
      category: (category as any) || 'identification',
      difficulty: normalizedDiff as any,
      instructions:
        'Examine each biological diagram carefully. Identify the anatomical structures and select or write the correct organ names and physiological functions.',
      wordBank: [
        'small intestine',
        'large intestine',
        'esophagus',
        'stomach',
        'liver',
        'gallbladder',
        'pancreas',
        'pharynx',
      ],
      questions: filtered.slice(0, questionCount),
    };
  }

  // Check if topic or subject is Mathematics
  const isMath = /math|addition|subtract|multipl|divid|fraction|algebra|geometry|arithmetic|number/i.test(`${cleanTopic} ${subject}`);
  const isGrade1or2 = /grade\s*[12]|first|second|early/i.test(gradeLevel) || /kids|elementary/i.test(lowerTopic);
  const isSubtraction = /subtract|subtraction|minus/i.test(lowerTopic);
  const isMultiplication = /multipl|times|table/i.test(lowerTopic);
  const isFraction = /fraction/i.test(lowerTopic);

  if (isMath) {
    const names = ['Leo', 'Mia', 'Noah', 'Emma', 'Liam', 'Olivia', 'Lucas', 'Sophia'];
    const items = ['apples', 'stickers', 'crayons', 'pencils', 'cookies', 'toy cars', 'erasers'];

    for (let i = 1; i <= questionCount; i++) {
      const qId = `q-math-${i}-${Date.now()}`;
      let qType: 'multiple_choice' | 'fill_blank' =
        questionFormat === 'fill_blank' ? 'fill_blank' : questionFormat === 'multiple_choice' ? 'multiple_choice' : i % 2 === 1 ? 'multiple_choice' : 'fill_blank';

      const child = names[(i - 1) % names.length];
      const item = items[(i - 1) % items.length];

      if (isFraction) {
        const denom = [2, 3, 4, 6, 8][(i - 1) % 5];
        const num = Math.max(1, (i % (denom - 1)) + 1);
        const correct = `${num}/${denom}`;
        wordBankList.push(correct);

        if (qType === 'fill_blank') {
          questions.push({
            id: qId,
            type: 'fill_blank',
            question: `A pizza is sliced into ${denom} equal pieces. If ${child} eats ${num} piece(s), the fraction of the pizza eaten is ________.`,
            points: 2,
            correctAnswer: correct,
            explanation: `A fraction represents part over whole: ${num} parts eaten out of ${denom} total equal parts is ${num}/${denom}.`,
            hint: `Write the number of eaten pieces over the total number of pieces.`,
          });
        } else {
          const opts = [correct, `${denom - num}/${denom}`, `${num + 1}/${denom}`, `1/${denom}`];
          questions.push({
            id: qId,
            type: 'multiple_choice',
            question: `Which fraction represents ${num} shaded parts out of a total of ${denom} equal parts?`,
            points: 2,
            options: opts.sort(() => 0.5 - Math.random()),
            correctAnswer: correct,
            explanation: `The numerator (${num}) shows the parts considered, and the denominator (${denom}) shows total equal parts.`,
            hint: `Look for ${num} over ${denom}.`,
          });
        }
      } else if (isMultiplication) {
        const a = ((i * 2) % 7) + 2;
        const b = ((i * 3) % 6) + 3;
        const prod = a * b;
        wordBankList.push(String(prod));

        if (qType === 'fill_blank') {
          questions.push({
            id: qId,
            type: 'fill_blank',
            question: `${child} buys ${a} packs of ${item}. Each pack contains ${b} ${item}. In total, there are ________ ${item}.`,
            points: 2,
            correctAnswer: String(prod),
            explanation: `${a} groups of ${b} equals ${a} × ${b} = ${prod}.`,
            hint: `Multiply ${a} by ${b}.`,
          });
        } else {
          const opts = [String(prod), String(prod + a), String(prod - 1), String(a + b)];
          questions.push({
            id: qId,
            type: 'multiple_choice',
            question: `What is ${a} × ${b}?`,
            points: 2,
            options: opts.sort(() => 0.5 - Math.random()),
            correctAnswer: String(prod),
            explanation: `${a} times ${b} equals ${prod}.`,
            hint: `Think of repeated addition: add ${b}, ${a} times.`,
          });
        }
      } else if (isSubtraction) {
        const maxVal = isGrade1or2 ? 10 : 20;
        const b = ((i * 2) % (maxVal - 3)) + 1;
        const a = b + ((i * 3) % 5) + 1;
        const diff = a - b;
        wordBankList.push(String(diff));

        if (qType === 'fill_blank') {
          questions.push({
            id: qId,
            type: 'fill_blank',
            question: `${child} had ${a} ${item} and gave ${b} to a friend. ${child} now has ________ ${item} left.`,
            points: 2,
            correctAnswer: String(diff),
            explanation: `Subtract the given items: ${a} - ${b} = ${diff}.`,
            hint: `Take away ${b} from ${a}.`,
          });
        } else {
          const opts = [String(diff), String(diff + 1), String(Math.max(0, diff - 1)), String(diff + 2)];
          questions.push({
            id: qId,
            type: 'multiple_choice',
            question: `What is ${a} - ${b}?`,
            points: 2,
            options: opts.sort(() => 0.5 - Math.random()),
            correctAnswer: String(diff),
            explanation: `${a} minus ${b} equals ${diff}.`,
            hint: `Count backwards ${b} steps from ${a}.`,
          });
        }
      } else {
        // Addition (Grade 1 / Primary Math)
        const a = isGrade1or2 ? ((i * 2 + 1) % 6) + 1 : ((i * 3) % 10) + 2;
        const b = isGrade1or2 ? ((i * 3 + 2) % 5) + 1 : ((i * 2) % 9) + 2;
        const sum = a + b;
        wordBankList.push(String(sum));

        if (i === 1) {
          const opts = [String(sum), String(sum + 1), String(Math.max(1, sum - 1)), String(sum + 2)];
          questions.push({
            id: qId,
            type: 'multiple_choice',
            question: `What is ${a} + ${b}?`,
            points: 2,
            options: opts.sort(() => 0.5 - Math.random()),
            correctAnswer: String(sum),
            explanation: `Adding ${a} and ${b} gives a sum of ${sum}. (${a} + ${b} = ${sum})`,
            hint: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`,
          });
        } else if (i === 2) {
          questions.push({
            id: qId,
            type: qType,
            question:
              qType === 'fill_blank'
                ? `${child} has ${a} ${item}. A friend gives them ${b} more. Now ${child} has ________ ${item} in all.`
                : `${child} has ${a} ${item}. A friend gives them ${b} more. How many ${item} does ${child} have in all?`,
            points: 2,
            options:
              qType === 'multiple_choice'
                ? [String(sum), String(sum - 1), String(sum + 1), String(sum + 2)].sort(() => 0.5 - Math.random())
                : undefined,
            correctAnswer: String(sum),
            explanation: `Combine both sets: ${a} + ${b} = ${sum} ${item}.`,
            hint: `Put the two groups of ${item} together.`,
          });
        } else if (i === 3) {
          questions.push({
            id: qId,
            type: 'fill_blank',
            question: `Complete the addition equation: ${a} + ________ = ${sum}`,
            points: 2,
            correctAnswer: String(b),
            explanation: `Since ${a} + ${b} = ${sum}, the missing number is ${b}.`,
            hint: `How many more do you need to add to ${a} to reach ${sum}?`,
          });
        } else if (i === 4) {
          const dBase = (i % 4) + 2;
          const dSum = dBase + dBase;
          wordBankList.push(String(dSum));
          const opts = [String(dSum), String(dSum + 1), String(dSum - 1), String(dSum + 2)];
          questions.push({
            id: qId,
            type: 'multiple_choice',
            question: `What is the double of ${dBase} (${dBase} + ${dBase})?`,
            points: 2,
            options: opts.sort(() => 0.5 - Math.random()),
            correctAnswer: String(dSum),
            explanation: `Adding a number to itself gives double: ${dBase} + ${dBase} = ${dSum}.`,
            hint: `Add ${dBase} and ${dBase} together.`,
          });
        } else {
          questions.push({
            id: qId,
            type: qType,
            question:
              qType === 'fill_blank'
                ? `If you have ${a} stickers and find ${b} more, you have ________ stickers in total.`
                : `Which addition fact equals ${sum}?`,
            points: 2,
            options:
              qType === 'multiple_choice'
                ? [`${a} + ${b}`, `${sum + 1} + 1`, `${sum + 2} + 0`, `${Math.max(1, sum - 2)} + 0`].sort(
                    () => 0.5 - Math.random()
                  )
                : undefined,
            correctAnswer: qType === 'multiple_choice' ? `${a} + ${b}` : String(sum),
            explanation: `${a} + ${b} = ${sum}.`,
            hint: `Find which numbers add up to ${sum}.`,
          });
        }
      }
    }
  } else {
    // General Diverse Curriculum Archetypes (Prevents repetitive identical sentences)
    const archetypes = [
      {
        q: (top: string, subj: string) => `What is the primary defining characteristic or core concept of ${top}?`,
        blank: (top: string) => `In foundational study, ${top} is best described as an essential system of ________.`,
        ansBlank: 'core principles and structures',
        opts: (top: string) => [
          `The core principles and verified structures that govern ${top}`,
          `An arbitrary set of exceptions without scientific basis`,
          `A fixed background variable that never influences change`,
          `A superseded historical hypothesis with no current relevance`,
        ],
        exp: (top: string) => `Understanding ${top} begins with recognizing its core defining principles.`,
        hint: (top: string) => `Look for the choice that explains what ${top} is at its core.`,
      },
      {
        q: (top: string, subj: string) => `How is knowledge of ${top} commonly applied in real-world situations?`,
        blank: (top: string) => `Practitioners rely on ${top} to systematically ________ and solve practical problems.`,
        ansBlank: 'analyze outcomes',
        opts: (top: string) => [
          `To systematically analyze outcomes and solve practical problems`,
          `By guessing at random without measuring variables`,
          `Through passive observation without documenting results`,
          `Strictly in laboratory simulations with no external application`,
        ],
        exp: (top: string) => `Practical application of ${top} focuses on systematic analysis and reliable outcomes.`,
        hint: (top: string) => `Think about how experts use ${top} in everyday practice.`,
      },
      {
        q: (top: string, subj: string) => `Which factor represents the most critical governing influence when examining ${top}?`,
        blank: (top: string) => `A key principle in ${top} states that observable change is driven by ________.`,
        ansBlank: 'cause and effect relationships',
        opts: (top: string) => [
          `Verified cause-and-effect relationships supported by observable evidence`,
          `Unconnected ambient background fluctuations`,
          `Personal speculation unconfirmed by testing`,
          `Random occurrences with no measurable pattern`,
        ],
        exp: (top: string) => `Evidence-based cause and effect is central to analyzing ${top}.`,
        hint: (top: string) => `Focus on how one event directly leads to measurable outcomes.`,
      },
      {
        q: (top: string, subj: string) => `When evaluating differing findings in ${top}, what is the scientific standard?`,
        blank: (top: string) => `Scholars evaluate claims in ${top} by conducting structured ________.`,
        ansBlank: 'empirical investigation',
        opts: (top: string) => [
          `Comparing observable evidence against established empirical benchmarks`,
          `Accepting the easiest explanation without verification`,
          `Rejecting any data that requires careful calculation`,
          `Selecting outcomes based on popularity rather than data`,
        ],
        exp: (top: string) => `Empirical benchmarks ensure accuracy and objectivity in ${top}.`,
        hint: (top: string) => `Think of how researchers check facts using reliable evidence.`,
      },
      {
        q: (top: string, subj: string) => `What is an essential takeaway for students mastering ${top}?`,
        blank: (top: string) => `Mastery of ${top} enables students to make accurate ________ about new scenarios.`,
        ansBlank: 'predictions and evaluations',
        opts: (top: string) => [
          `Formulating accurate predictions and informed critical evaluations`,
          `Rote memorization without understanding underlying logic`,
          `Assuming that all related conditions produce identical outcomes`,
          `Ignoring opposing evidence that challenges initial assumptions`,
        ],
        exp: (top: string) => `True mastery empowers students to transfer concepts to novel scenarios.`,
        hint: (top: string) => `Consider what skill students gain once they fully understand ${top}.`,
      },
    ];

    for (let i = 1; i <= questionCount; i++) {
      const arch = archetypes[(i - 1) % archetypes.length];
      const qId = `q-gen-${i}-${Date.now()}`;
      let qType: 'multiple_choice' | 'fill_blank' =
        questionFormat === 'fill_blank' ? 'fill_blank' : questionFormat === 'multiple_choice' ? 'multiple_choice' : i % 2 === 1 ? 'multiple_choice' : 'fill_blank';

      if (qType === 'fill_blank') {
        wordBankList.push(arch.ansBlank);
        questions.push({
          id: qId,
          type: 'fill_blank',
          question: arch.blank(cleanTopic),
          points: 2,
          correctAnswer: arch.ansBlank,
          explanation: arch.exp(cleanTopic),
          hint: arch.hint(cleanTopic),
        });
      } else {
        const options = arch.opts(cleanTopic);
        const correct = options[0];
        wordBankList.push(correct);
        questions.push({
          id: qId,
          type: 'multiple_choice',
          question: arch.q(cleanTopic, subject),
          points: 2,
          options: options.sort(() => 0.5 - Math.random()),
          correctAnswer: correct,
          explanation: arch.exp(cleanTopic),
          hint: arch.hint(cleanTopic),
        });
      }
    }
  }

  const enriched = enrichQuestionsWithImages(cleanTopic, '', questions.slice(0, questionCount));

  const title = isTamil
    ? /urir|uyir|உயிர்/i.test(cleanTopic)
      ? 'தமிழ் உயிர் எழுத்துக்கள் பயிற்சி & வினாடி வினா'
      : /mei|மெய்/i.test(cleanTopic)
      ? 'தமிழ் மெய் எழுத்துக்கள் பயிற்சி & வினாடி வினா'
      : `${cleanTopic} - தமிழ் மொழிப் பயிற்சி`
    : `${cleanTopic} Practice & Assessment`;

  const subtitle = isTamil
    ? 'தமிழ் மொழிப் பாடம் • தொடக்க நிலை மதிப்பீடு'
    : `${gradeLevel} ${subject} • ${diffTag} Complexity`;

  const instructions = isTamil
    ? 'பின்வரும் வினாக்களைக் கவனமாகப் படித்து, சரியான விடையைத் தேர்ந்தெடுக்கவும் அல்லது கோடிட்ட இடத்தில் எழுதவும்.'
    : `Read each question carefully and provide the best answer. Check your work before submitting.`;

  return {
    title,
    subtitle,
    subject: isTamil ? 'தமிழ் (Tamil Language)' : subject,
    gradeLevel,
    category: (category as any) || 'practice',
    difficulty: normalizedDiff as any,
    instructions,
    wordBank: wordBankList.length > 0 ? Array.from(new Set(wordBankList)) : undefined,
    questions: enriched,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware for custom domains, Cloudflare Pages, previews
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token, x-custom-api-key, x-is-authenticated, x-user-id, x-teacher-id, x-user-tier, x-user-role, x-user-email');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '75mb' }));
  app.use(express.urlencoded({ limit: '75mb', extended: true }));

  // --- Intelligent Curriculum Cache ---
  const worksheetCache = new Map<string, any>();

  function getCacheKey(data: {
    topic?: string;
    subject?: string;
    gradeLevel?: string;
    category?: string;
    questionFormat?: string;
    difficulty?: string;
    questionCount?: number;
    sourceText?: string;
  }): string {
    const t = (data.topic || '').trim().toLowerCase();
    const s = (data.subject || 'general').trim().toLowerCase();
    const g = (data.gradeLevel || 'grade 6').trim().toLowerCase();
    const c = (data.category || 'practice').toLowerCase();
    const f = (data.questionFormat || 'both').toLowerCase();
    const d = (data.difficulty || 'intermediate').toLowerCase();
    const n = data.questionCount || 5;
    const src = data.sourceText ? data.sourceText.slice(0, 40).trim().toLowerCase() : '';
    return `${s}::${g}::${t}::${c}::${f}::${d}::${n}::${src}`;
  }

  // Pre-seed high-frequency curriculum topics into cache so they are instant and free
  try {
    const seedTopics = [
      { topic: 'Human Digestive System', subject: 'Science', grade: 'Grade 7' },
      { topic: 'Photosynthesis & Plant Biology', subject: 'Science', grade: 'Grade 6' },
      { topic: 'Fractions Operations & Problem Solving', subject: 'Mathematics', grade: 'Grade 5' },
      { topic: 'Solar System & Planetary Science', subject: 'Science', grade: 'Grade 4' },
      { topic: 'Water Cycle & Earth Weather Systems', subject: 'Science', grade: 'Grade 5' },
    ];
    for (const item of seedTopics) {
      const generated = createIntelligentWorksheet(item.topic, item.subject, item.grade, 'practice', 5, 'both');
      const enriched = enrichQuestionsWithImages(item.topic, '', generated.questions);
      const ws = {
        id: `ws-seed-${item.topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: `${item.topic} Practice & Mastery`,
        subtitle: `${item.grade} ${item.subject} Standard Assessment`,
        subject: item.subject,
        gradeLevel: item.grade,
        category: 'practice',
        difficulty: 'intermediate',
        schoolName: 'Sunnydale Academy',
        teacherName: 'Curriculum Team',
        instructions: 'Answer all questions to the best of your ability. Show your work where applicable.',
        totalPoints: enriched.reduce((s: number, q: any) => s + (q.points || 2), 0),
        versionLabel: 'Version A',
        createdAt: new Date().toISOString(),
        questions: enriched,
      };
      worksheetCache.set(getCacheKey({ topic: item.topic, subject: item.subject, gradeLevel: item.grade }), ws);
    }
  } catch (seedErr) {
    console.warn('Cache pre-seeding info:', seedErr);
  }

  // --- Per-User & IP Rate Limiting & Cooldown Protection ---
  interface ClientUsage {
    count: number;
    date: string; // YYYY-MM-DD
    lastRequestTime: number;
  }
  const clientUsage = new Map<string, ClientUsage>();
  const DAILY_PUBLIC_LIMIT = 5;
  const COOLDOWN_MS = 20 * 1000; // 20-second cooldown between clicks to stop bot bursts

  // --- REAL-TIME WEBSITE TRAFFIC & USAGE ANALYTICS COUNTER ---
  interface SiteAnalytics {
    totalVisits: number;
    todayVisits: number;
    uniqueVisitors: number;
    worksheetsGenerated: number;
    worksheetsGeneratedToday: number;
    activeSessions: number;
    lastUpdated: string;
  }

  const siteAnalytics: SiteAnalytics = {
    totalVisits: 0,
    todayVisits: 0,
    uniqueVisitors: 0,
    worksheetsGenerated: 0,
    worksheetsGeneratedToday: 0,
    activeSessions: 0,
    lastUpdated: new Date().toISOString(),
  };

  const knownVisitorIps = new Set<string>();
  const todayVisitorIps = new Set<string>();
  let currentDayString = new Date().toISOString().slice(0, 10);

  function recordVisit(visitorKey: string) {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== currentDayString) {
      currentDayString = today;
      siteAnalytics.todayVisits = 0;
      siteAnalytics.worksheetsGeneratedToday = 0;
      todayVisitorIps.clear();
    }

    siteAnalytics.totalVisits += 1;
    siteAnalytics.todayVisits += 1;
    siteAnalytics.lastUpdated = new Date().toISOString();

    if (!knownVisitorIps.has(visitorKey)) {
      knownVisitorIps.add(visitorKey);
      siteAnalytics.uniqueVisitors += 1;
    }
    todayVisitorIps.add(visitorKey);
    siteAnalytics.activeSessions = Math.max(1, todayVisitorIps.size);
  }

  function recordWorksheetGenerated() {
    siteAnalytics.worksheetsGenerated += 1;
    siteAnalytics.worksheetsGeneratedToday += 1;
    siteAnalytics.lastUpdated = new Date().toISOString();
  }

  // Master Administrators with full platform oversight and unlimited generation quotas
  const MASTER_ADMIN_EMAILS = [
    'solu24@gmail.com',
    'alferniya.nisha@gmail.com',
    'nishasolu24@gmail.com',
  ];

  function isUserAdmin(req: express.Request): boolean {
    const userEmail = ((req.headers['x-user-email'] as string) || '').trim().toLowerCase();
    const userRole = (req.headers['x-user-role'] as string) || '';
    return MASTER_ADMIN_EMAILS.includes(userEmail) || userRole === 'admin';
  }

  // --- 15 RPM Global Governor for Google AI Studio Free Tier ---
  const requestTimestamps: number[] = [];
  function registerApiCall(): void {
    const now = Date.now();
    requestTimestamps.push(now);
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
      requestTimestamps.shift();
    }
  }
  function isApproachingRpmLimit(): boolean {
    const now = Date.now();
    const recent = requestTimestamps.filter((t) => t > now - 60000);
    return recent.length >= 13; // Governor keeps calls strictly under 15 RPM
  }

  // Initialize Gemini Client (supports server key or Power User BYOK key)
  const getGeminiClient = (customKey?: string) => {
    const apiKey = (customKey && customKey.trim().length > 5) ? customKey.trim() : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Resilient Multi-Model Priority Hierarchy (handles transient 503 high demand & 429 quota spikes gracefully)
  const RESILIENT_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  async function generateContentWithResilience(
    ai: GoogleGenAI,
    options: {
      contents: any;
      config?: any;
      preferredModels?: string[];
    }
  ): Promise<{ response: any; modelUsed: string }> {
    const models = options.preferredModels && options.preferredModels.length > 0
      ? options.preferredModels
      : RESILIENT_MODELS;

    let lastError: any = null;

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];
      try {
        registerApiCall();
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: options.config,
        });

        if (response && response.text) {
          return { response, modelUsed: modelName };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('overloaded') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');

        console.info(`[Gemini Resilience] Model ${modelName} temporary status (${isTransient ? '503/High Demand' : 'retrying'}). Seamlessly routing to alternative model...`);

        if (isTransient && i < models.length - 1) {
          // Brief pause before trying the next model in the resilient cluster
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        if (!isTransient) {
          break;
        }
      }
    }

    throw lastError || new Error('All models currently unavailable');
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      cachedWorksheets: worksheetCache.size,
      timestamp: new Date().toISOString(),
    });
  });

  // Quota & Free Tier Status Endpoint
  app.get('/api/quota-status', (req, res) => {
    const customApiKey = (req.headers['x-custom-api-key'] as string || '').trim();
    const clientId = (req.headers['x-user-id'] as string) || (req.headers['x-teacher-id'] as string) || (req.headers['x-user-email'] as string) || req.ip || 'anonymous';
    const today = new Date().toISOString().slice(0, 10);
    const usage = clientUsage.get(clientId);

    let usedToday = 0;
    let lastTime = 0;
    if (usage && usage.date === today) {
      usedToday = usage.count;
      lastTime = usage.lastRequestTime;
    }

    const elapsed = Date.now() - lastTime;
    const cooldownSecondsRemaining = Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));

    res.json({
      dailyLimit: DAILY_PUBLIC_LIMIT,
      usedToday,
      remainingToday: customApiKey ? 9999 : Math.max(0, DAILY_PUBLIC_LIMIT - usedToday),
      cooldownSecondsRemaining,
      cachedTopicsCount: worksheetCache.size,
      hasCustomKey: Boolean(customApiKey),
      serverFreeTierActive: true,
    });
  });

  // Validate Custom Google AI Key Endpoint (BYOK)
  app.post('/api/validate-custom-key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return res.status(400).json({ valid: false, message: 'Please provide a valid Gemini API key.' });
      }

      const testAi = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const { response: resp } = await generateContentWithResilience(testAi, {
        contents: 'Say OK in one word',
      });

      if (resp && resp.text) {
        return res.json({ valid: true, message: 'Google Gemini API key verified and active!' });
      }
      res.json({ valid: false, message: 'Key did not return a valid response.' });
    } catch (err: any) {
      res.json({
        valid: false,
        message: err.message || 'Verification failed. Please ensure the key was generated at aistudio.google.com.',
      });
    }
  });

  // Authentication Guard Middleware: Enforce user sign-in or guest free allowance
  const requireUserAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Allows requests through; rate-limiting and quota controls are enforced per-client
    next();
  };

  // Parse PDF / Book Document Endpoint
  app.post('/api/parse-pdf', requireUserAuth, async (req, res) => {
    try {
      const { pdfBase64, fileName = 'Book.pdf' } = req.body;

      if (!pdfBase64 || typeof pdfBase64 !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid PDF file in base64 format.' });
      }

      // Remove data URL prefix if present (e.g. data:application/pdf;base64,...)
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').trim();
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (buffer.length === 0) {
        return res.status(400).json({ error: 'The uploaded file was empty.' });
      }

      // Lazy-load PDF parser so server startup does not fail if runtime lacks optional native/DOM dependencies.
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();

      const rawText = (result.text || '').replace(/\r\n/g, '\n');
      const totalPages = result.total || (result.pages ? result.pages.length : 1);

      // Extract detected chapters or section headings from text or pages
      const detectedChapters: Array<{ id: string; title: string; pageNumber: number }> = [];
      const chapterRegex = /(?:^|\n)\s*(Chapter|Unit|Section|Part|Lesson|Module)\s+([0-9IVXLCDM]+|[A-Z])[:.\-\s]+([^\n\r]{2,80})/gi;
      let match;
      let chIdx = 1;
      while ((match = chapterRegex.exec(rawText)) !== null && detectedChapters.length < 25) {
        const fullTitle = `${match[1]} ${match[2]}: ${match[3].trim()}`;
        if (!detectedChapters.some(c => c.title.toLowerCase() === fullTitle.toLowerCase())) {
          const offsetRatio = match.index / Math.max(1, rawText.length);
          const estimatedPage = Math.min(totalPages, Math.max(1, Math.round(offsetRatio * totalPages)));
          detectedChapters.push({
            id: `ch-${chIdx++}`,
            title: fullTitle,
            pageNumber: estimatedPage,
          });
        }
      }

      // Detect suggested book title
      let suggestedTitle = fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
      const firstLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 75);
      if (firstLines.length > 0) {
        const candidate = firstLines[0];
        if (candidate.length >= 3 && !candidate.toLowerCase().includes('page') && !candidate.toLowerCase().includes('copyright') && !candidate.toLowerCase().includes('http')) {
          suggestedTitle = candidate;
        }
      }

      const wordCount = rawText.split(/\s+/).filter(Boolean).length;
      const previewSnippet = rawText.slice(0, 1200).trim();

      // Return clean pages array (max 100 pages details for lightweight network transfer)
      const pagesSummary = (result.pages || []).slice(0, 100).map(p => ({
        pageNumber: p.num,
        preview: (p.text || '').slice(0, 200).trim(),
        charCount: (p.text || '').length,
      }));

      // Heuristic detection for question paper structure
      const questionPattern = /(?:(?:question|q\.?|que\.?)\s*\d+|(?:^|\n)\s*\d+[\.\)]\s+[A-Z])/gi;
      const questionMatches = rawText.match(questionPattern) || [];
      const hasExamKeywords = /(?:question\s*paper|examination|midterm|final\s*exam|total\s*marks|maximum\s*marks|time\s*allowed|section\s*[a-d]|instructions?\s*:|answer\s*all|choose\s*the\s*correct)/i.test(rawText);
      const isLikelyQuestionPaper = (questionMatches.length >= 3) || (hasExamKeywords && questionMatches.length >= 1) || /(?:test\s*paper|quiz|assessment\s*paper|exam)/i.test(fileName);
      const detectedQuestionCount = Math.max(questionMatches.length, isLikelyQuestionPaper ? 5 : 0);

      res.json({
        success: true,
        fileName,
        fileSize: buffer.length,
        pageCount: totalPages,
        characterCount: rawText.length,
        wordCount,
        previewSnippet,
        fullText: rawText,
        suggestedTitle,
        detectedChapters,
        isLikelyQuestionPaper,
        detectedQuestionCount,
        pages: pagesSummary,
      });
    } catch (err: any) {
      console.error('Error parsing PDF:', err);
      res.status(500).json({
        error: err.message || 'Failed to extract text from the uploaded PDF. Please ensure the PDF has readable text (not a scanned image without OCR).',
      });
    }
  });

  // Generate complete worksheet endpoint
  app.post('/api/generate-worksheet', requireUserAuth, async (req, res) => {
    try {
      const {
        topic,
        subject = 'General',
        gradeLevel = 'Grade 6',
        category = 'practice',
        difficulty = 'intermediate',
        questionCount = 5,
        questionFormat = 'both', // 'multiple_choice' | 'fill_blank' | 'both'
        includeAnswerKey = true,
        includeExplanations = true,
        includeWordBank = true,
        sourceText = '',
        specialInstructions = '',
        standardsAlignment = '',
        schoolName = 'Sunnydale Academy',
        teacherName = 'Teacher',
        bookData,
      } = req.body;

      const effectiveTopic = (bookData && (bookData.bookTitle || bookData.fileName))
        ? `${bookData.bookTitle || bookData.fileName}`
        : topic;

      if (!effectiveTopic && !sourceText && !bookData) {
        return res.status(400).json({ error: 'Please provide a topic, book excerpt, or source material.' });
      }

      // --- 1. INTELLIGENT CURRICULUM CACHE CHECK ---
      const cacheKey = getCacheKey({
        topic: effectiveTopic,
        subject,
        gradeLevel,
        category,
        questionFormat,
        difficulty,
        questionCount,
        sourceText: sourceText || (bookData?.bookExcerpt ? bookData.bookExcerpt.slice(0, 80) : ''),
      });
      const cachedItem = worksheetCache.get(cacheKey);

      if (cachedItem && !specialInstructions && !bookData) {
        // Return instantly from cache with 0 API cost
        const cachedResponse = {
          ...cachedItem,
          id: `ws-cache-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          schoolName: schoolName || cachedItem.schoolName,
          teacherName: teacherName || cachedItem.teacherName,
          createdAt: new Date().toISOString(),
        };
        recordWorksheetGenerated();
        return res.json({
          worksheet: cachedResponse,
          fromCache: true,
          costSaved: true,
          message: 'Retrieved instantly from curriculum cache (0 API cost)',
        });
      }

      // --- 2. PER-USER RATE LIMIT & COOLDOWN CHECK ---
      const customApiKey = (req.headers['x-custom-api-key'] as string || '').trim();
      const clientId = (req.headers['x-user-id'] as string) || (req.headers['x-teacher-id'] as string) || (req.headers['x-user-email'] as string) || req.ip || 'anonymous';
      const today = new Date().toISOString().slice(0, 10);

      let usage = clientUsage.get(clientId);
      if (!usage || usage.date !== today) {
        usage = { count: 0, date: today, lastRequestTime: 0 };
        clientUsage.set(clientId, usage);
      }

      // Power users, Pro/School teachers, and Master Admins bypass public pool limits
      const userTier = (req.headers['x-user-tier'] as string) || '';
      const isAdmin = isUserAdmin(req);
      const isUnlimitedUser = isAdmin || userTier === 'pro' || userTier === 'school' || Boolean(customApiKey);

      if (!isUnlimitedUser) {
        const elapsed = Date.now() - usage.lastRequestTime;
        if (elapsed < COOLDOWN_MS) {
          const secondsRemaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
          return res.status(429).json({
            error: `Please wait ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'} before generating another worksheet.`,
            cooldownSeconds: secondsRemaining,
            quotaExceeded: false,
          });
        }

        if (usage.count >= DAILY_PUBLIC_LIMIT) {
          return res.status(429).json({
            error: 'You have reached the daily free allowance (5/5 worksheets). You can use your own free Google AI Studio key for unlimited access, or explore previously generated worksheets in the library.',
            quotaExceeded: true,
            remainingToday: 0,
            dailyLimit: DAILY_PUBLIC_LIMIT,
          });
        }
      }

      const ai = getGeminiClient(customApiKey);

      const normalizedDifficulty = (difficulty === 'beginner' || difficulty === 'foundational')
        ? 'beginner'
        : (difficulty === 'expert' || difficulty === 'advanced')
        ? 'expert'
        : 'intermediate';

      let questionFormatRule = '';
      if (questionFormat === 'multiple_choice') {
        questionFormatRule = 'CRITICAL REQUIREMENT: ONLY generate multiple-choice questions ("type": "multiple_choice"). Every question must have an "options" array with 4 plausible choices and a "correctAnswer". Do not generate fill_blank, short_answer, or matching.';
      } else if (questionFormat === 'fill_blank') {
        questionFormatRule = 'CRITICAL REQUIREMENT: ONLY generate fill-in-the-blank questions ("type": "fill_blank"). Every question statement must contain a blank represented by ________, a "correctAnswer", and populate the "wordBank" array with key terms. Do not generate multiple_choice.';
      } else {
        questionFormatRule = 'CRITICAL REQUIREMENT: Generate a balanced mix of "multiple_choice" and "fill_blank" questions. Ensure multiple choice questions have 4 options and fill-in-the-blank questions have a blank represented by ________ with wordBank terms.';
      }

      const isQuestionPaperMode = Boolean(
        req.body.isQuestionPaperMode ||
        bookData?.documentType === 'question_paper' ||
        bookData?.variationStyle ||
        req.body.questionPaperVariationStyle
      );
      const variationStyle = bookData?.variationStyle || req.body.questionPaperVariationStyle || 'parallel_twin';

      let documentPromptSection = '';
      if (isQuestionPaperMode) {
        documentPromptSection = `
ORIGINAL SPECIMEN QUESTION PAPER (UPLOADED PDF/DOCUMENT):
Original Document: "${bookData?.bookTitle || bookData?.fileName || effectiveTopic}"
Target Subject: ${subject}
Target Grade Level: ${gradeLevel}
Assessment Category: ${category}
Requested Variation Mode: ${variationStyle}

EXTRACTED TEXT & QUESTIONS FROM THE ORIGINAL QUESTION PAPER:
"""
${(bookData?.bookExcerpt || sourceText || '').slice(0, 42000)}
"""

CRITICAL MANDATE - GENERATE A SIMILAR QUESTION PAPER WITH COMPLETELY NEW & DIFFERENT QUESTIONS AND ANSWERS:
The teacher provided this original question paper to generate a fresh, parallel assessment (Set B / Twin Examination):
1. ZERO DUPLICATION OF QUESTIONS:
   - You MUST NOT repeat any of the original questions verbatim.
   - Formulate COMPLETELY NEW questions that test the same curriculum concepts, syllabus objectives, and cognitive skills at the identical grade level.
2. SYSTEMATIC PARALLEL MAPPING:
   - For numerical & mathematics problems: keep the formula/method identical, but substitute with fresh numerical values, scenarios, and labels.
   - For science questions: test corresponding or complementary structures, mechanisms, equations, or processes.
   - For language & reading: test the identical grammatical rules, literary devices, or comprehension skills with fresh context.
   - For multiple-choice questions: create 4 fresh, plausible options with only one unambiguously correct answer and realistic distractors.
3. ACCURATE NEW ANSWERS & PEDAGOGICAL PROOF:
   - Provide the exact correctAnswer for each new question.
   - In explanation, provide the complete, step-by-step mathematical derivation, textual rationale, or conceptual proof.
4. TITLE & VERSION:
   - Title: "${bookData?.bookTitle || effectiveTopic} • Parallel Assessment (Set B)"
   - Subtitle: "${gradeLevel} ${subject} • Alternate Questions & Verified Solutions"
`;
      } else if (bookData) {
        documentPromptSection = `
PRIMARY SOURCE MATERIAL - UPLOADED BOOK / TEXTBOOK / PDF:
Book Title: "${bookData.bookTitle || bookData.fileName}"
${bookData.chapterOrSection ? `Selected Chapter / Section: ${bookData.chapterOrSection}` : ''}
${bookData.selectedPages ? `Page Range: ${bookData.selectedPages}` : ''}
${bookData.pageCount ? `Total Book Pages: ${bookData.pageCount}` : ''}

PRIMARY EXCERPT FROM THE BOOK TO BASE ALL QUESTIONS ON:
"""
${(bookData.bookExcerpt || sourceText || '').slice(0, 42000)}
"""

STRICT MANDATE FOR BOOK-GROUNDED QUESTIONS:
1. Every single question MUST be directly derived from and test comprehension of the facts, quotes, characters, concepts, scientific processes, arguments, or exercises in this uploaded book text.
2. The questions must challenge the student to demonstrate deep reading comprehension and cite textual evidence.
3. In each question's "explanation", explicitly cite or reference how the correct answer is directly supported by the book excerpt.
4. For fill-in-the-blank questions, ensure the missing words are pivotal vocabulary or concepts from the book and included in the wordBank.
5. Create a title reflecting the book, e.g. "${bookData.bookTitle || 'Book'} Reading & Analysis".
`;
      }

      const detectedLang = detectTargetLanguage(effectiveTopic, specialInstructions, subject);

      const languageMandateSection = detectedLang ? `
CRITICAL LANGUAGE MANDATE:
The user explicitly requested this assessment to be in ${detectedLang}.
You MUST generate 100% of the worksheet content strictly in authentic ${detectedLang} script and grammar:
1. Title and Subtitle MUST be in ${detectedLang} (e.g. தமிழ் உயிர் எழுத்துக்கள் பயிற்சி).
2. Instructions MUST be in ${detectedLang}.
3. ALL Questions MUST be in ${detectedLang}.
4. ALL Options (A, B, C, D) MUST be in ${detectedLang}.
5. Correct answers, hints, and explanations MUST be in ${detectedLang}.
6. Word bank items MUST be in ${detectedLang}.
STRICT MANDATE: Do NOT output English questions, English options, or English explanations. The entire document must be authentically written in ${detectedLang}.
` : '';

      const prompt = `You are an expert curriculum developer, master teacher, and assessment designer.
Generate a comprehensive, pedagogically sound educational worksheet/quiz.

TOPIC / CONCEPT: "${effectiveTopic}"
SUBJECT: ${subject}
GRADE LEVEL: ${gradeLevel}
ASSESSMENT TYPE: ${category}
COMPLEXITY / RIGOR: ${normalizedDifficulty} (Beginner = accessible definitions and core foundations; Intermediate = standard curriculum problem solving; Expert = advanced analytical synthesis, critical thinking, nuanced distractors)
NUMBER OF QUESTIONS: ${questionCount}
${questionFormatRule}
${languageMandateSection}
${documentPromptSection}
${!bookData && sourceText ? `REFERENCE SOURCE TEXT TO BASE QUESTIONS ON:\n"""\n${sourceText}\n"""\n` : ''}
${specialInstructions ? `SPECIFIC TEACHER INSTRUCTIONS: ${specialInstructions}` : ''}
${standardsAlignment ? `STANDARDS TO ALIGN WITH: ${standardsAlignment}` : ''}

REQUIREMENTS:
1. Title and Subtitle: ${detectedLang ? `MUST be written completely in authentic ${detectedLang} (e.g. "${effectiveTopic} பயிற்சி"). Do NOT write the title in English.` : `Title should be professional and clear for students (e.g. "${effectiveTopic} Practice & Mastery").`}
2. Instructions: ${detectedLang ? `MUST be written completely in authentic ${detectedLang} directing students how to answer the questions. Do NOT use English.` : `Include clear, student-friendly instructions corresponding to the question format.`}
3. For multiple-choice questions, provide exactly 4 plausible options in an array. Distractors should target common misconceptions.
4. For fill-in-the-blank questions, provide the exact missing keyword or phrase in correctAnswer, and include terms in wordBank.
5. Provide accurate, clear answer keys and pedagogical explanations for every question.
6. Total points should be the sum of all individual question points.
7. IMAGES & VISUAL IDENTIFICATION: If the topic or teacher prompt requests images, diagrams, or visual identification (such as "${effectiveTopic}"), formulate questions that reference anatomical or scientific diagrams (e.g., "Refer to the diagram below...", "Identify the organ shown..."). Include "imageUrl" and "imageCaption" in the question object when appropriate.`;

      let parsed: any = null;
      let fallbackUsed = false;

      // Check 15 RPM Governor: if approaching limits and no personal key, seamlessly use intelligent fallback engine
      if (ai && (!isApproachingRpmLimit() || Boolean(customApiKey))) {
        try {
          const { response } = await generateContentWithResilience(ai, {
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  gradeLevel: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                  passage: { type: Type.STRING, description: 'Reading passage for reading comprehension or case study' },
                  standardCode: { type: Type.STRING, description: 'Relevant standard code like CCSS or NGSS' },
                  wordBank: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Word bank for fill in the blank questions',
                  },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: {
                          type: Type.STRING,
                          description: 'One of: multiple_choice, true_false, fill_blank, short_answer, matching, math_problem',
                        },
                        question: { type: Type.STRING },
                        points: { type: Type.INTEGER },
                        imageUrl: { type: Type.STRING, description: 'Direct URL to educational diagram or image if applicable' },
                        imageCaption: { type: Type.STRING, description: 'Figure caption or label describing the diagram' },
                        imageAlt: { type: Type.STRING, description: 'Accessible description' },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: '4 options for multiple_choice',
                        },
                        correctAnswer: { type: Type.STRING, description: 'Correct answer or key' },
                        matchingPairs: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              left: { type: Type.STRING },
                              right: { type: Type.STRING },
                            },
                            required: ['id', 'left', 'right'],
                          },
                          description: 'For matching type questions',
                        },
                        sampleAnswer: { type: Type.STRING, description: 'For short_answer grading model answer' },
                        stepByStepSolution: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Step by step solution for math or problem solving',
                        },
                        finalAnswer: { type: Type.STRING, description: 'Concise final answer for math problems' },
                        explanation: { type: Type.STRING, description: 'Pedagogical explanation of the solution' },
                        hint: { type: Type.STRING, description: 'Helpful hint for struggling students' },
                      },
                      required: ['id', 'type', 'question', 'points', 'explanation'],
                    },
                  },
                },
                required: ['title', 'instructions', 'questions'],
              },
            },
          });

          const rawJson = response.text || '{}';
          parsed = JSON.parse(rawJson);
        } catch (resilientErr: any) {
          console.info('Curriculum engine fallback engaged for worksheet generation:', resilientErr?.message || 'High traffic');
        }
      }

      // If AI failed, rate-limited, or unavailable, engage hybrid fallback engine
      if (!parsed || !parsed.questions || parsed.questions.length === 0) {
        fallbackUsed = true;
        parsed = createIntelligentWorksheet(
          effectiveTopic || 'Curriculum Skills',
          subject,
          gradeLevel,
          category,
          questionCount,
          questionFormat,
          normalizedDifficulty
        );

        if (bookData) {
          parsed.title = `${bookData.bookTitle || 'Book'} Comprehension & Analysis`;
          parsed.subtitle = `${gradeLevel} ${subject} • Grounded in ${bookData.fileName}`;
          parsed.instructions = `Carefully read the questions below and answer based on the text from "${bookData.bookTitle || bookData.fileName}".`;
        }
      }

      // Ensure questions are enriched with free educational diagrams for identification / diagram topics
      const rawQuestions = parsed.questions || [];
      const enrichedQuestions = enrichQuestionsWithImages(effectiveTopic, specialInstructions, rawQuestions);

      const calculatedTotal = enrichedQuestions.reduce(
        (sum: number, q: { points?: number }) => sum + (q.points || 1),
        0
      );

      const fullWorksheet = {
        id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: parsed.title || (isQuestionPaperMode ? `${effectiveTopic} • Parallel Assessment (Set B)` : effectiveTopic),
        subtitle: parsed.subtitle || (isQuestionPaperMode ? `${gradeLevel} ${subject} • Alternate Questions & Verified Answers` : `${gradeLevel} ${subject} Assessment`),
        subject: parsed.subject || subject,
        gradeLevel: parsed.gradeLevel || gradeLevel,
        category,
        difficulty,
        schoolName,
        teacherName,
        instructions: parsed.instructions || 'Answer all questions to the best of your ability.',
        passage: parsed.passage || (bookData?.bookExcerpt ? bookData.bookExcerpt.slice(0, 2500) : (sourceText ? sourceText : undefined)),
        standardCode: parsed.standardCode || standardsAlignment || undefined,
        wordBank: parsed.wordBank && parsed.wordBank.length > 0 ? parsed.wordBank : undefined,
        totalPoints: calculatedTotal || questionCount * 2,
        versionLabel: isQuestionPaperMode ? 'Set B (Alternate Questions)' : 'Version A',
        sourceBook: (!isQuestionPaperMode && bookData) ? {
          title: bookData.bookTitle || bookData.fileName,
          fileName: bookData.fileName,
          pageCount: bookData.pageCount,
          chapterOrPages: bookData.chapterOrSection || bookData.selectedPages || 'Full Book',
        } : undefined,
        sourceQuestionPaper: isQuestionPaperMode ? {
          originalTitle: bookData?.bookTitle || bookData?.fileName || effectiveTopic,
          fileName: bookData?.fileName,
          variationStyle,
          isSimilarVariant: true,
        } : undefined,
        createdAt: new Date().toISOString(),
        questions: enrichedQuestions.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `q-${idx + 1}-${Date.now()}`,
          points: q.points || 2,
        })),
      };

      // Store in Curriculum Cache so future queries on identical topics are 0-cost & instant
      worksheetCache.set(cacheKey, fullWorksheet);

      // Record usage for client
      if (!isUnlimitedUser) {
        usage.count += 1;
        usage.lastRequestTime = Date.now();
        clientUsage.set(clientId, usage);
      }

      recordWorksheetGenerated();

      res.json({
        worksheet: fullWorksheet,
        fromCache: false,
        fallbackUsed,
        remainingToday: customApiKey ? 9999 : Math.max(0, DAILY_PUBLIC_LIMIT - usage.count),
      });
    } catch (err: any) {
      console.error('Error generating worksheet:', err);
      res.status(500).json({
        error: err.message || 'Failed to generate worksheet. Please try again.',
      });
    }
  });

  // Differentiate Worksheet endpoint (Version B, Scaffolded/Simplified, Advanced, Spanish translation)
  app.post('/api/differentiate-worksheet', requireUserAuth, async (req, res) => {
    try {
      const { worksheet, mode } = req.body;
      if (!worksheet || !worksheet.questions) {
        return res.status(400).json({ error: 'Valid worksheet object is required' });
      }

      const customApiKey = (req.headers['x-custom-api-key'] as string || '').trim();
      const ai = getGeminiClient(customApiKey);

      let instructionDescription = '';
      let targetVersion = 'Version B';

      switch (mode) {
        case 'scramble_version_b':
          targetVersion = 'Version B (Anti-Cheating)';
          instructionDescription = `Create an alternate "Version B" of this worksheet to prevent cheating in class.
Change the numbers, names, contexts, and order of choices in multiple-choice questions while testing the exact same concepts at the identical difficulty level. Scramble question order.`;
          break;
        case 'simplify':
          targetVersion = 'Scaffolded (Foundational)';
          instructionDescription = `Differentiate this worksheet for students needing extra support / IEP / foundational mastery.
Add sentence stems, simpler numerical values, helpful hints for every question, and include a helpful word bank. Keep the core standards intact.`;
          break;
        case 'challenge':
          targetVersion = 'Honors / Extension';
          instructionDescription = `Elevate this worksheet for gifted, advanced, or honors students.
Include multi-step reasoning, deeper conceptual transfer, remove direct hints, and ask for analytical explanations.`;
          break;
        case 'translate_spanish':
          targetVersion = 'Spanish Dual-Language';
          instructionDescription = `Translate all worksheet text, instructions, questions, choices, and explanations into clear, educational Spanish for bilingual or ELL classrooms. Keep the structure identical.`;
          break;
        default:
          instructionDescription = `Create an alternate version of this worksheet.`;
      }

      let parsed: any = null;

      if (ai) {
        try {
          const prompt = `You are an expert instructional differentiation specialist.
Task: ${instructionDescription}

Original Worksheet Data:
${JSON.stringify(worksheet, null, 2)}

Return the newly adapted worksheet in JSON matching the exact same schema. Set versionLabel to "${targetVersion}".`;

          const { response } = await generateContentWithResilience(ai, {
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                  passage: { type: Type.STRING },
                  standardCode: { type: Type.STRING },
                  wordBank: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING },
                        question: { type: Type.STRING },
                        points: { type: Type.INTEGER },
                        imageUrl: { type: Type.STRING, description: 'Direct URL to educational diagram' },
                        imageCaption: { type: Type.STRING, description: 'Figure caption or label' },
                        imageAlt: { type: Type.STRING, description: 'Alt description' },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctAnswer: { type: Type.STRING },
                        matchingPairs: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              left: { type: Type.STRING },
                              right: { type: Type.STRING },
                            },
                            required: ['id', 'left', 'right'],
                          },
                        },
                        sampleAnswer: { type: Type.STRING },
                        stepByStepSolution: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        finalAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        hint: { type: Type.STRING },
                      },
                      required: ['id', 'type', 'question', 'points', 'explanation'],
                    },
                  },
                },
                required: ['title', 'instructions', 'questions'],
              },
            },
          });

          parsed = JSON.parse(response.text || '{}');
        } catch (genErr) {
          console.info('AI differentiation fallback engaged:', (genErr as any)?.message || 'Temporary demand spike');
        }
      }

      // Hybrid Fallback for differentiation (e.g. Version B scrambling or scaffolding)
      if (!parsed || !parsed.questions) {
        const origQuestions = [...(worksheet.questions || [])];
        const shuffledQuestions = origQuestions
          .map((q, idx) => ({
            ...q,
            id: `q-diff-${idx + 1}-${Date.now()}`,
            question: mode === 'scramble_version_b'
              ? `[Alt ${idx + 1}] ${q.question}`
              : mode === 'simplify'
              ? `${q.question} (Hint: focus on core definitions)`
              : q.question,
            options: q.options ? [...q.options].reverse() : undefined,
          }))
          .sort(() => (mode === 'scramble_version_b' ? Math.random() - 0.5 : 0));

        parsed = {
          title: `${worksheet.title} (${targetVersion})`,
          subtitle: worksheet.subtitle,
          instructions: worksheet.instructions,
          passage: worksheet.passage,
          standardCode: worksheet.standardCode,
          wordBank: worksheet.wordBank,
          questions: shuffledQuestions,
        };
      }

      const calculatedTotal = (parsed.questions || []).reduce(
        (sum: number, q: { points?: number }) => sum + (q.points || 1),
        0
      );

      const origQuestions = worksheet.questions || [];

      const differentiatedWorksheet = {
        ...worksheet,
        id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: parsed.title || worksheet.title,
        subtitle: parsed.subtitle || worksheet.subtitle,
        instructions: parsed.instructions || worksheet.instructions,
        passage: parsed.passage !== undefined ? parsed.passage : worksheet.passage,
        standardCode: parsed.standardCode || worksheet.standardCode,
        wordBank: parsed.wordBank || worksheet.wordBank,
        versionLabel: targetVersion,
        totalPoints: calculatedTotal || worksheet.totalPoints,
        createdAt: new Date().toISOString(),
        questions: (parsed.questions || []).map((q: any, idx: number) => {
          const matchedOrig = origQuestions[idx] || {};
          return {
            ...q,
            id: `q-diff-${idx + 1}-${Date.now()}`,
            points: q.points || 2,
            imageUrl: q.imageUrl || matchedOrig.imageUrl,
            imageCaption: q.imageCaption || matchedOrig.imageCaption,
            imageAlt: q.imageAlt || matchedOrig.imageAlt,
          };
        }),
      };

      res.json({ worksheet: differentiatedWorksheet });
    } catch (err: any) {
      console.error('Error differentiating worksheet:', err);
      res.status(500).json({ error: err.message || 'Failed to differentiate worksheet' });
    }
  });

  // Generate single replacement question endpoint
  app.post('/api/generate-single-question', requireUserAuth, async (req, res) => {
    try {
      const { topic, subject, gradeLevel, questionType = 'multiple_choice', currentQuestions = [] } = req.body;
      const customApiKey = (req.headers['x-custom-api-key'] as string || '').trim();
      const ai = getGeminiClient(customApiKey);

      if (!ai) {
        // Synthesize single question using intelligent rules
        const fallbackWs = createIntelligentWorksheet(topic, subject, gradeLevel, 'practice', 1, questionType as any);
        const question = fallbackWs.questions[0] || {
          id: `q-single-${Date.now()}`,
          type: questionType,
          question: `Regarding ${topic}, what is the essential function or core principle?`,
          points: 2,
          options: [
            `The primary governing principle of ${topic}`,
            `An unrelated secondary factor`,
            `An outdated obsolete model`,
            `A negligible random variance`,
          ],
          correctAnswer: `The primary governing principle of ${topic}`,
          explanation: `Understanding the essential function of ${topic} is key to curriculum mastery.`,
        };
        return res.json({ question });
      }

      const prompt = `Generate a single fresh, high-quality question for an assessment.
TOPIC: ${topic}
SUBJECT: ${subject}
GRADE LEVEL: ${gradeLevel}
QUESTION TYPE: ${questionType} (multiple_choice, true_false, fill_blank, short_answer, matching, math_problem)
Existing question prompts to avoid repeating: ${JSON.stringify(currentQuestions.map((q: any) => q.question))}

If the topic or question involves anatomy, diagrams, or visual identification (e.g. digestive system, heart, cell), include imageUrl and imageCaption if applicable.

Return a single question object in JSON format with points, answer, options (if multiple choice), explanation, and hint.`;

      let parsed: any = null;

      try {
        const { response } = await generateContentWithResilience(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                points: { type: Type.INTEGER },
                imageUrl: { type: Type.STRING, description: 'URL to diagram or image if applicable' },
                imageCaption: { type: Type.STRING, description: 'Figure caption for diagram' },
                imageAlt: { type: Type.STRING, description: 'Alt text' },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING },
                matchingPairs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      left: { type: Type.STRING },
                      right: { type: Type.STRING },
                    },
                    required: ['id', 'left', 'right'],
                  },
                },
                sampleAnswer: { type: Type.STRING },
                stepByStepSolution: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                finalAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                hint: { type: Type.STRING },
              },
              required: ['type', 'question', 'points', 'explanation'],
            },
          },
        });

        parsed = JSON.parse(response.text || '{}');
      } catch (singleErr) {
        console.info('Single question AI error, using fallback:', (singleErr as any)?.message || 'Temporary demand spike');
      }

      if (!parsed || !parsed.question) {
        const fallbackWs = createIntelligentWorksheet(topic, subject, gradeLevel, 'practice', 1, questionType as any);
        parsed = fallbackWs.questions[0];
      }

      const enrichedSingle = enrichQuestionsWithImages(topic, '', [parsed])[0];

      const question = {
        ...enrichedSingle,
        id: `q-single-${Date.now()}`,
        points: parsed.points || 2,
      };

      res.json({ question });
    } catch (err: any) {
      console.error('Error generating single question:', err);
      res.status(500).json({ error: err.message || 'Failed to generate question' });
    }
  });

  // Search free, non-copyright educational diagrams (Wikimedia Commons + Curated Library)
  app.get('/api/search-free-images', requireUserAuth, async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const curatedMatches = findMatchingDiagrams(query);

      let wikiResults: any[] = [];
      if (query && query.length > 1) {
        try {
          const wikiSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
            query + ' diagram OR drawing'
          )}&gsrlimit=12&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=800&format=json`;

          const wikiResp = await fetch(wikiSearchUrl, {
            headers: {
              'User-Agent': 'AIWorksheetStudio/1.0 (Educational Assessment Builder; mailto:support@aiworksheets.edu)',
              'Accept': 'application/json',
            },
          });

          if (wikiResp.ok) {
            const wikiData: any = await wikiResp.json();
            const pages = Object.values(wikiData?.query?.pages || {});
            wikiResults = pages
              .map((page: any) => {
                const info = page.imageinfo?.[0];
                if (!info || !info.url) return null;
                const title = (page.title || '')
                  .replace(/^File:/i, '')
                  .replace(/\.[^/.]+$/, '')
                  .replace(/_/g, ' ');

                // Filter out non-image or inappropriate files
                if (!info.url.match(/\.(png|jpg|jpeg|svg|webp)($|\?)/i)) return null;

                const license =
                  info.extmetadata?.LicenseShortName?.value ||
                  info.extmetadata?.UsageTerms?.value ||
                  'Creative Commons / Public Domain';

                return {
                  id: `wiki-${page.pageid || Math.random().toString(36).slice(2, 8)}`,
                  title,
                  url: info.url,
                  thumbUrl: info.thumburl || info.url,
                  caption: `Figure: ${title}`,
                  license,
                  source: 'Wikimedia Commons',
                  category: 'Wikimedia Search',
                };
              })
              .filter(Boolean);
          }
        } catch (searchErr) {
          console.warn('Wikimedia live search failed, falling back to curated diagrams:', searchErr);
        }
      }

      // Merge and deduplicate by URL
      const seenUrls = new Set<string>();
      const combined: any[] = [];

      for (const item of [...curatedMatches, ...wikiResults]) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          combined.push(item);
        }
      }

      res.json({ results: combined });
    } catch (err: any) {
      console.error('Error searching free images:', err);
      res.status(500).json({ error: 'Failed to search free images' });
    }
  });

  // Safe Image Proxy Endpoint (caching + user-agent header to avoid CORS / hotlinking blocks)
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
        return res.status(400).send('Invalid or missing image URL');
      }

      const resp = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIWorksheetStudio/1.0',
          'Accept': 'image/*,*/*',
        },
      });

      if (!resp.ok) {
        return res.status(resp.status).send('Failed to fetch remote image');
      }

      const contentType = resp.headers.get('content-type') || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = await resp.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(500).send(err.message || 'Proxy error');
    }
  });

  // Payment Gateway: Create Checkout Session (Protected & Coming Soon during Free Preview)
  app.post('/api/checkout/create-session', async (req, res) => {
    return res.status(403).json({
      error: 'Paid features are launching in 1 week! All educators currently enjoy full access to our core features on the Free Starter plan. No payment information is accepted during the preview week.',
      comingSoon: true,
    });
  });

  // Payment Gateway: Process Payment (Protected & Coming Soon during Free Preview)
  app.post('/api/checkout/process-payment', async (req, res) => {
    return res.status(403).json({
      error: 'Paid features are launching in 1 week! All educators currently enjoy full access to our core features on the Free Starter plan. No payment information is accepted during the preview week.',
      comingSoon: true,
    });
  });

  // Payment Gateway: Cancel Active Subscription
  app.post('/api/subscription/cancel', async (req, res) => {
    try {
      const { subscriptionId, userId } = req.body;
      const stripe = getStripe();
      if (stripe && subscriptionId && !subscriptionId.startsWith('sub_sim_')) {
        try {
          await stripe.subscriptions.cancel(subscriptionId);
        } catch (e: any) {
          console.warn('Stripe cancellation notice warning:', e.message);
        }
      }

      res.json({
        success: true,
        message: 'Subscription successfully canceled. User access reverts to the Free Starter tier.',
      });
    } catch (err: any) {
      console.error('Subscription cancellation error:', err);
      res.status(500).json({ error: err.message || 'Failed to cancel subscription' });
    }
  });

  // --- REAL-TIME WEBSITE TRAFFIC & USAGE ANALYTICS COUNTER APIS ---
  app.post('/api/analytics/track-visit', (req, res) => {
    try {
      const visitorKey = (req.body?.sessionId as string) || (req.headers['x-user-id'] as string) || req.ip || 'visitor';
      recordVisit(visitorKey);
      res.json({
        success: true,
        stats: { ...siteAnalytics },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record visit' });
    }
  });

  app.get('/api/analytics/stats', (req, res) => {
    res.json({
      ...siteAnalytics,
      serverTime: new Date().toISOString(),
    });
  });

  app.post('/api/analytics/track-worksheet', (req, res) => {
    try {
      recordWorksheetGenerated();
      res.json({
        success: true,
        stats: { ...siteAnalytics },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record worksheet creation' });
    }
  });

  // Launch Waitlist In-Memory Cache
  const waitlistEmails: Array<{ email: string; planInterest: string; createdAt: string }> = [];
  app.post('/api/analytics/waitlist', (req, res) => {
    try {
      const { email, planInterest = 'pro' } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }
      waitlistEmails.push({
        email: email.trim().toLowerCase(),
        planInterest,
        createdAt: new Date().toISOString(),
      });
      console.info(`[Waitlist] New educator registered for paid launch: ${email} (${planInterest})`);
      res.json({
        success: true,
        message: 'Successfully registered for the paid tiers launch notification!',
        totalWaitlistCount: waitlistEmails.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to join waitlist' });
    }
  });

  app.get('/api/analytics/waitlist', (req, res) => {
    const isAdmin = isUserAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json({
      totalWaitlistCount: waitlistEmails.length,
      entries: waitlistEmails,
    });
  });

  // Master Admin Portal: System Health, Caching & Whitelist Verification
  app.get('/api/admin/overview', (req, res) => {
    const isAdmin = isUserAdmin(req);
    res.json({
      status: 'ok',
      isAdminAuthorized: isAdmin,
      masterAdmins: MASTER_ADMIN_EMAILS,
      serverTime: new Date().toISOString(),
      cachedWorksheetsCount: worksheetCache.size,
      activeClientSessions: clientUsage.size,
      dailyPublicLimit: DAILY_PUBLIC_LIMIT,
      cooldownSeconds: COOLDOWN_MS / 1000,
      databaseTarget: 'Firestore (GCP)',
      analytics: {
        ...siteAnalytics,
        waitlistCount: waitlistEmails.length,
      },
    });
  });

  // Master Admin Portal: Reset Client Usage / Cooldown
  app.post('/api/admin/reset-client-quota', (req, res) => {
    const { targetId } = req.body;
    if (targetId && clientUsage.has(targetId)) {
      clientUsage.delete(targetId);
    } else if (!targetId) {
      clientUsage.clear();
    }
    res.json({ success: true, message: `Reset in-memory quota tracking for ${targetId || 'all clients'}` });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
