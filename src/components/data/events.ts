import type { CalendarEvent } from '../entities/event.interface'

export const events: CalendarEvent[] = [];

/*
export const events: CalendarEvent[] = [
  {
    id: 1,
    title: "День открытых дверей",
    text: "Знакомство с преподавателями и направлениями обучения",
    type: ["School Event", "Presentation"],
    date: "2025-11-10T00:00:00.000000Z",
    time_from: "10:00",
    time_to: "12:00",
    place: "актовый зал",
    description: "Узнай больше о возможностях школы",
    creator_id: 2,
    created_at: "2025-11-01T12:00:00.000000Z",
    updated_at: "2025-11-01T12:00:00.000000Z",
    classrooms: [
      {
        id: 1,
        school_id: 1,
        name: "Кабинет 10А",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 1, classroom_id: 1 }
      }
    ],
    creator: {
      id: 2,
      name: "Иван Петров",
      email: "ivan@example.com",
      phone: "123456",
      role: "teacher",
      created_at: "2025-11-01T10:00:00.000000Z",
      updated_at: "2025-11-01T10:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 2,
    title: "Встреча с профориентатором",
    text: "Профориентационная лекция для старшеклассников",
    type: ["Lecture", "Career"],
    date: "2025-11-15T00:00:00.000000Z",
    time_from: "14:00",
    time_to: "16:00",
    place: "зал школы",
    description: "Обсуждаем выбор профессий и карьерные перспективы",
    creator_id: 3,
    created_at: "2025-11-02T09:00:00.000000Z",
    updated_at: "2025-11-02T09:00:00.000000Z",
    classrooms: [
      {
        id: 2,
        school_id: 1,
        name: "Кабинет 11Б",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 2, classroom_id: 2 }
      }
    ],
    creator: {
      id: 3,
      name: "Мария Иванова",
      email: "maria@example.com",
      phone: "987654",
      role: "career_counselor",
      created_at: "2025-11-01T09:30:00.000000Z",
      updated_at: "2025-11-01T09:30:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 3,
    title: "Спортивный турнир",
    text: "Соревнования между классами",
    type: ["Competition", "Sport"],
    date: "2025-11-20T00:00:00.000000Z",
    time_from: "09:00",
    time_to: "13:00",
    place: "спортивный зал",
    description: "Турнир по волейболу среди учеников",
    creator_id: 4,
    created_at: "2025-11-03T10:00:00.000000Z",
    updated_at: "2025-11-03T10:00:00.000000Z",
    classrooms: [
      {
        id: 3,
        school_id: 1,
        name: "Кабинет 9А",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 3, classroom_id: 3 }
      }
    ],
    creator: {
      id: 4,
      name: "Андрей Сидоров",
      email: "andrey@example.com",
      phone: "112233",
      role: "coach",
      created_at: "2025-11-01T09:00:00.000000Z",
      updated_at: "2025-11-01T09:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 4,
    title: "Лекция по экологии",
    text: "Интерактивное занятие о защите природы",
    type: ["Lecture", "Ecology"],
    date: "2025-11-25T00:00:00.000000Z",
    time_from: "12:00",
    time_to: "13:30",
    place: "аудитория 204",
    description: "Как сохранить окружающую среду",
    creator_id: 5,
    created_at: "2025-11-04T08:00:00.000000Z",
    updated_at: "2025-11-04T08:00:00.000000Z",
    classrooms: [
      {
        id: 4,
        school_id: 1,
        name: "Кабинет 8Б",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 4, classroom_id: 4 }
      }
    ],
    creator: {
      id: 5,
      name: "Елена Орлова",
      email: "elena@example.com",
      phone: "445566",
      role: "teacher",
      created_at: "2025-11-01T07:00:00.000000Z",
      updated_at: "2025-11-01T07:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 5,
    title: "Музыкальный вечер",
    text: "Выступления школьного оркестра и хора",
    type: ["Art", "Music"],
    date: "2025-11-28T00:00:00.000000Z",
    time_from: "17:00",
    time_to: "19:00",
    place: "актовый зал",
    description: "Наслаждайтесь музыкальными талантами учеников",
    creator_id: 6,
    created_at: "2025-11-05T09:00:00.000000Z",
    updated_at: "2025-11-05T09:00:00.000000Z",
    classrooms: [
      {
        id: 5,
        school_id: 1,
        name: "Кабинет 7А",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 5, classroom_id: 5 }
      }
    ],
    creator: {
      id: 6,
      name: "Светлана Кузнецова",
      email: "svetlana@example.com",
      phone: "998877",
      role: "music_teacher",
      created_at: "2025-11-01T06:00:00.000000Z",
      updated_at: "2025-11-01T06:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 6,
    title: "Выставка рисунков",
    text: "Работы учеников по теме «Мой город»",
    type: ["Art", "Exhibition"],
    date: "2025-12-01T00:00:00.000000Z",
    time_from: "11:00",
    time_to: "14:00",
    place: "фойе школы",
    description: "Открой мир детского творчества",
    creator_id: 7,
    created_at: "2025-11-06T09:00:00.000000Z",
    updated_at: "2025-11-06T09:00:00.000000Z",
    classrooms: [
      {
        id: 6,
        school_id: 1,
        name: "Кабинет 6Б",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 6, classroom_id: 6 }
      }
    ],
    creator: {
      id: 7,
      name: "Ольга Морозова",
      email: "olga@example.com",
      phone: "111000",
      role: "art_teacher",
      created_at: "2025-11-01T06:30:00.000000Z",
      updated_at: "2025-11-01T06:30:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 7,
    title: "Театральная постановка",
    text: "Школьный спектакль по произведению Чехова",
    type: ["Art", "Theater"],
    date: "2025-12-03T00:00:00.000000Z",
    time_from: "18:00",
    time_to: "20:00",
    place: "актовый зал",
    description: "Талантливые актёры из 9-11 классов",
    creator_id: 8,
    created_at: "2025-11-07T08:00:00.000000Z",
    updated_at: "2025-11-07T08:00:00.000000Z",
    classrooms: [
      {
        id: 7,
        school_id: 1,
        name: "Кабинет 11А",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 7, classroom_id: 7 }
      }
    ],
    creator: {
      id: 8,
      name: "Анна Соколова",
      email: "anna@example.com",
      phone: "554433",
      role: "literature_teacher",
      created_at: "2025-11-01T05:00:00.000000Z",
      updated_at: "2025-11-01T05:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 8,
    title: "День науки",
    text: "Выставка научных проектов учеников",
    type: ["Science", "Exhibition"],
    date: "2025-12-05T00:00:00.000000Z",
    time_from: "10:00",
    time_to: "13:00",
    place: "аудитория 301",
    description: "Лучшие научные проекты школы",
    creator_id: 9,
    created_at: "2025-11-08T09:00:00.000000Z",
    updated_at: "2025-11-08T09:00:00.000000Z",
    classrooms: [
      {
        id: 8,
        school_id: 1,
        name: "Кабинет 10Б",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 8, classroom_id: 8 }
      }
    ],
    creator: {
      id: 9,
      name: "Павел Козлов",
      email: "pavel@example.com",
      phone: "123789",
      role: "science_teacher",
      created_at: "2025-11-01T04:00:00.000000Z",
      updated_at: "2025-11-01T04:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 9,
    title: "Математический марафон",
    text: "Соревнование на логику и смекалку",
    type: ["Competition", "Math"],
    date: "2025-12-10T00:00:00.000000Z",
    time_from: "09:00",
    time_to: "11:30",
    place: "кабинет 204",
    description: "Участвуют ученики 8–10 классов",
    creator_id: 10,
    created_at: "2025-11-09T08:00:00.000000Z",
    updated_at: "2025-11-09T08:00:00.000000Z",
    classrooms: [
      {
        id: 9,
        school_id: 1,
        name: "Кабинет 8А",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 9, classroom_id: 9 }
      }
    ],
    creator: {
      id: 10,
      name: "Владимир Никитин",
      email: "vladimir@example.com",
      phone: "556677",
      role: "math_teacher",
      created_at: "2025-11-01T03:00:00.000000Z",
      updated_at: "2025-11-01T03:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 10,
    title: "День здоровья",
    text: "Занятия и игры на свежем воздухе",
    type: ["Sport", "Health"],
    date: "2025-12-15T00:00:00.000000Z",
    time_from: "08:30",
    time_to: "12:00",
    place: "школьный двор",
    description: "Активный день для всех учеников",
    creator_id: 11,
    created_at: "2025-11-10T07:00:00.000000Z",
    updated_at: "2025-11-10T07:00:00.000000Z",
    classrooms: [
      {
        id: 10,
        school_id: 1,
        name: "Кабинет 7Б",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 10, classroom_id: 10 }
      }
    ],
    creator: {
      id: 11,
      name: "Ирина Павлова",
      email: "irina@example.com",
      phone: "112244",
      role: "pe_teacher",
      created_at: "2025-11-01T02:00:00.000000Z",
      updated_at: "2025-11-01T02:00:00.000000Z",
      classroom_id: null
    }
  },
  {
    id: 11,
    title: "Новогодний бал",
    text: "Праздничное мероприятие для всей школы",
    type: ["Holiday", "Party"],
    date: "2025-12-30T00:00:00.000000Z",
    time_from: "17:00",
    time_to: "21:00",
    place: "актовый зал",
    description: "Весёлое завершение учебного года",
    creator_id: 12,
    created_at: "2025-11-11T10:00:00.000000Z",
    updated_at: "2025-11-11T10:00:00.000000Z",
    classrooms: [
      {
        id: 11,
        school_id: 1,
        name: "Кабинет 10А",
        created_at: "2025-11-01T11:00:00.000000Z",
        updated_at: "2025-11-01T11:00:00.000000Z",
        pivot: { event_id: 11, classroom_id: 11 }
      }
    ],
    creator: {
      id: 12,
      name: "Татьяна Белова",
      email: "tatyana@example.com",
      phone: "778899",
      role: "organizer",
      created_at: "2025-11-01T01:00:00.000000Z",
      updated_at: "2025-11-01T01:00:00.000000Z",
      classroom_id: null
    }
  },
]*/
