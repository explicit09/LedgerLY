/**
 * Validation rules for form fields
 */
export interface ValidationRules {
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Minimum length for string/array values
   */
  minLength?: number;
  
  /**
   * Maximum length for string/array values
   */
  maxLength?: number;
  
  /**
   * Minimum value for number values
   */
  min?: number;
  
  /**
   * Maximum value for number values
   */
  max?: number;
  
  /**
   * Regular expression pattern to validate against
   */
  pattern?: {
    value: RegExp | string;
    message: string;
  };
  
  /**
   * Custom validation function
   * @param value The field value to validate
   * @returns Error message if invalid, undefined if valid
   */
  validate?: (value: any) => string | undefined;
  
  /**
   * Custom error message for required validation
   */
  requiredMessage?: string;
  
  /**
   * Custom error message for minLength validation
   */
  minLengthMessage?: string;
  
  /**
   * Custom error message for maxLength validation
   */
  maxLengthMessage?: string;
  
  /**
   * Custom error message for min validation
   */
  minMessage?: string;
  
  /**
   * Custom error message for max validation
   */
  maxMessage?: string;
}

/**
 * Validation result for a form field
 */
export interface ValidationResult {
  /**
   * Whether the field is valid
   */
  isValid: boolean;
  
  /**
   * Error message if the field is invalid
   */
  error?: string;
}

/**
 * Validation result for a form
 */
export interface FormValidationResult {
  /**
   * Whether the form is valid
   */
  isValid: boolean;
  
  /**
   * Object mapping field names to error messages
   */
  errors: Record<string, string>;
}

/**
 * Type for a validation function
 */
export type Validator<T = any> = (value: T) => string | undefined;

/**
 * Type for a validation schema
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRules | Validator<T[K]> | Array<Validator<T[K]>>;
};

/**
 * Creates a validation function from validation rules
 * @param rules Validation rules
 * @returns A validation function
 */
export function createValidator<T = any>(
  rules: ValidationRules = {}
): Validator<T> {
  return (value: T): string | undefined => {
    // Handle required validation
    if (rules.required) {
      if (value === undefined || value === null || value === '') {
        return rules.requiredMessage || 'This field is required';
      }
    }
    
    // Skip further validation if the value is empty (unless it's required)
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    // Handle minLength validation for strings and arrays
    if (rules.minLength !== undefined) {
      const length = Array.isArray(value) ? value.length : String(value).length;
      if (length < rules.minLength) {
        return (
          rules.minLengthMessage ||
          `Must be at least ${rules.minLength} characters`
        );
      }
    }
    
    // Handle maxLength validation for strings and arrays
    if (rules.maxLength !== undefined) {
      const length = Array.isArray(value) ? value.length : String(value).length;
      if (length > rules.maxLength) {
        return (
          rules.maxLengthMessage ||
          `Must be at most ${rules.maxLength} characters`
        );
      }
    }
    
    // Handle min value for numbers
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      return rules.minMessage || `Must be at least ${rules.min}`;
    }
    
    // Handle max value for numbers
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      return rules.maxMessage || `Must be at most ${rules.max}`;
    }
    
    // Handle pattern validation
    if (rules.pattern) {
      const pattern = rules.pattern.value;
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      
      if (!regex.test(String(value))) {
        return rules.pattern.message || 'Invalid format';
      }
    }
    
    // Handle custom validation function
    if (rules.validate) {
      return rules.validate(value);
    }
    
    return undefined;
  };
}

/**
 * Validates a value against validation rules
 * @param value The value to validate
 * @param rules Validation rules
 * @returns Validation result
 */
export function validateValue<T = any>(
  value: T,
  rules: ValidationRules = {}
): ValidationResult {
  const validator = createValidator<T>(rules);
  const error = validator(value);
  
  return {
    isValid: !error,
    error,
  };
}

/**
 * Validates a form object against a validation schema
 * @param values Form values
 * @param schema Validation schema
 * @returns Form validation result
 */
export function validateForm<T extends Record<string, any>>(
  values: T,
  schema: ValidationSchema<T>
): FormValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  for (const field in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, field)) {
      const fieldRules = schema[field];
      
      if (!fieldRules) continue;
      
      const value = values[field];
      let validator: Validator<any>;
      
      if (typeof fieldRules === 'function') {
        // Direct validator function
        validator = fieldRules;
      } else if (Array.isArray(fieldRules)) {
        // Array of validator functions
        validator = (val: any) => {
          for (const validate of fieldRules) {
            const error = validate(val);
            if (error) return error;
          }
          return undefined;
        };
      } else {
        // Validation rules object
        validator = createValidator(fieldRules);
      }
      
      const error = validator(value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }
  
  return {
    isValid,
    errors,
  };
}
