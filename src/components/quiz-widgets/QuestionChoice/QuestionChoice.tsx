import { useEffect, useState } from 'react';
import './QuestionChoice.css';

interface Option {
  option_id: string;
  text: {
    ru: string;
    kk: string;
    en: string;
  };
  has_custom_input: boolean;
}

interface QuestionChoiceProps {
  options: Option[];
  locale: string;
  value?: string | null;
  onChange?: (selectedOptionId: string | null) => void;
}

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_110_15115)">
      <path d="M16.9574 5.80933L11.8568 5.06803L9.57662 0.445487C9.51434 0.318925 9.41189 0.216469 9.28532 0.154193C8.96791 -0.00250372 8.5822 0.128077 8.42349 0.445487L6.14336 5.06803L1.04269 5.80933C0.902064 5.82942 0.773493 5.89571 0.675055 5.99616C0.55605 6.11847 0.490472 6.28303 0.492732 6.45367C0.494992 6.62432 0.564905 6.78708 0.687109 6.9062L4.37751 10.5042L3.50564 15.5848C3.48519 15.703 3.49827 15.8245 3.54339 15.9356C3.58851 16.0468 3.66386 16.143 3.76091 16.2135C3.85795 16.284 3.97281 16.3259 4.09244 16.3344C4.21208 16.3429 4.33171 16.3178 4.43778 16.2618L9.00005 13.8631L13.5623 16.2618C13.6869 16.3281 13.8315 16.3502 13.9701 16.3261C14.3197 16.2658 14.5547 15.9343 14.4945 15.5848L13.6226 10.5042L17.313 6.9062C17.4134 6.80776 17.4797 6.67919 17.4998 6.53857C17.5541 6.18701 17.309 5.86156 16.9574 5.80933ZM12.0697 9.99794L12.7949 14.2227L9.00005 12.2299L5.20519 14.2247L5.93041 9.99995L2.86077 7.00665L7.10363 6.38991L9.00005 2.54683L10.8965 6.38991L15.1393 7.00665L12.0697 9.99794Z" fill="black" fillOpacity="0.85"/>
    </g>
    <defs>
      <clipPath id="clip0_110_15115">
        <rect width="18" height="18" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const StarActiveIcon = () => (
  <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.4647 5.72144L11.3641 4.98014L9.08394 0.357597C9.02166 0.231034 8.91921 0.128579 8.79265 0.0663021C8.47524 -0.0903943 8.08952 0.040186 7.93082 0.357597L5.65068 4.98014L0.550013 5.72144C0.409388 5.74153 0.280817 5.80782 0.182379 5.90827C0.0633738 6.03058 -0.00220361 6.19514 5.65431e-05 6.36578C0.0023167 6.53643 0.0722295 6.69919 0.194433 6.81831L3.88483 10.4163L3.01296 15.4969C2.99251 15.6151 3.00559 15.7366 3.05071 15.8477C3.09583 15.9589 3.17119 16.0551 3.26823 16.1256C3.36528 16.1961 3.48013 16.238 3.59977 16.2465C3.7194 16.2551 3.83904 16.2299 3.9451 16.1739L8.50738 13.7752L13.0697 16.1739C13.1942 16.2402 13.3389 16.2623 13.4775 16.2382C13.827 16.1779 14.0621 15.8464 14.0018 15.4969L13.1299 10.4163L16.8203 6.81831C16.9208 6.71987 16.9871 6.5913 17.0072 6.45068C17.0614 6.09911 16.8163 5.77367 16.4647 5.72144Z" fill="#0088FF"/>
  </svg>
);

export function QuestionChoice({
  options,
  locale,
  value,
  onChange = () => {},
}: QuestionChoiceProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(value || null);

  // reset state on question change or value change
  useEffect(() => {
    setSelectedOptionId(value || null);
  }, [options, value]);

  // handle state changes
  useEffect(() => onChange(selectedOptionId), [selectedOptionId]);

  function handleSelect(optionId: string) {
    setSelectedOptionId(optionId);
  }

  function isSelected(optionId: string) {
    return selectedOptionId === optionId;
  }

  // Helper function для получения текста с fallback
  const getLocalizedText = (textObj: { ru?: string; kk?: string; en?: string }) => {
    return textObj[locale as keyof typeof textObj] || textObj.ru || textObj.kk || textObj.en || '';
  };

  return (
    <div className="question-choice">
      {options.map((option) => (
        <div 
          className={`question-choice__option ${isSelected(option.option_id) ? 'active' : ''}`}
          onClick={() => handleSelect(option.option_id)}
          key={option.option_id}
        >
          {isSelected(option.option_id) ? <StarActiveIcon /> : <StarIcon />}

          <span className="question-choice__option-label">
            {getLocalizedText(option.text)}
          </span>
        </div>
      ))}
    </div>
  );
}

