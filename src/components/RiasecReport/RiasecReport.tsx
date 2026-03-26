import { useEffect, useState } from "react";
import { Card, Spin, App, Table, Tag, Alert, Collapse, Button } from "antd";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useNavigate } from "@tanstack/react-router";
import axiosClient from "../../api/axiosClient";
import { useTranslation } from "../../hooks/useTranslation";
import "./RiasecReport.css";

const { Panel } = Collapse;

interface RiasecVector {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

interface QualityCheckDetail {
  status: 'ok' | 'warning' | 'fail';
  message: string;
  [key: string]: any;
}

interface RiasecResult {
  riasec_vector: RiasecVector;
  riasec_triplet: string;
  quality_flags: string[];
  quality_details?: {
    control_internals?: QualityCheckDetail;
    straightlining?: QualityCheckDetail;
    randomness?: QualityCheckDetail;
    timing?: QualityCheckDetail;
    total_time?: QualityCheckDetail;
    // Для обратной совместимости
    control_checks?: number;
    long_pauses_count?: number;
  };
}

interface RiasecReportData {
  session: {
    id: string;
    user_id: number;
    status: string;
    locale: string;
    completed_at: string;
    total_time_sec: number;
    active_time_ms: number;
  };
  student: {
    id: number;
    name: string;
    email: string;
  };
  result: RiasecResult;
}

interface Props {
  sessionId: string;
  mode?: 'student' | 'counselor'; // Режим отображения
  studentGender?: 'male' | 'female'; // Пол студента для выбора пилота
}

// Данные о типах RIASEC из ТЗ
const RIASEC_INFO: Record<string, {
  title: { ru: string; kk: string; en: string };
  description: { ru: string; kk: string; en: string };
}> = {
  R: {
    title: { ru: "Реалистический", kk: "Реалистік", en: "Realistic" },
    description: {
      ru: "Мне нравится делать руками, чинить, собирать, проверять на практике, как это работает.",
      kk: "Маған қолмен істеу, жөндеу, жинау және оның қалай істейтінін іс жүзінде тексеру ұнайды.",
      en: "I like working with my hands, fixing, assembling, and testing how things work in practice."
    }
  },
  I: {
    title: { ru: "Исследовательский", kk: "Зерттеушілік", en: "Investigative" },
    description: {
      ru: "Мне интересно разбираться в причинах и искать ответы через анализ и эксперименты.",
      kk: "Мен себептерді түсініп, талдау және тәжірибе арқылы жауап іздегенді ұнатамын.",
      en: "I'm interested in understanding causes and finding answers through analysis and experiments."
    }
  },
  A: {
    title: { ru: "Артистический", kk: "Шығармашылық", en: "Artistic" },
    description: {
      ru: "Мне нравится придумывать новое, выражать идеи и искать необычные способы решения задач.",
      kk: "Мен жаңа нәрсе ойлап тауып, идеяларды білдіру және ерекше шешімдер іздеуді ұнатамын.",
      en: "I like creating new things, expressing ideas, and finding unusual ways to solve problems."
    }
  },
  S: {
    title: { ru: "Социальный", kk: "Әлеуметтік", en: "Social" },
    description: {
      ru: "Мне важно помогать другим, поддерживать, учить или заботиться о людях.",
      kk: "Маған басқаларға көмектесу, қолдау көрсету, үйрету немесе қамқор болу маңызды.",
      en: "It's important for me to help others, support, teach, or take care of people."
    }
  },
  E: {
    title: { ru: "Предпринимательский", kk: "Кәсіпкерлік", en: "Enterprising" },
    description: {
      ru: "Мне интересно вдохновлять других, брать ответственность и двигать идеи вперёд.",
      kk: "Мен өзгелерді жігерлендіріп, жауапкершілік алып, идеяларды алға жылжытқанды ұнатамын.",
      en: "I'm interested in inspiring others, taking responsibility, and moving ideas forward."
    }
  },
  C: {
    title: { ru: "Конвенциональный", kk: "Ұйымдастырушылық", en: "Conventional" },
    description: {
      ru: "Мне нравится порядок, точность и когда всё работает по правилам.",
      kk: "Маған тәртіп, нақтылық және бәрі ережемен жұмыс істегені ұнайды.",
      en: "I like order, precision, and when everything works according to the rules."
    }
  }
};

// Данные о пилотах
interface Pilot {
  pair: string;
  variants: Array<{
    gender: string;
    name: { ru: string; kk: string; en: string };
    tagline: { ru: string; kk: string; en: string };
  }>;
}

const PILOTS: Pilot[] = [
  {
    pair: "RI",
    variants: [
      { gender: "male", name: { ru: "Питер Паркер", kk: "Питер Паркер", en: "Peter Parker" }, tagline: { ru: "Чиню, изобретаю и сразу проверяю идеи.", kk: "Жөндеймін, ойлап табамын және бірден идеяларды тексеремін.", en: "I fix, invent, and test ideas right away." } },
      { gender: "female", name: { ru: "Шури", kk: "Шури", en: "Shuri" }, tagline: { ru: "Сначала изучаю, потом быстро прототипирую.", kk: "Алдымен ғылымға үңілемін, кейін жылдам прототип жасаймын.", en: "First I study, then I prototype quickly." } }
    ]
  },
  {
    pair: "RA",
    variants: [
      { gender: "male", name: { ru: "Майлз Моралес", kk: "Майлз Моралес", en: "Miles Morales" }, tagline: { ru: "Делаю руками и добавляю творческую подачу.", kk: "Қолмен істеймін және шығармашылық рең қосамын.", en: "I work with my hands and add creative flair." } },
      { gender: "female", name: { ru: "Ви (Arcane)", kk: "Ви (Arcane)", en: "Vi (Arcane)" }, tagline: { ru: "Действую смело и придумываю нестандартные ходы.", kk: "Батыл әрекет етемін және стандарттан тыс қадамдар ойлап табамын.", en: "I act boldly and come up with unconventional moves." } }
    ]
  },
  {
    pair: "RS",
    variants: [
      { gender: "male", name: { ru: "Стив Роджерс", kk: "Стив Роджерс", en: "Steve Rogers" }, tagline: { ru: "Делаю конкретные шаги и поддерживаю команду рядом.", kk: "Нақты қадам жасаймын және командаға қолдау көрсетемін.", en: "I take concrete steps and support the team." } },
      { gender: "female", name: { ru: "Катнисс Эвердин", kk: "Катнисс Эвердин", en: "Katniss Everdeen" }, tagline: { ru: "Действую ради своих и берегу людей.", kk: "Өз адамдарым үшін әрекет етемін және оларды қорғаймын.", en: "I act for my people and protect them." } }
    ]
  },
  {
    pair: "RE",
    variants: [
      { gender: "male", name: { ru: "Доминик Торетто", kk: "Доминик Торетто", en: "Dominic Toretto" }, tagline: { ru: "Делаю сейчас и веду за собой.", kk: "Қазір іске кірісемін және басқаларды соңымнан ертемін.", en: "I act now and lead the way." } },
      { gender: "female", name: { ru: "Фуриоса", kk: "Фуриоса", en: "Furiosa" }, tagline: { ru: "Решаю на месте и беру лидерство.", kk: "Орыннан шешім қабылдаймын және лидерлікті аламын.", en: "I decide on the spot and take leadership." } }
    ]
  },
  {
    pair: "RC",
    variants: [
      { gender: "male", name: { ru: "Сокка", kk: "Сокка", en: "Sokka" }, tagline: { ru: "Придумываю практичные решения и фиксирую план.", kk: "Прагматикалық шешім табамын және жоспарды бекітемін.", en: "I come up with practical solutions and lock in the plan." } },
      { gender: "female", name: { ru: "Небула", kk: "Небула", en: "Nebula" }, tagline: { ru: "Чиню механизм и навожу порядок в процессе.", kk: "Механизмді жөндеймін және үдерісті тәртіпке келтіремін.", en: "I fix the mechanism and bring order to the process." } }
    ]
  },
  {
    pair: "IR",
    variants: [
      { gender: "male", name: { ru: "Брюс Бэннер", kk: "Брюс Бэннер", en: "Bruce Banner" }, tagline: { ru: "Анализирую, экспериментирую и применяю на практике.", kk: "Талдау жасаймын, эксперимент жасаймын және тәжірибеде қолданамын.", en: "I analyze, experiment, and apply in practice." } },
      { gender: "female", name: { ru: "Сейлор Меркурий (Ами Мидзуно)", kk: "Сейлор Меркурий (Ами Мидзуно)", en: "Sailor Mercury (Ami Mizuno)" }, tagline: { ru: "Разбираюсь в данных и сразу пробую решения.", kk: "Деректерді түсінемін және шешімдерді бірден сынаймын.", en: "I understand data and try solutions right away." } }
    ]
  },
  {
    pair: "IA",
    variants: [
      { gender: "male", name: { ru: "Доктор Стрэндж", kk: "Доктор Стрэндж", en: "Doctor Strange" }, tagline: { ru: "Понимаю принципы и придумываю изящный ход.", kk: "Принциптерді түсінемін және ұтымды қадам ойлап табамын.", en: "I understand principles and devise elegant moves." } },
      { gender: "female", name: { ru: "Булма", kk: "Булма", en: "Bulma" }, tagline: { ru: "Исследую задачу и создаю оригинальное решение.", kk: "Мәселені зерттеймін және тың шешім жасаймын.", en: "I research the problem and create original solutions." } }
    ]
  },
  {
    pair: "IS",
    variants: [
      { gender: "male", name: { ru: "Спок", kk: "Спок", en: "Spock" }, tagline: { ru: "Разбираюсь в причинах и помогаю команде действовать.", kk: "Себептерді түсініп, командаға әрекет етуге көмектесемін.", en: "I understand causes and help the team act." } },
      { gender: "female", name: { ru: "Рей Скайуокер", kk: "Рей Скайуокер", en: "Rey Skywalker" }, tagline: { ru: "Понимаю, как всё устроено, и поддерживаю других.", kk: "Бәрінің қалай істейтінін түсінемін және өзгелерді қолдаймын.", en: "I understand how things work and support others." } }
    ]
  },
  {
    pair: "IE",
    variants: [
      { gender: "male", name: { ru: "Ник Фьюри", kk: "Ник Фьюри", en: "Nick Fury" }, tagline: { ru: "Собираю факты и двигаю стратегию вперёд.", kk: "Фактілерді жинаймын және стратегияны алға жылжытамын.", en: "I gather facts and push strategy forward." } },
      { gender: "female", name: { ru: "Принцесса Лея", kk: "Ханшайым Лея", en: "Princess Leia" }, tagline: { ru: "Опираюсь на данные и веду людей за идеей.", kk: "Деректерге сүйенемін және адамдарды идеямен жетелеймін.", en: "I rely on data and lead people with ideas." } }
    ]
  },
  {
    pair: "IC",
    variants: [
      { gender: "male", name: { ru: "Шерлок Холмс", kk: "Шерлок Холмс", en: "Sherlock Holmes" }, tagline: { ru: "Выстраиваю факты в систему и довожу дело до конца.", kk: "Фактілерді жүйеге келтіремін және істі соңына дейін жеткіземін.", en: "I organize facts into a system and see things through." } },
      { gender: "female", name: { ru: "Оракул (Барбара Гордон)", kk: "Оракул (Барбара Гордон)", en: "Oracle (Barbara Gordon)" }, tagline: { ru: "Каталогизирую знания и настраиваю процессы.", kk: "Білімді каталогтаймын және үдерістерді реттеймін.", en: "I catalog knowledge and tune processes." } }
    ]
  },
  {
    pair: "AR",
    variants: [
      { gender: "male", name: { ru: "Тони Старк", kk: "Тони Старк", en: "Tony Stark" }, tagline: { ru: "Придумываю дизайн и собираю рабочий прототип.", kk: "Дизайн ойлап табамын және жұмыс прототипін құрастырамын.", en: "I design and build working prototypes." } },
      { gender: "female", name: { ru: "Камала Хан", kk: "Камала Хан", en: "Kamala Khan" }, tagline: { ru: "Воодушевляю идеей и воплощаю её в вещи.", kk: "Идеямен жігерлендіремін және оны іске айналдырамын.", en: "I inspire with ideas and bring them to life." } }
    ]
  },
  {
    pair: "AI",
    variants: [
      { gender: "male", name: { ru: "Рик Санчез", kk: "Рик Санчез", en: "Rick Sanchez" }, tagline: { ru: "Придумываю безумную идею и нахожу ей обоснование.", kk: "Ерекше ой ойлап табамын және оған негіз табамын.", en: "I come up with crazy ideas and find justification for them." } },
      { gender: "female", name: { ru: "Ванда Максимофф", kk: "Ванда Максимофф", en: "Wanda Maximoff" }, tagline: { ru: "Создаю образ и исследую границы возможного.", kk: "Бейне жасаймын және мүмкіндіктің шегін зерттеймін.", en: "I create images and explore the limits of possibility." } }
    ]
  },
  {
    pair: "AS",
    variants: [
      { gender: "male", name: { ru: "Питер Квилл", kk: "Питер Квилл", en: "Peter Quill" }, tagline: { ru: "Придумываю креативный план и воодушевляю команду.", kk: "Ұтқыр жоспар ойлап табамын және команданы жігерлендіремін.", en: "I create creative plans and inspire the team." } },
      { gender: "female", name: { ru: "Анна (Холодное сердце)", kk: "Анна (Қарлы жүрек)", en: "Anna (Frozen)" }, tagline: { ru: "Зажигаю креативом и поддерживаю людей рядом.", kk: "Креативпен жігерлендіремін және жанымдағыларды қолдаймын.", en: "I ignite with creativity and support people around me." } }
    ]
  },
  {
    pair: "AE",
    variants: [
      { gender: "male", name: { ru: "Локи", kk: "Локи", en: "Loki" }, tagline: { ru: "Придумываю яркий ход и умею его продать.", kk: "Жарқын қадам ойлап табамын және оны ұсына аламын.", en: "I come up with bright moves and know how to sell them." } },
      { gender: "female", name: { ru: "Рэйвен (Teen Titans)", kk: "Рэйвен (Teen Titans)", en: "Raven (Teen Titans)" }, tagline: { ru: "Создаю сильный образ и влияю на решение.", kk: "Күшті бейне жасаймын және шешімге ықпал етемін.", en: "I create strong images and influence decisions." } }
    ]
  },
  {
    pair: "AC",
    variants: [
      { gender: "male", name: { ru: "Бэтмен", kk: "Бэтмен", en: "Batman" }, tagline: { ru: "Соединяю креатив с режимом и инструментами.", kk: "Креативті тәртіп және құралдармен ұштастырамын.", en: "I combine creativity with discipline and tools." } },
      { gender: "female", name: { ru: "Рапунцель", kk: "Рапунцель", en: "Rapunzel" }, tagline: { ru: "Придумываю идею и довожу её до аккуратного результата.", kk: "Идея ойлап табамын және оны ұқыпты нәтижеге жеткіземін.", en: "I conceive ideas and bring them to neat results." } }
    ]
  },
  {
    pair: "SR",
    variants: [
      { gender: "male", name: { ru: "Сэм Гэмджи", kk: "Сэм Гэмджи", en: "Sam Gamgee" }, tagline: { ru: "Забочусь о друге и действую по делу.", kk: "Досыма қамқорлық жасаймын және нақты әрекет етемін.", en: "I care for friends and act on what matters." } },
      { gender: "female", name: { ru: "Катара", kk: "Катара", en: "Katara" }, tagline: { ru: "Поддерживаю своих и помогаю в реальном деле.", kk: "Өз адамдарымды қолдаймын және нақты істе көмектесемін.", en: "I support my people and help with real work." } }
    ]
  },
  {
    pair: "SI",
    variants: [
      { gender: "male", name: { ru: "Идзуку Мидория (Деку)", kk: "Идзуку Мидория (Деку)", en: "Izuku Midoriya (Deku)" }, tagline: { ru: "Поддерживаю команду и анализирую, как победить.", kk: "Команданы қолдаймын және қалай жеңуді талдаймын.", en: "I support the team and analyze how to win." } },
      { gender: "female", name: { ru: "Белль", kk: "Белль", en: "Belle" }, tagline: { ru: "Помогаю людям и разбираюсь, как всё устроено.", kk: "Адамдарға көмектесемін және бәрінің қалай істейтінін түсінемін.", en: "I help people and understand how things work." } }
    ]
  },
  {
    pair: "SA",
    variants: [
      { gender: "male", name: { ru: "Хиккап Хэддок", kk: "Хиккап Хэддок", en: "Hiccup Haddock" }, tagline: { ru: "Поддерживаю друзей и нахожу творческий выход.", kk: "Достарымды қолдаймын және шығармашылық жол табамын.", en: "I support friends and find creative solutions." } },
      { gender: "female", name: { ru: "Луна Лавгуд", kk: "Луна Лавгуд", en: "Luna Lovegood" }, tagline: { ru: "Забочусь о других и предлагаю необычное решение.", kk: "Өзгелерге қамқорлық жасаймын және ерекше шешім ұсынамын.", en: "I care for others and offer unusual solutions." } }
    ]
  },
  {
    pair: "SE",
    variants: [
      { gender: "male", name: { ru: "Гарри Поттер", kk: "Гарри Поттер", en: "Harry Potter" }, tagline: { ru: "Берусь за инициативу ради друзей и веду вперёд.", kk: "Достарым үшін бастаманы алып, алға жетелеймін.", en: "I take initiative for friends and lead forward." } },
      { gender: "female", name: { ru: "Чудо-женщина (Диана Принс)", kk: "Диана Принс (Wonder Woman)", en: "Wonder Woman (Diana Prince)" }, tagline: { ru: "Заступаюсь за своих и беру лидерство.", kk: "Өз адамдарымды қорғаймын және лидерлікті аламын.", en: "I stand up for my people and take leadership." } }
    ]
  },
  {
    pair: "SC",
    variants: [
      { gender: "male", name: { ru: "Нед Лидс", kk: "Нед Лидс", en: "Ned Leeds" }, tagline: { ru: "Помогаю команде, организуя процесс и технику.", kk: "Үдеріс пен техниканы ұйымдастырып, командаға көмектесемін.", en: "I help the team by organizing process and tech." } },
      { gender: "female", name: { ru: "Пеппер Поттс", kk: "Пеппер Поттс", en: "Pepper Potts" }, tagline: { ru: "Поддерживаю людей через порядок и договорённости.", kk: "Тәртіп пен келісім арқылы адамдарды қолдаймын.", en: "I support people through order and agreements." } }
    ]
  },
  {
    pair: "ER",
    variants: [
      { gender: "male", name: { ru: "Оптимус Прайм", kk: "Оптимус Прайм", en: "Optimus Prime" }, tagline: { ru: "Веду команду и действую решительно.", kk: "Команданы жетелеймін және батыл әрекет етемін.", en: "I lead the team and act decisively." } },
      { gender: "female", name: { ru: "Гамора", kk: "Гамора", en: "Gamora" }, tagline: { ru: "Беру лидерство и работаю на результат.", kk: "Лидерлікті аламын және нәтижеге жұмыс істеймін.", en: "I take leadership and work for results." } }
    ]
  },
  {
    pair: "EI",
    variants: [
      { gender: "male", name: { ru: "Т'Чалла", kk: "Т'Чалла", en: "T'Challa" }, tagline: { ru: "Вдохновляю видением, подкреплённым анализом.", kk: "Талдаумен бекітілген көзқараспен жігерлендіремін.", en: "I inspire with vision backed by analysis." } },
      { gender: "female", name: { ru: "Окоё", kk: "Окоё", en: "Okoye" }, tagline: { ru: "Руководствуюсь фактами и направляю команду.", kk: "Фактілерге сүйеніп, команданы бағыттаймын.", en: "I follow facts and guide the team." } }
    ]
  },
  {
    pair: "EA",
    variants: [
      { gender: "male", name: { ru: "Джек Воробей", kk: "Джек Воробей", en: "Jack Sparrow" }, tagline: { ru: "Зажигаю харизмой и придумываю эффектные ходы.", kk: "Харизмамен жігерлендіремін және әсерлі қадамдар ойлап табамын.", en: "I ignite with charisma and devise impressive moves." } },
      { gender: "female", name: { ru: "Харли Квинн", kk: "Харли Квинн", en: "Harley Quinn" }, tagline: { ru: "Продаю идею ярко и творчески.", kk: "Идеяны жарқын әрі шығармашылықпен ұсынамын.", en: "I sell ideas brightly and creatively." } }
    ]
  },
  {
    pair: "ES",
    variants: [
      { gender: "male", name: { ru: "Монки Д. Луффи", kk: "Монки Д. Луффи", en: "Monkey D. Luffy" }, tagline: { ru: "Воодушевляю команду и держу её вместе.", kk: "Команданы жігерлендіріп, біріктіріп ұстаймын.", en: "I inspire the team and keep it together." } },
      { gender: "female", name: { ru: "Корра", kk: "Корра", en: "Korra" }, tagline: { ru: "Веду вперёд и поддерживаю свою команду.", kk: "Алға жетелеймін және өз командамды қолдаймын.", en: "I lead forward and support my team." } }
    ]
  },
  {
    pair: "EC",
    variants: [
      { gender: "male", name: { ru: "Клинт Бартон (Соколиный Глаз)", kk: "Клинт Бартон", en: "Clint Barton (Hawkeye)" }, tagline: { ru: "Управляю миссией и держу дисциплину.", kk: "Миссияны басқарып, тәртіпті сақтаймын.", en: "I manage the mission and maintain discipline." } },
      { gender: "female", name: { ru: "Падме Амидала", kk: "Падме Амидала", en: "Padmé Amidala" }, tagline: { ru: "Веду переговоры и организую работу без сбоев.", kk: "Келіссөз жүргіземін және жұмысты мүлтсіз ұйымдастырамын.", en: "I negotiate and organize work flawlessly." } }
    ]
  },
  {
    pair: "CR",
    variants: [
      { gender: "male", name: { ru: "Фил Коулсон", kk: "Фил Коулсон", en: "Phil Coulson" }, tagline: { ru: "Навожу порядок и эффективно действую в поле.", kk: "Тәртіп орнатамын және далада тиімді әрекет етемін.", en: "I bring order and act effectively in the field." } },
      { gender: "female", name: { ru: "Наташа Романофф", kk: "Наташа Романофф", en: "Natasha Romanoff" }, tagline: { ru: "Держу режим и выполняю задачу точно.", kk: "Тәртіпті сақтаймын және тапсырманы дәл орындаймын.", en: "I maintain discipline and execute tasks precisely." } }
    ]
  },
  {
    pair: "CI",
    variants: [
      { gender: "male", name: { ru: "Декстер (Лаборатория Декстера)", kk: "Декстер", en: "Dexter (Dexter's Laboratory)" }, tagline: { ru: "Следую протоколу и проверяю гипотезы.", kk: "Протоколды ұстанамын және гипотезаларды тексеремін.", en: "I follow protocol and test hypotheses." } },
      { gender: "female", name: { ru: "Велма Динкли", kk: "Велма Динкли", en: "Velma Dinkley" }, tagline: { ru: "Систематизирую улики и делаю выводы.", kk: "Айғақтарды жүйелеп, қорытынды жасаймын.", en: "I systematize clues and draw conclusions." } }
    ]
  },
  {
    pair: "CA",
    variants: [
      { gender: "male", name: { ru: "Тед Мосби", kk: "Тед Мосби", en: "Ted Mosby" }, tagline: { ru: "Выстраиваю структуру и придумываю решение.", kk: "Құрылымды құрып, шешім ойлап табамын.", en: "I build structure and devise solutions." } },
      { gender: "female", name: { ru: "Ухура", kk: "Ухура", en: "Uhura" }, tagline: { ru: "Держу порядок и творчески выстраиваю коммуникацию.", kk: "Тәртіпті сақтаймын және байланысты шығармашылықпен құрастырамын.", en: "I maintain order and creatively build communication." } }
    ]
  },
  {
    pair: "CS",
    variants: [
      { gender: "male", name: { ru: "Эльронд", kk: "Эльронд", en: "Elrond" }, tagline: { ru: "Организую процесс и поддерживаю людей.", kk: "Үдерісті ұйымдастырамын және адамдарды қолдаймын.", en: "I organize processes and support people." } },
      { gender: "female", name: { ru: "Гермиона Грейнджер", kk: "Гермиона Грейнджер", en: "Hermione Granger" }, tagline: { ru: "Навожу порядок и помогаю команде идти вперёд.", kk: "Тәртіп орнатамын және команданың алға жылжуына көмектесемін.", en: "I bring order and help the team move forward." } }
    ]
  },
  {
    pair: "CE",
    variants: [
      { gender: "male", name: { ru: "Гранд-мофф Таркин", kk: "Гранд-мофф Таркин", en: "Grand Moff Tarkin" }, tagline: { ru: "Слежу за правилами и руковожу операцией.", kk: "Ережелерді қадағалап, операцияны басқарамын.", en: "I follow rules and command operations." } },
      { gender: "female", name: { ru: "Джин Эрсо", kk: "Джин Эрсо", en: "Jyn Erso" }, tagline: { ru: "Собираю команду и держу план под контролем.", kk: "Команданы жинаймын және жоспарды бақылауда ұстаймын.", en: "I gather the team and keep the plan under control." } }
    ]
  }
];

// Данные о "попробовать уже сейчас"
const TRY_NOW_TASKS: Record<string, { ru: string; kk: string; en: string }> = {
  R: {
    ru: "Собери рабочий прототип/макет и покажи друзьям результат",
    kk: "Жұмыс прототипін/макетін құрастыр және достарыңа нәтижені көрсет",
    en: "Build a working prototype/model and show the result to friends"
  },
  I: {
    ru: "Проведи мини-исследование: вопрос → гипотеза → сбор данных → вывод",
    kk: "Шағын зерттеу жүргіз: сұрақ → болжам → деректер жинау → қорытынды",
    en: "Conduct a mini-research: question → hypothesis → data collection → conclusion"
  },
  A: {
    ru: "Сделай альтернативный формат объяснения темы (комикс/лента/аудио)",
    kk: "Тақырыпты түсіндірудің баламалы форматын жаса (комикс/таспа/аудио)",
    en: "Create an alternative format to explain a topic (comic/video/audio)"
  },
  S: {
    ru: "Помоги однокласснику разобраться в сложной теме или поддержи того, кому нужна помощь",
    kk: "Сыныптасыңа күрделі тақырыпты түсінуге көмектес немесе көмек қажет адамды қолда",
    en: "Help a classmate understand a difficult topic or support someone who needs help"
  },
  E: {
    ru: "Организуй мини-проект или инициативу в школе, соберив единомышленников",
    kk: "Мектепте шағын жоба немесе бастама ұйымдастыр, ойластарды жина",
    en: "Organize a mini-project or initiative at school by gathering like-minded people"
  },
  C: {
    ru: "Создай систему для организации чего-либо: расписание, чек-лист, план",
    kk: "Бір нәрсені ұйымдастыру үшін жүйе жаса: кесте, тексеру тізімі, жоспар",
    en: "Create a system to organize something: schedule, checklist, plan"
  }
};

export const RiasecReport = ({ sessionId, mode = 'counselor', studentGender = 'male' }: Props) => {
  const [data, setData] = useState<RiasecReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  const isStudentMode = mode === 'student';
  
  // Helper для получения локализованного текста
  const getLocalizedText = (textObj: { ru: string; kk: string; en: string }) => {
    return textObj[locale as keyof typeof textObj] || textObj.ru || textObj.kk || textObj.en;
  };

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = isStudentMode 
        ? `/student/riasec/sessions/${sessionId}/result`
        : `/counselor/riasec/sessions/${sessionId}/details`;
      
      const { data: response } = await axiosClient.get(endpoint);
      
      // Адаптируем формат ответа для студента
      if (isStudentMode) {
        setData({
          session: {
            id: response.session_id,
            user_id: 0,
            status: response.status,
            locale: 'ru',
            completed_at: response.completed_at,
            total_time_sec: response.total_time_sec,
            active_time_ms: response.active_time_ms,
          },
          student: {
            id: 0,
            name: '',
            email: '',
          },
          result: {
            riasec_vector: response.riasec_vector,
            riasec_triplet: response.riasec_triplet,
            quality_flags: response.quality_flags || [],
            quality_details: response.quality_details,
          },
        });
      } else {
        setData(response);
      }
    } catch (error: any) {
      message.error(t.riasecReport.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Нормализация баллов для радар-чарта (от 20 до 100)
  // Формула: находим min/max по пользователю, нормируем относительно них
  const getRadarData = () => {
    if (!data?.result.riasec_vector) return [];
    
    const vector = data.result.riasec_vector;
    const values = [vector.R, vector.I, vector.A, vector.S, vector.E, vector.C];
    
    // 1. Находим min и max по пользователю
    const r_min = Math.min(...values);
    const r_max = Math.max(...values);
    
    // 2. Нормируем каждый показатель
    const normalize = (score: number): number => {
      // z = (r - r_min) / (r_max - r_min + 0.0001)
      const z = (score - r_min) / (r_max - r_min + 0.0001);
      // v = (0.2 + 0.8 * z) * 100 -> результат от 20 до 100
      return Math.round((0.2 + 0.8 * z) * 100);
    };
    
    return [
      { type: getLocalizedText(RIASEC_INFO.R.title), value: normalize(vector.R), fullMark: 100 },
      { type: getLocalizedText(RIASEC_INFO.I.title), value: normalize(vector.I), fullMark: 100 },
      { type: getLocalizedText(RIASEC_INFO.A.title), value: normalize(vector.A), fullMark: 100 },
      { type: getLocalizedText(RIASEC_INFO.S.title), value: normalize(vector.S), fullMark: 100 },
      { type: getLocalizedText(RIASEC_INFO.E.title), value: normalize(vector.E), fullMark: 100 },
      { type: getLocalizedText(RIASEC_INFO.C.title), value: normalize(vector.C), fullMark: 100 },
    ];
  };

  const getTop3Letters = () => {
    if (!data?.result.riasec_triplet) return [];
    return data.result.riasec_triplet.split('');
  };

  const getPilot = () => {
    const top3 = getTop3Letters();
    if (top3.length < 2) return null;
    
    const pair = top3[0] + top3[1];
    const pilotData = PILOTS.find(p => p.pair === pair);
    
    if (!pilotData) return null;
    
    // Выбираем вариант по полу студента
    const variant = pilotData.variants.find(v => v.gender === studentGender) || pilotData.variants[0];
    return {
      name: getLocalizedText(variant.name),
      tagline: getLocalizedText(variant.tagline)
    };
  };

  const isReliable = () => {
    if (!data?.result.quality_flags) return true;
    const flags = Array.isArray(data.result.quality_flags) 
      ? data.result.quality_flags 
      : [data.result.quality_flags];
    return !flags.includes('fail') && !flags.includes('warning');
  };

  const getStatusTagFromCheck = (check?: QualityCheckDetail) => {
    if (!check) return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
    
    switch (check.status) {
      case 'ok':
        return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
      case 'warning':
        return <Tag color="error">{t.riasecReport.statusWarning}</Tag>;
      case 'fail':
        return <Tag color="error">{t.riasecReport.statusFail}</Tag>;
      default:
        return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
    }
  };

  // Fallback проверка времени на фронтенде (для старых сессий без quality_details)
  const getTimeStatusTag = (totalTimeSec: number, check?: QualityCheckDetail) => {
    // Если есть проверка от бэкенда, используем её
    if (check?.status) {
      return getStatusTagFromCheck(check);
    }
    // Fallback: проверяем время на фронтенде (10 минут = 600 секунд)
    if (totalTimeSec < 600) {
      return <Tag color="error">{t.riasecReport.statusFail}</Tag>;
    }
    return <Tag color="success">{t.riasecReport.statusOk}</Tag>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">{t.riasecReport.loadingData}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const top3 = getTop3Letters();
  const reliable = isReliable();
  const qd = data.result.quality_details;

  const metricsData = [
    {
      key: "time",
      metric: t.riasecReport.timeSpent,
      value: formatTime(data.session.total_time_sec),
      status: getTimeStatusTag(data.session.total_time_sec, qd?.total_time)
    },
    {
      key: "control",
      metric: t.riasecReport.controlQuestions,
      value: qd?.control_internals?.count === 0
        ? t.riasecReport.noData
        : qd?.control_internals?.discrepancies !== undefined 
          ? `${qd.control_internals.discrepancies} ${t.riasecReport.discrepancies}`
          : `${qd?.control_internals?.count ?? 0} / 4`,
      status: getStatusTagFromCheck(qd?.control_internals)
    },
    {
      key: "straightlining",
      metric: t.riasecReport.straightlining,
      value: qd?.straightlining?.flags_count ?? 0,
      status: getStatusTagFromCheck(qd?.straightlining)
    }
  ];

  const metricsColumns = [
    {
      title: t.riasecReport.metricColumn,
      dataIndex: "metric",
      key: "metric",
    },
    {
      title: t.riasecReport.valueColumn,
      dataIndex: "value",
      key: "value",
    },
    {
      title: t.riasecReport.statusColumn,
      dataIndex: "status",
      key: "status",
    },
  ];

  return (
    <div className="riasec-report">
      {!reliable && !isStudentMode && (
        <Alert
          title={t.riasecReport.unreliableResults}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Card className="riasec-profile-card mb-4">
        <div style={{ position: 'relative' }}>
          {isStudentMode && reliable && (
            <Tag 
              color="success" 
              style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0,
                fontSize: '13px',
                padding: '4px 12px'
              }}
            >
              {t.riasecReport.resultReliable}
            </Tag>
          )}
          <h2 className="riasec-profile-title">
            {isStudentMode 
              ? `${t.riasecReport.yourProfile}: ${top3.join('')} (${t.riasecReport.top3})`
              : `${t.riasecReport.profileTitle}: ${top3.join('')}`
            }
          </h2>
          <p className="riasec-profile-subtitle">
            {isStudentMode
              ? t.riasecReport.profileDescription
              : t.riasecReport.counselorProfileDescription
            }
          </p>
          {isStudentMode && (
            <p className="riasec-disclaimer">
              {t.riasecReport.disclaimer}
            </p>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <div className="riasec-radar-container">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={getRadarData()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="RIASEC"
                dataKey="value"
                stroke="#1890ff"
                fill="#1890ff"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {isStudentMode && getPilot() && (
        <div className="riasec-pilot-section mb-4">
          <div className="riasec-pilot-title">{t.riasecReport.yourPilot}</div>
          <div className="riasec-pilot-name">{getPilot()?.name}</div>
          <div className="riasec-pilot-tagline">{getPilot()?.tagline}</div>
        </div>
      )}

      {!isStudentMode && (
        <Card className="riasec-metrics-card mb-4">
          <h3 className="riasec-metrics-title">{t.riasecReport.metrics}</h3>
          <Table
            columns={metricsColumns}
            dataSource={metricsData}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      <div className="riasec-sections">
        <Collapse defaultActiveKey={top3} ghost>
          {Object.entries(RIASEC_INFO)
            .sort(([codeA], [codeB]) => {
              const vector = data.result.riasec_vector;
              const scoreA = vector[codeA as keyof RiasecVector] || 0;
              const scoreB = vector[codeB as keyof RiasecVector] || 0;
              return scoreB - scoreA; // сортировка по убыванию
            })
            .map(([code, info]) => (
            <Panel 
              header={getLocalizedText(info.title)} 
              key={code}
            >
              <p className="riasec-type-description">
                {getLocalizedText(info.description)}
              </p>
            </Panel>
          ))}
        </Collapse>
      </div>

      {isStudentMode && (
        <Card className="riasec-try-section">
          <h3 className="riasec-try-title">{t.riasecReport.tryNow}</h3>
          {top3.map((letter) => (
            <div key={letter} className="riasec-try-item">
              <div className="riasec-try-item-label">
                {getLocalizedText(RIASEC_INFO[letter].title)}:
              </div>
              <p className="riasec-try-item-text">
                {getLocalizedText(TRY_NOW_TASKS[letter])}
              </p>
            </div>
          ))}
        </Card>
      )}

      {isStudentMode && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate({ to: "/student/tests" })}
          >
            {t.riasecReport.backToTests}
          </Button>
        </div>
      )}
    </div>
  );
};

