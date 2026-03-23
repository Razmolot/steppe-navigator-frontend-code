import {
    RouterProvider,
    Router,
    Route,
    RootRoute,
    Outlet,
} from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import enUS from "antd/locale/en_US";
import { useLanguageStore } from "../store/useLanguageStore";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import "dayjs/locale/kk";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";
import { Layout } from "../components/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthLayout } from "../components/AuthLayout";
import { Profile } from "./Profile";
import {SchoolsPage} from "./SchoolPage.tsx";
import {ClassroomsPage} from "./ClassroomsPage.tsx";
import {CareerCounselorsPage} from "./CareerCounselorsPage.tsx";
import {StudentsPage} from "./StudentsPage.tsx";
import {ForgotPasswordPage} from "./ForgotPasswordPage.tsx";
import {ResetPasswordPage} from "./ResetPasswordPage.tsx";
import {CounselorEventsPage} from "./CounselorEventsPage.tsx";
import {StudentsEventsPage} from "./StudentsEventsPage.tsx";
import {AssignTestsPage} from "./AssignTestsPage.tsx";
import {ClassroomAssignmentsPage} from "./ClassroomAssignmentsPage.tsx";
import {MyTestsPage} from "./student/MyTestsPage.tsx";
import {RiasecTestPage} from "./student/tests/RiasecTestPage.tsx";
import {SoftSkillsTestPage} from "./student/tests/SoftSkillsTestPage.tsx";
import {High5TestPage} from "./student/tests/High5TestPage.tsx";
import {QuestionnaireTestPage} from "./student/tests/QuestionnaireTestPage.tsx";
import {TestResultPage} from "./student/results/TestResultPage.tsx";
import {RiasecResultPage} from "./student/results/RiasecResultPage.tsx";
import {SoftSkillsResultPage} from "./student/results/SoftSkillsResultPage.tsx";
import {High5ResultPage} from "./student/results/High5ResultPage.tsx";
import {QuestionnaireResultPage} from "./student/results/QuestionnaireResultPage.tsx";
import {StudentResultsPage} from "./counselor/StudentResultsPage.tsx";
import {ClassroomResultsPage} from "./counselor/ClassroomResultsPage.tsx";
import {CounselorTestsPage} from "./counselor/CounselorTestsPage.tsx";
import {CareerGuidancePage} from "./counselor/CareerGuidancePage.tsx";
import {CareerReportPage} from "./counselor/CareerReportPage.tsx";
import {StudentCareerReportPage} from "./student/CareerReportPage.tsx";
import {SchoolReportPage} from "./counselor/SchoolReportPage.tsx";
import {LibraryPage} from "./LibraryPage.tsx";

const rootRoute = new RootRoute({
    component: () => (
        <div>
            <Outlet />
        </div>
    ),
});

const loginRoute = new Route({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: () => (
        <AuthLayout>
            <Login />
        </AuthLayout>
    ),
});

const protectedRoute = new Route({
    getParentRoute: () => rootRoute,
    id: "protected",
    component: () => (
        <ProtectedRoute>
            <Layout />
        </ProtectedRoute>
    ),
});

const dashboardRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/",
    component: Dashboard,
});

const profileRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/profile",
    component: Profile, // 👈 страница профиля
});

const schoolsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/schools",
    component: SchoolsPage,
});

const classroomsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/classrooms",
    component: ClassroomsPage,
});

const careerCounselorsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/career-counselors",
    component: CareerCounselorsPage,
});

const studentsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/students",
    component: StudentsPage,
});

const forgotPasswordRoute = new Route({
    getParentRoute: () => rootRoute,
    path: "/forgot-password",
    component: ForgotPasswordPage,
});

const resetPasswordRoute = new Route({
    getParentRoute: () => rootRoute,
    path: "/reset-password",
    component: ResetPasswordPage,
});

const counselorEventsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/events",
    component: CounselorEventsPage,
});

const studentsEventsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/events",
    component: StudentsEventsPage,
});

const assignTestsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/tests/assign/assign-tests",
    component: AssignTestsPage,
});

const assignClassroomsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/tests/assign/classrooms",
    component: ClassroomAssignmentsPage,
});

const studentMyTestsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests",
    component: MyTestsPage,
});

const studentRiasecTestRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/riasec/$id",
    component: RiasecTestPage,
});

const studentSoftSkillsTestRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/soft-skills/$id",
    component: SoftSkillsTestPage,
});

const studentHigh5TestRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/high5/$id",
    component: High5TestPage,
});

const studentQuestionnaireTestRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/questionnaire/$id",
    component: QuestionnaireTestPage,
});

const studentRiasecResultRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/riasec/result/$sessionId",
    component: RiasecResultPage,
});

const studentSoftSkillsResultRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/soft-skills/result/$sessionId",
    component: SoftSkillsResultPage,
});

const studentHigh5ResultRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/high5/result/$sessionId",
    component: High5ResultPage,
});

const studentTestResultRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/$testType/result/$sessionId",
    component: TestResultPage,
});

const studentQuestionnaireResultRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/tests/questionnaire/result/$sessionId",
    component: QuestionnaireResultPage,
});

const counselorStudentResultsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/students/$studentId/results",
    component: StudentResultsPage,
});

const counselorClassroomResultsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/classrooms/$classroomId/results",
    component: ClassroomResultsPage,
});

const counselorTestsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/tests",
    component: CounselorTestsPage,
});

// Career Guidance Routes
const counselorCareerGuidanceRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/career/students/$studentId",
    component: CareerGuidancePage,
});

const counselorCareerReportRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/career/reports/$reportId",
    component: CareerReportPage,
});

const studentCareerReportRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/student/career/report",
    component: StudentCareerReportPage,
});

const schoolReportRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/counselor/reports/school",
    component: SchoolReportPage,
});

const libraryRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: "/library",
    component: LibraryPage,
});

const routeTree = rootRoute.addChildren([
    loginRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    protectedRoute.addChildren([
        dashboardRoute,
        profileRoute,
        schoolsRoute,
        classroomsRoute,
        careerCounselorsRoute,
        studentsRoute,
        counselorEventsRoute,
        studentsEventsRoute,
        assignTestsRoute,
        assignClassroomsRoute,
        studentMyTestsRoute,
        studentRiasecTestRoute,
        studentSoftSkillsTestRoute,
        studentHigh5TestRoute,
        studentQuestionnaireTestRoute,
        studentRiasecResultRoute,
        studentSoftSkillsResultRoute,
        studentHigh5ResultRoute,
        studentTestResultRoute,
        studentQuestionnaireResultRoute,
        counselorStudentResultsRoute,
        counselorClassroomResultsRoute,
        counselorTestsRoute,
        counselorCareerGuidanceRoute,
        counselorCareerReportRoute,
        studentCareerReportRoute,
        schoolReportRoute,
        libraryRoute
    ]),
]);

const router = new Router({ routeTree, basepath: "/app" });

// Маппинг локалей для Ant Design
const antdLocales = {
  ru: ruRU,
  kk: ruRU, // Казахский использует русскую локаль как fallback (Ant Design не имеет kk)
  en: enUS,
};

const AppContent = () => {
  const { locale } = useLanguageStore();
  
  // Устанавливаем локаль для dayjs (используется в DatePicker)
  dayjs.locale(locale === 'kk' ? 'kk' : locale);
  
  return (
    <ConfigProvider locale={antdLocales[locale]}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
};

export const AppRoutes = () => <AppContent />;
