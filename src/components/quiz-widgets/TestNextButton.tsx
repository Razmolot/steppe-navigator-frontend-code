import { Button } from "antd";
import "./TestNextButton.css";

interface TestNextButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const TestNextButton = ({ 
  onClick, 
  disabled = false, 
  loading = false
}: TestNextButtonProps) => {
  return (
    <Button 
      type="primary" 
      size="large"
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className="test-next-button"
    >
      перейти к следующему вопросу
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 9L7.5 6L4.5 3" stroke="#1890FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Button>
  );
};

