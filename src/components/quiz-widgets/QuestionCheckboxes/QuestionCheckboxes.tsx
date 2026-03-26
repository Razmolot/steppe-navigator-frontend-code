import { useEffect, useId, useState } from 'react';
import './QuestionCheckboxes.css';

interface Option {
  option_id: string;
  text: {
    ru: string;
    kk: string;
    en: string;
  };
  has_custom_input: boolean;
}

interface QuestionCheckboxesProps {
  options: Option[];
  locale: string;
  value?: string[];
  onChange?: (selectedOptionIds: string[]) => void;
}

export function QuestionCheckboxes({ 
  options, 
  locale,
  value,
  onChange = () => {},
}: QuestionCheckboxesProps) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(value || []);
  const controlId = useId();
  
  // reset state on question change or value change
  useEffect(() => {
    setSelectedOptionIds(value || []);
  }, [options, value]);

  // handle state changes
  useEffect(() => onChange(selectedOptionIds), [selectedOptionIds]);

  function updateSelection(optionId: string) {
    // if already selected, remove it
    if (selectedOptionIds.includes(optionId)) {
      const newIds = selectedOptionIds.filter(id => id !== optionId);
      return setSelectedOptionIds(newIds);
    }

    // add to selection
    setSelectedOptionIds([...selectedOptionIds, optionId]);
  }

  function isChecked(optionId: string) {
    return selectedOptionIds.includes(optionId);
  }

  // Helper function для получения текста с fallback
  const getLocalizedText = (textObj: { ru?: string; kk?: string; en?: string }) => {
    return textObj[locale as keyof typeof textObj] || textObj.ru || textObj.kk || textObj.en || '';
  };

  return (
    <div className='question-checkboxes'>
      {options.map((option, index) => (
        <label 
          htmlFor={`${controlId}-${index}`} 
          className='question-checkboxes__option' 
          key={option.option_id}
        >
          <input 
            id={`${controlId}-${index}`}
            onChange={() => updateSelection(option.option_id)}
            checked={isChecked(option.option_id)}
            type='checkbox' 
          />

          <div className='question-checkboxes__option-label'>
            {getLocalizedText(option.text)}
          </div>
        </label>
      ))}
    </div>
  );
}

