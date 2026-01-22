import { useEffect, useState } from "react";
import { Card, Spin, Button, App, Badge, Collapse } from "antd";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import axiosClient from "../../../api/axiosClient";
import { useTranslation } from "../../../hooks/useTranslation";
import '../../counselor/CounselorTestsPage.css';
import './SoftSkillsResultPage.css';

const { Panel } = Collapse;

// Данные о навигаторах для Soft Skills (аналогично RIASEC PILOTS)
interface SoftNavigator {
  pair: string;
  variants: Array<{
    gender: string;
    name: { ru: string; kk: string; en: string };
    tagline: { ru: string; kk: string; en: string };
  }>;
}

const SOFT_NAVIGATORS: SoftNavigator[] = [
  // comm-* пары
  {
    pair: "comm-team",
    variants: [
      { gender: "male", name: { ru: "Капитан Пикард", kk: "Капитан Пикард", en: "Captain Picard" }, tagline: { ru: "Веду диалог и объединяю команду.", kk: "Диалог жүргіземін және команданы біріктіремін.", en: "I lead dialogue and unite the team." } },
      { gender: "female", name: { ru: "Ухура", kk: "Ухура", en: "Uhura" }, tagline: { ru: "Слышу каждого и помогаю понять друг друга.", kk: "Әркімді естимін және бір-бірін түсінуге көмектесемін.", en: "I hear everyone and help them understand each other." } }
    ]
  },
  {
    pair: "comm-crit",
    variants: [
      { gender: "male", name: { ru: "Шерлок (BBC)", kk: "Шерлок (BBC)", en: "Sherlock (BBC)" }, tagline: { ru: "Объясняю логику и нахожу суть.", kk: "Логиканы түсіндіремін және мәнін табамын.", en: "I explain the logic and find the essence." } },
      { gender: "female", name: { ru: "Лиза Симпсон", kk: "Лиза Симпсон", en: "Lisa Simpson" }, tagline: { ru: "Анализирую и делюсь выводами.", kk: "Талдаймын және қорытындыларымен бөлісемін.", en: "I analyze and share my conclusions." } }
    ]
  },
  {
    pair: "comm-creat",
    variants: [
      { gender: "male", name: { ru: "Джим Керри", kk: "Джим Керри", en: "Jim Carrey" }, tagline: { ru: "Придумываю и доношу идеи ярко.", kk: "Идеялар ойлап табамын және оларды жарқын жеткіземін.", en: "I create and deliver ideas brightly." } },
      { gender: "female", name: { ru: "Эль Вудс", kk: "Эль Вудс", en: "Elle Woods" }, tagline: { ru: "Нахожу творческий подход к любому разговору.", kk: "Кез келген әңгімеге шығармашылық тәсіл табамын.", en: "I find a creative approach to any conversation." } }
    ]
  },
  {
    pair: "comm-emot",
    variants: [
      { gender: "male", name: { ru: "Мистер Роджерс", kk: "Мистер Роджерс", en: "Mister Rogers" }, tagline: { ru: "Говорю с душой и слышу чувства.", kk: "Жүректен сөйлеймін және сезімдерді естимін.", en: "I speak with heart and hear feelings." } },
      { gender: "female", name: { ru: "Опра Уинфри", kk: "Опра Уинфри", en: "Oprah Winfrey" }, tagline: { ru: "Создаю пространство для откровенного разговора.", kk: "Шынайы әңгіме үшін кеңістік жасаймын.", en: "I create space for honest conversation." } }
    ]
  },
  {
    pair: "comm-unc",
    variants: [
      { gender: "male", name: { ru: "Хан Соло", kk: "Хан Соло", en: "Han Solo" }, tagline: { ru: "Договариваюсь на ходу и нахожу выход.", kk: "Жолда келісемін және шығу жолын табамын.", en: "I negotiate on the fly and find a way out." } },
      { gender: "female", name: { ru: "Мулан", kk: "Мулан", en: "Mulan" }, tagline: { ru: "Нахожу слова даже в хаосе.", kk: "Тіпті хаоста да сөз табамын.", en: "I find words even in chaos." } }
    ]
  },
  // team-* пары
  {
    pair: "team-comm",
    variants: [
      { gender: "male", name: { ru: "Сэм Гэмджи", kk: "Сэм Гэмджи", en: "Sam Gamgee" }, tagline: { ru: "Поддерживаю друзей и говорю от сердца.", kk: "Достарымды қолдаймын және жүректен сөйлеймін.", en: "I support friends and speak from the heart." } },
      { gender: "female", name: { ru: "Катара", kk: "Катара", en: "Katara" }, tagline: { ru: "Объединяю команду словом и делом.", kk: "Команданы сөзбен және іспен біріктіремін.", en: "I unite the team with words and actions." } }
    ]
  },
  {
    pair: "team-crit",
    variants: [
      { gender: "male", name: { ru: "Спок", kk: "Спок", en: "Spock" }, tagline: { ru: "Анализирую и помогаю команде выбрать путь.", kk: "Талдаймын және командаға жол таңдауға көмектесемін.", en: "I analyze and help the team choose the path." } },
      { gender: "female", name: { ru: "Гермиона Грейнджер", kk: "Гермиона Грейнджер", en: "Hermione Granger" }, tagline: { ru: "Изучаю проблему и веду команду к решению.", kk: "Мәселені зерттеймін және команданы шешімге жетелеймін.", en: "I study the problem and lead the team to a solution." } }
    ]
  },
  {
    pair: "team-creat",
    variants: [
      { gender: "male", name: { ru: "Фред Уизли", kk: "Фред Уизли", en: "Fred Weasley" }, tagline: { ru: "Придумываю идеи вместе с командой.", kk: "Идеяларды командамен бірге ойлап табамын.", en: "I create ideas together with the team." } },
      { gender: "female", name: { ru: "Рапунцель", kk: "Рапунцель", en: "Rapunzel" }, tagline: { ru: "Вдохновляю друзей на творчество.", kk: "Достарымды шығармашылыққа шабыттандырамын.", en: "I inspire friends to be creative." } }
    ]
  },
  {
    pair: "team-emot",
    variants: [
      { gender: "male", name: { ru: "Стив Роджерс", kk: "Стив Роджерс", en: "Steve Rogers" }, tagline: { ru: "Чувствую команду и поддерживаю каждого.", kk: "Команданы сезінемін және әркімді қолдаймын.", en: "I feel the team and support everyone." } },
      { gender: "female", name: { ru: "Чудо-женщина", kk: "Керемет әйел", en: "Wonder Woman" }, tagline: { ru: "Защищаю своих и верю в людей.", kk: "Өз адамдарымды қорғаймын және адамдарға сенемін.", en: "I protect my people and believe in them." } }
    ]
  },
  {
    pair: "team-unc",
    variants: [
      { gender: "male", name: { ru: "Малкольм Рейнольдс", kk: "Малкольм Рейнольдс", en: "Malcolm Reynolds" }, tagline: { ru: "Держу команду вместе в любой ситуации.", kk: "Команданы кез келген жағдайда біріктіріп ұстаймын.", en: "I keep the team together in any situation." } },
      { gender: "female", name: { ru: "Рей Скайуокер", kk: "Рей Скайуокер", en: "Rey Skywalker" }, tagline: { ru: "Иду вперёд с командой, даже если путь неясен.", kk: "Жол белгісіз болса да командамен алға жүремін.", en: "I move forward with the team even if the path is unclear." } }
    ]
  },
  // crit-* пары
  {
    pair: "crit-comm",
    variants: [
      { gender: "male", name: { ru: "Шерлок Холмс", kk: "Шерлок Холмс", en: "Sherlock Holmes" }, tagline: { ru: "Нахожу суть и объясняю её понятно.", kk: "Мәнін табамын және түсінікті түсіндіремін.", en: "I find the essence and explain it clearly." } },
      { gender: "female", name: { ru: "Оракул", kk: "Оракул", en: "Oracle" }, tagline: { ru: "Собираю данные и делюсь выводами.", kk: "Деректерді жинаймын және қорытындыларымен бөлісемін.", en: "I gather data and share conclusions." } }
    ]
  },
  {
    pair: "crit-team",
    variants: [
      { gender: "male", name: { ru: "Брюс Бэннер", kk: "Брюс Бэннер", en: "Bruce Banner" }, tagline: { ru: "Анализирую и помогаю команде понять.", kk: "Талдаймын және командаға түсінуге көмектесемін.", en: "I analyze and help the team understand." } },
      { gender: "female", name: { ru: "Шури", kk: "Шури", en: "Shuri" }, tagline: { ru: "Исследую и делюсь знаниями с командой.", kk: "Зерттеймін және білімімді командамен бөлісемін.", en: "I research and share knowledge with the team." } }
    ]
  },
  {
    pair: "crit-creat",
    variants: [
      { gender: "male", name: { ru: "Рик Санчез", kk: "Рик Санчез", en: "Rick Sanchez" }, tagline: { ru: "Анализирую и придумываю безумные решения.", kk: "Талдаймын және ерекше шешімдер ойлап табамын.", en: "I analyze and come up with crazy solutions." } },
      { gender: "female", name: { ru: "Булма", kk: "Булма", en: "Bulma" }, tagline: { ru: "Изучаю проблему и изобретаю решение.", kk: "Мәселені зерттеймін және шешім ойлап табамын.", en: "I study the problem and invent a solution." } }
    ]
  },
  {
    pair: "crit-emot",
    variants: [
      { gender: "male", name: { ru: "Профессор Икс", kk: "Профессор Икс", en: "Professor X" }, tagline: { ru: "Понимаю людей и вижу закономерности.", kk: "Адамдарды түсінемін және заңдылықтарды көремін.", en: "I understand people and see patterns." } },
      { gender: "female", name: { ru: "Диана Трой", kk: "Диана Трой", en: "Deanna Troi" }, tagline: { ru: "Чувствую эмоции и анализирую ситуацию.", kk: "Эмоцияларды сеземін және жағдайды талдаймын.", en: "I sense emotions and analyze the situation." } }
    ]
  },
  {
    pair: "crit-unc",
    variants: [
      { gender: "male", name: { ru: "Доктор Стрэндж", kk: "Доктор Стрэндж", en: "Doctor Strange" }, tagline: { ru: "Просчитываю варианты в условиях хаоса.", kk: "Хаос жағдайында нұсқаларды есептеймін.", en: "I calculate options in chaos." } },
      { gender: "female", name: { ru: "Ванда Максимофф", kk: "Ванда Максимофф", en: "Wanda Maximoff" }, tagline: { ru: "Исследую неизвестное и нахожу закономерности.", kk: "Белгісізді зерттеймін және заңдылықтарды табамын.", en: "I explore the unknown and find patterns." } }
    ]
  },
  // creat-* пары
  {
    pair: "creat-comm",
    variants: [
      { gender: "male", name: { ru: "Локи", kk: "Локи", en: "Loki" }, tagline: { ru: "Придумываю и подаю идеи эффектно.", kk: "Идеялар ойлап табамын және әсерлі ұсынамын.", en: "I create and present ideas effectively." } },
      { gender: "female", name: { ru: "Харли Квинн", kk: "Харли Квинн", en: "Harley Quinn" }, tagline: { ru: "Креативлю и доношу это до всех.", kk: "Шығармашылықпен жасаймын және барлығына жеткіземін.", en: "I create and communicate it to everyone." } }
    ]
  },
  {
    pair: "creat-team",
    variants: [
      { gender: "male", name: { ru: "Питер Квилл", kk: "Питер Квилл", en: "Peter Quill" }, tagline: { ru: "Вдохновляю команду на дерзкие идеи.", kk: "Команданы батыл идеяларға шабыттандырамын.", en: "I inspire the team with bold ideas." } },
      { gender: "female", name: { ru: "Анна", kk: "Анна", en: "Anna" }, tagline: { ru: "Придумываю вместе с друзьями.", kk: "Достарыммен бірге ойлап табамын.", en: "I create together with friends." } }
    ]
  },
  {
    pair: "creat-crit",
    variants: [
      { gender: "male", name: { ru: "Тони Старк", kk: "Тони Старк", en: "Tony Stark" }, tagline: { ru: "Изобретаю и проверяю на практике.", kk: "Ойлап табамын және іс жүзінде тексеремін.", en: "I invent and test in practice." } },
      { gender: "female", name: { ru: "Велма Динкли", kk: "Велма Динкли", en: "Velma Dinkley" }, tagline: { ru: "Нахожу нестандартные решения через анализ.", kk: "Талдау арқылы стандарттан тыс шешімдер табамын.", en: "I find unconventional solutions through analysis." } }
    ]
  },
  {
    pair: "creat-emot",
    variants: [
      { gender: "male", name: { ru: "Хиккап Хэддок", kk: "Хиккап Хэддок", en: "Hiccup Haddock" }, tagline: { ru: "Придумываю с душой и заботой.", kk: "Жүрек пен қамқорлықпен ойлап табамын.", en: "I create with heart and care." } },
      { gender: "female", name: { ru: "Луна Лавгуд", kk: "Луна Лавгуд", en: "Luna Lovegood" }, tagline: { ru: "Творю и чувствую мир по-своему.", kk: "Өзімше жасаймын және әлемді сеземін.", en: "I create and feel the world in my own way." } }
    ]
  },
  {
    pair: "creat-unc",
    variants: [
      { gender: "male", name: { ru: "Джек Воробей", kk: "Джек Воробей", en: "Jack Sparrow" }, tagline: { ru: "Импровизирую и нахожу неожиданные ходы.", kk: "Импровизация жасаймын және күтпеген қадамдар табамын.", en: "I improvise and find unexpected moves." } },
      { gender: "female", name: { ru: "Рэйвен", kk: "Рэйвен", en: "Raven" }, tagline: { ru: "Творю в хаосе и нахожу свой путь.", kk: "Хаоста жасаймын және өз жолымды табамын.", en: "I create in chaos and find my way." } }
    ]
  },
  // emot-* пары
  {
    pair: "emot-comm",
    variants: [
      { gender: "male", name: { ru: "Тед Лассо", kk: "Тед Лассо", en: "Ted Lasso" }, tagline: { ru: "Чувствую людей и нахожу нужные слова.", kk: "Адамдарды сеземін және қажетті сөздерді табамын.", en: "I feel people and find the right words." } },
      { gender: "female", name: { ru: "Мойра Роуз", kk: "Мойра Роуз", en: "Moira Rose" }, tagline: { ru: "Выражаю эмоции и вдохновляю других.", kk: "Эмоцияларды білдіремін және басқаларды шабыттандырамын.", en: "I express emotions and inspire others." } }
    ]
  },
  {
    pair: "emot-team",
    variants: [
      { gender: "male", name: { ru: "Наруто Узумаки", kk: "Наруто Узумаки", en: "Naruto Uzumaki" }, tagline: { ru: "Верю в друзей и не сдаюсь.", kk: "Достарыма сенемін және бас тартпаймын.", en: "I believe in friends and never give up." } },
      { gender: "female", name: { ru: "Мирабель", kk: "Мирабель", en: "Mirabel" }, tagline: { ru: "Чувствую семью и держу всех вместе.", kk: "Отбасын сеземін және барлығын біріктіремін.", en: "I feel family and keep everyone together." } }
    ]
  },
  {
    pair: "emot-crit",
    variants: [
      { gender: "male", name: { ru: "Аттикус Финч", kk: "Аттикус Финч", en: "Atticus Finch" }, tagline: { ru: "Понимаю людей и ищу справедливость.", kk: "Адамдарды түсінемін және әділдік іздеймін.", en: "I understand people and seek justice." } },
      { gender: "female", name: { ru: "Эль (Stranger Things)", kk: "Эль (Stranger Things)", en: "Eleven" }, tagline: { ru: "Чувствую глубоко и вижу скрытое.", kk: "Терең сеземін және жасырынды көремін.", en: "I feel deeply and see the hidden." } }
    ]
  },
  {
    pair: "emot-creat",
    variants: [
      { gender: "male", name: { ru: "Питер Паркер", kk: "Питер Паркер", en: "Peter Parker" }, tagline: { ru: "Переживаю за всех и придумываю выход.", kk: "Барлығы үшін алаңдаймын және шығу жолын табамын.", en: "I care for everyone and find a way out." } },
      { gender: "female", name: { ru: "Камала Хан", kk: "Камала Хан", en: "Kamala Khan" }, tagline: { ru: "Чувствую и творю с энтузиазмом.", kk: "Сеземін және ынтамен жасаймын.", en: "I feel and create with enthusiasm." } }
    ]
  },
  {
    pair: "emot-unc",
    variants: [
      { gender: "male", name: { ru: "Аанг", kk: "Аанг", en: "Aang" }, tagline: { ru: "Чувствую мир и иду вперёд с надеждой.", kk: "Әлемді сеземін және үмітпен алға жүремін.", en: "I feel the world and move forward with hope." } },
      { gender: "female", name: { ru: "Корра", kk: "Корра", en: "Korra" }, tagline: { ru: "Переживаю и действую, даже когда страшно.", kk: "Қорықсам да алаңдаймын және әрекет етемін.", en: "I care and act even when scared." } }
    ]
  },
  // unc-* пары
  {
    pair: "unc-comm",
    variants: [
      { gender: "male", name: { ru: "Индиана Джонс", kk: "Индиана Джонс", en: "Indiana Jones" }, tagline: { ru: "Иду в неизвестность и договариваюсь по ходу.", kk: "Белгісіздікке барамын және жолда келісемін.", en: "I go into the unknown and negotiate along the way." } },
      { gender: "female", name: { ru: "Лара Крофт", kk: "Лара Крофт", en: "Lara Croft" }, tagline: { ru: "Исследую и нахожу общий язык с любым.", kk: "Зерттеймін және кез келгенмен ортақ тіл табамын.", en: "I explore and find common ground with anyone." } }
    ]
  },
  {
    pair: "unc-team",
    variants: [
      { gender: "male", name: { ru: "Оуэн Грейди", kk: "Оуэн Грейди", en: "Owen Grady" }, tagline: { ru: "Веду команду через любые испытания.", kk: "Кез келген сынақтар арқылы команданы жетелеймін.", en: "I lead the team through any challenges." } },
      { gender: "female", name: { ru: "Гамора", kk: "Гамора", en: "Gamora" }, tagline: { ru: "Действую в хаосе и держу команду.", kk: "Хаоста әрекет етемін және команданы ұстаймын.", en: "I act in chaos and hold the team." } }
    ]
  },
  {
    pair: "unc-crit",
    variants: [
      { gender: "male", name: { ru: "Итан Хант", kk: "Итан Хант", en: "Ethan Hunt" }, tagline: { ru: "Просчитываю риски на ходу.", kk: "Тәуекелдерді жолда есептеймін.", en: "I calculate risks on the fly." } },
      { gender: "female", name: { ru: "Наташа Романофф", kk: "Наташа Романофф", en: "Natasha Romanoff" }, tagline: { ru: "Анализирую ситуацию и адаптируюсь.", kk: "Жағдайды талдаймын және бейімделемін.", en: "I analyze the situation and adapt." } }
    ]
  },
  {
    pair: "unc-creat",
    variants: [
      { gender: "male", name: { ru: "Маверик", kk: "Маверик", en: "Maverick" }, tagline: { ru: "Импровизирую и нахожу нестандартные решения.", kk: "Импровизация жасаймын және стандарттан тыс шешімдер табамын.", en: "I improvise and find unconventional solutions." } },
      { gender: "female", name: { ru: "Фуриоса", kk: "Фуриоса", en: "Furiosa" }, tagline: { ru: "Творю в условиях хаоса и веду за собой.", kk: "Хаос жағдайында жасаймын және соңымнан ертемін.", en: "I create in chaos and lead the way." } }
    ]
  },
  {
    pair: "unc-emot",
    variants: [
      { gender: "male", name: { ru: "Форрест Гамп", kk: "Форрест Гамп", en: "Forrest Gump" }, tagline: { ru: "Иду вперёд с добрым сердцем.", kk: "Жақсы жүрекпен алға жүремін.", en: "I move forward with a kind heart." } },
      { gender: "female", name: { ru: "Джой (Головоломка)", kk: "Джой (Головоломка)", en: "Joy (Inside Out)" }, tagline: { ru: "Нахожу радость даже в неизвестности.", kk: "Тіпті белгісіздікте де қуаныш табамын.", en: "I find joy even in uncertainty." } }
    ]
  }
];

