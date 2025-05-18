interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: {
    value: RegExp;
    message: string;
  };
  validate?: (value: string) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateField = (
  name: string,
  value: string,
  rules: ValidationRules
): string | null => {
  if (rules.required && !value.trim()) {
    return `${name} is required`;
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `${name} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `${name} must be less than ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.value.test(value)) {
    return rules.pattern.message;
  }

  if (rules.validate) {
    const customValidation = rules.validate(value);
    if (typeof customValidation === 'string') {
      return customValidation;
    }
    if (customValidation === false) {
      return `Invalid ${name.toLowerCase()}`;
    }
  }

  return null;
};

export const validateForm = (
  formData: Record<string, string>,
  validationRules: Record<string, ValidationRules>
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(validationRules).forEach((fieldName) => {
    const error = validateField(
      fieldName,
      formData[fieldName] || '',
      validationRules[fieldName]
    );

    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRules: ValidationRules = {
  required: true,
  minLength: 8,
  validate: (value: string) => {
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (![0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(value)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return true;
  },
};
