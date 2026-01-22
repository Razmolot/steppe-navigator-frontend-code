import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTranslation } from "../../../hooks/useTranslation";
import "./TestNavigation.css";

interface TestNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  loading?: boolean;
}

export const TestNavigation = ({
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  previousLabel,
  nextLabel,
  loading = false,
}: TestNavigationProps) => {
  const { t } = useTranslation();
  
  const prevText = previousLabel || t.testPage.goToPrevious;
  const nextText = nextLabel || t.testPage.goToNext;
  return (
    <div className="test-navigation-buttons">
      <button
        className="test-nav-button test-nav-previous"
        onClick={onPrevious}
        disabled={!canGoPrevious || loading}
      >
        <LeftOutlined />
        <span>{prevText}</span>
      </button>
      <button
        className="test-nav-button test-nav-next"
        onClick={onNext}
        disabled={!canGoNext || loading}
      >
        <span>{nextText}</span>
        <RightOutlined />
      </button>
    </div>
  );
};

