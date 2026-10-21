import { ValidatorFn } from '@angular/forms';

export interface FormField<T> {
    id: string;
    label: string;
    name: string;
    type: 'text' | 'number' | 'email' | 'password' | 'date' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'color' | 'multiselect' | 'file' | 'texteditor';
    timeOnly?: boolean;
    showTime?: boolean;
    placeholder?: string;
    value?: T | T[];
    compareKey?: string;
    displayKey?: string;
    disabled?: boolean;
    readonly?: boolean;
    options?: T[];
    required?: boolean;
    validation?: ValidatorFn[];
    order?: number;

    // Layout properties
    fullWidth?: boolean; // If true, field spans the full width (2 columns) instead of default 1 column

    // File upload specific properties
    accept?: string;
    multiple?: boolean;
    maxFileSize?: number;
    chooseLabel?: string;
    uploadLabel?: string;
    cancelLabel?: string;
    emptyMessage?: string;
    mode?: 'basic' | 'advanced';
    url?: string;
    showUploadButton?: boolean;
    showCancelButton?: boolean;
    auto?: boolean;

    // datepikcker
    stepMinute?: number;

    // value formatter
    valueFormatter?: (value: T | T[]) => any;
    asyncAction?: (query: any) => Promise<any>;
}

export interface FormSection {
    id: string;
    name: string;
    label?: string;
    fields: FormField<any>[];
    description?: string;
    icon?: string;
    styleClass?: string;
    sectionId?: string;
    groupValidators?: ValidatorFn[];
    order?: number;
}

export interface Structure {
    id: string;
    name: string;
    label: string;
    description?: string;
    icon?: string;
    imgUrl?: string;
    sections: FormSection[];
    globalValidators?: ValidatorFn[];
    styleClass?: string;
    submitButtonLabel?: string;
    cancelButtonLabel?: string;
    hideSubmitButton?: boolean;
    hideCancelButton?: boolean;
}

export const errorMessages: { [key: string]: (errValue: any) => string } = {
    // Field-level validation errors
    required: () => 'Ce champ est obligatoire.',
    email: () => 'Veuillez saisir une adresse e-mail valide.',
    minlength: (err) => `Ce champ doit contenir au moins ${err.requiredLength} caractères.`,
    maxlength: (err) => `Ce champ ne doit pas dépasser ${err.requiredLength} caractères.`,
    min: (err) => `La valeur minimale autorisée est ${err.min}.`,
    max: (err) => `La valeur maximale autorisée est ${err.max}.`,
    pattern: () => 'Le format de la saisie est incorrect.',
    weakPassword: () => 'Le mot de passe est trop faible.',
    passwordDifference: () => 'Les mots de passe ne correspondent pas.',
    underage: () => "L'âge doit être supérieur à 13 ans.",

    // Social media URL validation errors
    socialMediaError: () => "L'URL ne correspond pas au format du reseau.",

    // Group-level validation errors
    namesShouldBeDifferent: () => 'Le prénom et le nom doivent être différents.',
    passwordsDoNotMatch: () => 'Les mots de passe ne correspondent pas.',
    invalidDateRange: () => 'La date de début doit être antérieure à la date de fin.',
    invalidFrenchPostalCode: () => 'Le code postal français doit contenir 5 chiffres.',
    invalidBelgiumPostalCode: () => 'Le code postal belge doit contenir 4 chiffres.',
    contactEmailRequired: () => 'Un email de contact est requis si vous souhaitez recevoir la newsletter.',

    // Generic group validation error
    groupValidationError: () => "Une erreur de validation s'est produite dans cette section."
};