interface SoftSkillsResult {
  session_id: string;
  status: string;
  completed_at: string;
  soft_skills_vector: {
    comm: number;
    team: number;
    crit: number;
    creat: number;
    unc: number;
    emot: number;
  } | null;
  soft_skills_triplet: string[] | null;
  quality_flags: string[] | null;
  quality_details: any;
  total_time_sec: number;
  active_time_ms: number;
}

export const SoftSkillsResultPage = () => {
  const { sessionId } = useParams({ strict: false });
  const [result, setResult] = useState<SoftSkillsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  
  // Helper для локализованного текста
  const getLocalizedText = (textObj: { ru: string; kk: string; en: string }) => {
    return textObj[locale as keyof typeof textObj] || textObj.ru;
  };
  
  // Получить навигатора на основе первых 2 навыков триплета
  const getNavigator = () => {
    if (!result?.soft_skills_triplet || result.soft_skills_triplet.length < 2) return null;
    
    const pair = `${result.soft_skills_triplet[0]}-${result.soft_skills_triplet[1]}`;
    const navigatorData = SOFT_NAVIGATORS.find(n => n.pair === pair);
    
    if (!navigatorData) return null;
    
    // Пока используем первый вариант (можно добавить выбор по полу позже)
    const variant = navigatorData.variants[0];
    return {
      name: getLocalizedText(variant.name),
      tagline: getLocalizedText(variant.tagline)
    };
  };

  useEffect(() => {
    if (sessionId) {
      loadResult();
    }
  }, [sessionId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/student/soft-skills/sessions/${sessionId}/result`);
      setResult(data);
    } catch (error: any) {
      message.error(error?.response?.data?.error || t.softSkillsReport.errorLoading);
      navigate({ to: "/student/tests" });
    } finally {
      setLoading(false);
    }
  };

  const getSkillName = (code: string) => {
    return t.softSkillsReport.skills[code as keyof typeof t.softSkillsReport.skills] || code;
  };

  const getSkillDescription = (code: string) => {
    return t.softSkillsReport.skillDescriptions[code as keyof typeof t.softSkillsReport.skillDescriptions] || '';
  };

  const getSkillTask = (code: string) => {
    return t.softSkillsReport.skillTasks[code as keyof typeof t.softSkillsReport.skillTasks] || '';
  };

  // Нормализация баллов для радар-чарта (от 20 до 100)
  // Формула: находим min/max по пользователю, нормируем относительно них
  const getRadarData = () => {
    if (!result?.soft_skills_vector) return [];
    
    const vector = result.soft_skills_vector;
    const values = [vector.comm, vector.team, vector.crit, vector.creat, vector.emot, vector.unc];
    
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
      { type: getSkillName('comm'), value: normalize(vector.comm), fullMark: 100 },
      { type: getSkillName('team'), value: normalize(vector.team), fullMark: 100 },
      { type: getSkillName('crit'), value: normalize(vector.crit), fullMark: 100 },
      { type: getSkillName('creat'), value: normalize(vector.creat), fullMark: 100 },
      { type: getSkillName('emot'), value: normalize(vector.emot), fullMark: 100 },
      { type: getSkillName('unc'), value: normalize(vector.unc), fullMark: 100 },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip={t.softSkillsReport.loading}>
          <div style={{ padding: '50px' }} />
        </Spin>
      </div>
    );
  }

  if (!result || !result.soft_skills_vector || !result.soft_skills_triplet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip={t.softSkillsReport.notReady}>
          <div style={{ padding: '50px' }} />
        </Spin>
      </div>
    );
  }

  // Топ-3 навыка
  const top3Skills = result.soft_skills_triplet.slice(0, 3);
  const top3Names = top3Skills.map(skill => getSkillName(skill)).join(' - ');

  // Проверка качества
  const isQualityGood = !result.quality_flags || 
    result.quality_flags.length === 0 || 
    !result.quality_flags.includes('fail');

  // Сортируем навыки по баллам для правильного порядка в Collapse
  const getSortedSkills = () => {
    if (!result.soft_skills_vector) return [];
    const vector = result.soft_skills_vector;
    return Object.entries(vector)
      .sort(([, a], [, b]) => b - a)
      .map(([code]) => code);
  };

  const sortedSkills = getSortedSkills();

  return (
    <div className="counselor-tests-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item"><Link to="/student/tests">{t.nav.tests}</Link></span>
          <span className="breadcrumb-item"> / </span>
          <span className="breadcrumb-item current">{t.tests.softSkills}</span>
        </div>
        <div className="page-title-wrapper">
          <h1 className="page-title">{t.tests.softSkills}</h1>
        </div>
      </div>

      <div className="px-6 pb-6">
        <Card className="soft-skills-result-card">
          {/* Заголовок */}
          <div className="result-header">
            <h1 className="result-title">{t.softSkillsReport.yourProfile}: {top3Names} ({t.softSkillsReport.top3})</h1>
            <p className="result-subtitle">
              {t.softSkillsReport.profileDescription}
            </p>
          </div>

          {/* Бэйдж надежности */}
          {isQualityGood && (
            <div className="quality-badge-section">
              <Badge status="success" text={t.softSkillsReport.resultReliable} className="quality-badge-text" />
            </div>
          )}

          {/* График - радар */}
          <div className="chart-section">
            <div className="radar-container">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Soft Skills"
                    dataKey="value"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Персонаж */}
          {getNavigator() && (
            <div className="character-section">
              <div className="character-label">{t.softSkillsReport.yourNavigator}</div>
              <h3 className="character-title">{getNavigator()?.name}</h3>
              <p className="character-description">{getNavigator()?.tagline}</p>
            </div>
          )}

          {/* Раскрывающиеся описания навыков */}
          <div className="skills-collapse-section">
            <Collapse defaultActiveKey={top3Skills} ghost>
              {sortedSkills.map((code) => {
                const skillName = getSkillName(code);
                const skillDesc = getSkillDescription(code);
                
                if (!skillName || !skillDesc) return null;
                
                return (
                  <Panel 
                    header={skillName} 
                    key={code}
                    className="skill-collapse-panel"
                  >
                    <p className="skill-collapse-description">
                      {skillDesc}
                    </p>
                  </Panel>
                );
              })}
            </Collapse>
          </div>

          {/* Попробовать уже сейчас */}
          <div className="tasks-section">
            <h3 className="tasks-title">{t.softSkillsReport.tryNow}</h3>
            <div className="tasks-list">
              {top3Skills.map((skill) => (
                <div key={skill} className="task-item">
                  <div className="task-header">
                    <strong>{getSkillName(skill)}:</strong>
                  </div>
                  <div className="task-text">«{getSkillTask(skill)}»</div>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="result-actions">
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate({ to: "/student/tests" })}
              className="return-button"
            >
              {t.softSkillsReport.backToTests}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

